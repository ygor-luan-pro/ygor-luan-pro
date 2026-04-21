/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('@supabase/supabase-js').User | null;
    isAdmin: boolean;
    hasAccess: boolean;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly CAKTO_WEBHOOK_SECRET?: string;
  readonly CAKTO_ALLOWED_PRODUCT_IDS?: string;
  readonly CAKTO_ALLOWED_OFFER_IDS?: string;
  readonly CAKTO_ALLOWED_REF_IDS?: string;
  readonly PUBLIC_CAKTO_CHECKOUT_URL_VIDEOAULAS?: string;
  readonly PUBLIC_CAKTO_CHECKOUT_URL_MENTORIA?: string;
  readonly VIMEO_ACCESS_TOKEN: string;
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_CALCOM_LINK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
