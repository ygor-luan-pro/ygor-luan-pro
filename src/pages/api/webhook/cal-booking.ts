import { createHmac, timingSafeEqual } from "node:crypto";
import type { APIRoute } from "astro";
import { consumeRateLimit, getClientIp } from "../../../lib/rate-limit";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface CalBookingPayload {
  startTime: string;
  attendees: Array<{ email: string; name?: string | null }>;
  videoCallData?: { url?: string };
  meetingUrl?: string;
}

function isCalBookingPayload(v: unknown): v is CalBookingPayload {
  if (typeof v !== "object" || v === null) return false;
  const b = v as Record<string, unknown>;
  return typeof b.startTime === "string" && Array.isArray(b.attendees);
}

function verifyCalSignature(body: string, signature: string, secret: string): boolean {
  const computed = createHmac("sha256", secret).update(body).digest("hex");
  if (computed.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export const POST: APIRoute = async ({ request }) => {
  const rateLimit = await consumeRateLimit({
    bucket: "webhook-cal-booking",
    identifier: getClientIp(request.headers),
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      },
    });
  }

  const rawBody = await request.text();

  const signature = request.headers.get("X-Cal-Signature-256") ?? "";
  const secret = import.meta.env.CAL_WEBHOOK_SECRET;
  if (!secret || !verifyCalSignature(rawBody, signature, secret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.triggerEvent !== "BOOKING_CREATED") {
    return new Response("OK", { status: 200 });
  }

  if (!isCalBookingPayload(payload.payload)) {
    return new Response("Missing attendee email", { status: 400 });
  }

  const booking = payload.payload;
  const attendeeEmail = booking.attendees[0]?.email;

  if (!attendeeEmail) {
    return new Response("Missing attendee email", { status: 400 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", attendeeEmail)
    .single();

  if (!profile) {
    return new Response("OK", { status: 200 });
  }

  const meetingUrl = booking.videoCallData?.url ?? booking.meetingUrl ?? "";

  const { error: insertError } = await supabaseAdmin.from("mentorship_sessions").insert({
    user_id: profile.id,
    scheduled_at: booking.startTime,
    meeting_url: meetingUrl,
    status: "scheduled",
    reminder_sent: false,
  });

  if (insertError) {
    console.error("cal-booking: erro ao inserir mentorship_session", insertError);
  }

  return new Response("OK", { status: 200 });
};
