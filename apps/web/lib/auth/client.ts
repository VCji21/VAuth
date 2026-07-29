import { createAuthClient } from "@repo/auth-client";
import { getApiUrl, getClientId } from "../api";

export function getVAuthClient() {
  return createAuthClient({
    apiUrl: getApiUrl(),
    clientId: getClientId(),
  });
}
