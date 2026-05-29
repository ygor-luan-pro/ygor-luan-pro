import { logger } from "../lib/logger";
import { supabaseAdmin } from "../lib/supabase-admin";
import type { Profile } from "../types";

export class UsersService {
  static async getAllAdmin(): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async countStudents(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (error && error.code !== "PGRST116") {
        logger.error("users.isAdmin failed", { userId, code: error.code, message: error.message });
        return false;
      }
      return data?.role === "admin";
    } catch (err) {
      logger.error("users.isAdmin threw", {
        userId,
        err: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }
}
