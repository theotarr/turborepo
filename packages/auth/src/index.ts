import NextAuth from "next-auth";

import { authConfig } from "./config";

export type { Session } from "next-auth";

const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
});

export { handlers, auth, signIn, signOut };

export {
  authConfig,
  invalidateSessionToken,
  validateToken,
  isSecureContext,
} from "./config";
