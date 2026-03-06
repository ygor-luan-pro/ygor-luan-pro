/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: import('@supabase/supabase-js').Session | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly MERCADOPAGO_ACCESS_TOKEN: string;
  readonly MERCADOPAGO_PUBLIC_KEY: string;
  readonly MERCADOPAGO_WEBHOOK_SECRET?: string;
  readonly VIMEO_ACCESS_TOKEN: string;
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_CALCOM_LINK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
