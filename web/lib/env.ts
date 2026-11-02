/** Client-visible deploy stage (`production` | `development`). Set in Vercel per project. */
export type AppEnvironment = "production" | "development";

export function getAppEnvironment(): AppEnvironment {
  const raw = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  if (raw === "development" || raw === "dev") {
    return "development";
  }
  return "production";
}

export function isDevelopmentAppEnvironment(): boolean {
  return getAppEnvironment() === "development";
}
