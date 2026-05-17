function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in apps/admin/.env`);
  }
  return value;
}

export function getClerkPublishableKey(): string {
  return requireEnv("VITE_CLERK_PUBLISHABLE_KEY");
}

export function getApiBaseUrl(): string {
  return requireEnv("VITE_API_BASE_URL").replace(/\/$/, "");
}
