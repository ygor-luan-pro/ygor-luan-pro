const RESET_PASSWORD_PATH = "/redefinir-senha";

export function resolveCallbackRedirect(next: string): string {
  if (!next.startsWith(RESET_PASSWORD_PATH)) {
    return next;
  }

  const url = new URL(next, "http://localhost");
  url.searchParams.set("recovery", "1");
  return `${url.pathname}${url.search}`;
}

export function shouldRedirectAuthenticatedUserFromResetPage({
  hasUser,
  recovery,
}: {
  hasUser: boolean;
  recovery: string | null;
}): boolean {
  if (!hasUser) {
    return false;
  }

  return recovery !== "1";
}
