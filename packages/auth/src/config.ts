import type {
  DefaultSession,
  NextAuthConfig,
  Session as NextAuthSession,
} from "next-auth";
import { skipCSRFCheck } from "@auth/core";
import Google from "@auth/core/providers/google";
import ResendProvider from "@auth/core/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Apple from "next-auth/providers/apple";
import { Resend } from "resend";

import { db } from "@acme/db";

import { env } from "../env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const adapter = PrismaAdapter(db);

export const isSecureContext = env.NODE_ENV !== "development";

export const authConfig = {
  adapter,
  // In development, we need to skip checks to allow Expo to work.
  ...(!isSecureContext
    ? {
        skipCSRFCheck: skipCSRFCheck as any,
        trustHost: true,
      }
    : {}),
  secret: env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    Apple({
      clientId: env.AUTH_APPLE_ID,
      clientSecret: env.AUTH_APPLE_SECRET,
    }),
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    ResendProvider({
      server: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      async sendVerificationRequest({
        identifier: email,
        url,
        provider: { from },
        request,
      }) {
        const cookies = request.headers.get("cookie") ?? "";
        const isExpoSignin = cookies
          .split("; ")
          .find((cookie: string) =>
            cookie.startsWith("__acme-expo-redirect-state"),
          )
          ?.split("=")[1];

        if (isExpoSignin) {
          const redirectTo = new URL(url);
          redirectTo.searchParams.set("redirectTo", "/mobile");
          url = redirectTo.toString();
        }

        const resend = new Resend(env.RESEND_API_KEY);
        await resend.emails.send({
          html: loginEmailHtml(url),
          from: `Login <${from}>`,
          to: email,
          subject: "Sign in to KnowNotes",
        });
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      let dbUser = await db.user.findFirst({
        where: { email: user.email },
      });

      if (!dbUser) {
        dbUser = await db.user.create({
          data: { ...user },
        });

        // If there's no user in the database, then there is also no account.
        if (account) {
          await db.account.create({
            data: {
              type: account.type,
              scope: account.scope,
              token_type: account.token_type,
              id_token: account.id_token,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              userId: dbUser.id,
            },
          });
        }
      } else {
        if (account) {
          const dbAccount = await db.account.findFirst({
            where: {
              // provider: account.provider,
              // providerAccountId: account.providerAccountId,
              userId: dbUser.id,
            },
          });
          if (dbAccount) return true;

          await db.account.create({
            data: {
              type: account.type,
              scope: account.scope,
              token_type: account.token_type,
              id_token: account.id_token,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              userId: dbUser.id,
            },
          });
        }
      }
      return true;
    },
    session: (opts) => {
      if (!("user" in opts))
        throw new Error("Unreachable with session strategy.");

      return {
        ...opts.session,
        user: {
          ...opts.session.user,
          id: opts.user.id,
        },
      };
    },
  },
} satisfies NextAuthConfig;

export const validateToken = async (
  token: string,
): Promise<NextAuthSession | null> => {
  const sessionToken = token.slice("Bearer ".length);
  const session = await adapter.getSessionAndUser?.(sessionToken);
  return session
    ? {
        user: {
          ...session.user,
        },
        expires: session.session.expires.toISOString(),
      }
    : null;
};

export const invalidateSessionToken = async (token: string) => {
  const sessionToken = token.slice("Bearer ".length);
  await adapter.deleteSession?.(sessionToken);
};

const loginEmailHtml = (
  url: string,
) => `<body style="margin:auto;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;margin-left:auto;margin-right:auto;margin-top:3rem;margin-bottom:3rem;width:24rem;border-radius:0.5rem;border-width:1px;border-color:214.3 31.8% 91.4%;padding:1.25rem">
      <tbody>
        <tr style="width:100%">
          <td>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:32px">
              <tbody>
                <tr>
                  <td><img alt="KnowNotes" height="37" src="https://knownotes.ai/android-chrome-512x512.png" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" width="40" /></td>
                </tr>
              </tbody>
            </table>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:2rem">
              <tbody>
                <tr>
                  <td>
                    <h1 class="" style="text-align:center;font-size:1.5rem;line-height:2rem;font-weight:700;color:222.2 47.4% 11.2%">Sign in to KnowNotes</h1>
                    <p style="font-size:0.875rem;line-height:1.25rem;margin:16px 0;color:215.4 16.3% 46.9%">Hey there!</p>
                    <p style="font-size:0.875rem;line-height:1.25rem;margin:16px 0;color:215.4 16.3% 46.9%">Click the button below to sign in to your account.</p>
                    <div style="margin-top:1rem;margin-bottom:1rem;display:flex;justify-content:center"><a href="${url}" style="line-height:100%;text-decoration:none;display:block;max-width:100%;background-color:hsl(222.2, 47.4%, 11.2%);border-radius:5px;color:#fff;font-size:16px;font-weight:bold;text-align:center;width:100%;padding:10px 10px 10px 10px" target="_blank"><span><!--[if mso]><i style="letter-spacing: 10px;mso-font-width:-100%;mso-text-raise:15" hidden>&nbsp;</i><![endif]--></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:7.5px">Sign In</span><span><!--[if mso]><i style="letter-spacing: 10px;mso-font-width:-100%" hidden>&nbsp;</i><![endif]--></span></a></div>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin-top:1rem;margin-bottom:1rem" />
            <p style="font-size:0.75rem;line-height:1rem;margin:16px 0;color:210 40% 96.1%">If you did not request this email, you can safely ignore it.</p>
          </td>
        </tr>
      </tbody>
    </table>
  </body>`;
