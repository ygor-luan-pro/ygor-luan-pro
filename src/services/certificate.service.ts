import { supabaseAdmin } from "../lib/supabase-admin";
import type { Certificate } from "../types";
import { ProgressService } from "./progress.service";

type CertWithProfile = Certificate & {
  profiles: { full_name: string | null } | null;
};

type CertWithFullProfile = Certificate & {
  profiles: { full_name: string | null; email: string } | null;
};

export type CertificatePublic = Certificate & { student_name: string | null };
export type CertificateWithStudent = Certificate & {
  student_name: string | null;
  student_email: string;
};

export class CertificateService {
  static async isEligible(userId: string): Promise<boolean> {
    const stats = await ProgressService.getStudentStats(userId);
    return stats.total_lessons > 0 && stats.completed_count === stats.total_lessons;
  }

  static async getCompletionDate(userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin.rpc("get_completion_date", {
      p_user_id: userId,
    });

    if (error) throw new Error(error.message);
    return data ?? null;
  }

  static async issue(userId: string, completedAt: string): Promise<Certificate> {
    const { data, error } = await supabaseAdmin
      .from("certificates")
      .upsert(
        { user_id: userId, completed_at: completedAt },
        { onConflict: "user_id", ignoreDuplicates: true },
      )
      .select()
      .single();

    if (data) return data;

    if ((error as { code?: string } | null)?.code === "PGRST116") {
      const existing = await CertificateService.getByUserId(userId);
      if (existing) return existing;
    }

    throw new Error(
      (error as { message?: string } | null)?.message ?? "Erro ao emitir certificado",
    );
  }

  static async getByUserId(userId: string): Promise<Certificate | null> {
    const { data, error } = await supabaseAdmin
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .single();

    if ((error as { code?: string } | null)?.code === "PGRST116") return null;
    if (error) throw new Error((error as { message: string }).message);
    return data;
  }

  static async getByCode(code: string): Promise<CertificatePublic | null> {
    const raw = await supabaseAdmin
      .from("certificates")
      .select("*, profiles(full_name)")
      .eq("certificate_number", code)
      .single();

    const { data, error } = raw as unknown as {
      data: CertWithProfile | null;
      error: { code?: string; message: string } | null;
    };

    if (error?.code === "PGRST116") return null;
    if (error) throw new Error(error.message);
    if (!data) return null;

    const { profiles, ...cert } = data;
    return { ...cert, student_name: profiles?.full_name ?? null };
  }

  static async getAllAdmin(): Promise<CertificateWithStudent[]> {
    const raw = await supabaseAdmin
      .from("certificates")
      .select("*, profiles(full_name, email)")
      .order("issued_at", { ascending: false });

    const { data, error } = raw as unknown as {
      data: CertWithFullProfile[] | null;
      error: { message: string } | null;
    };

    if (error) throw new Error(error.message);

    return (data ?? []).map(({ profiles, ...cert }) => ({
      ...cert,
      student_name: profiles?.full_name ?? null,
      student_email: profiles?.email ?? "",
    }));
  }
}
