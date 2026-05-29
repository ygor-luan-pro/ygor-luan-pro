type Level = "info" | "warn" | "error";

function log(level: Level, event: string, context: Record<string, unknown>): void {
  const entry = JSON.stringify({ ...context, ts: new Date().toISOString(), level, event });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

export const logger = {
  info: (event: string, context: Record<string, unknown>) => log("info", event, context),
  warn: (event: string, context: Record<string, unknown>) => log("warn", event, context),
  error: (event: string, context: Record<string, unknown>) => log("error", event, context),
};
