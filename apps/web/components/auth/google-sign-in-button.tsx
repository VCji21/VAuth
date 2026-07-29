import { CircleUserRound } from "lucide-react";
import { getApiUrl, getClientId } from "../../lib/api";

export function GoogleSignInButton() {
  const redirectUri = "http://localhost:3000/auth/callback";
  const href = `${getApiUrl()}/auth/google?clientId=${encodeURIComponent(
    getClientId(),
  )}&redirectUri=${encodeURIComponent(redirectUri)}`;

  return (
    <a className="button button-secondary full-width" href={href}>
      <CircleUserRound size={16} aria-hidden />
      Continue with Google
    </a>
  );
}
