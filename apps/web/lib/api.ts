export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export function getClientId(): string {
  return process.env.NEXT_PUBLIC_CLIENT_ID ?? "vauth_demo_web";
}
