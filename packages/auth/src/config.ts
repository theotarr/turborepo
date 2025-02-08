import { createHash } from "crypto";
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
const resend = new Resend(env.RESEND_API_KEY);
export const isSecureContext = env.NODE_ENV !== "development";

async function reportUserRegistration({
  userId,
  email,
  name,
}: {
  userId: string;
  email?: string | null;
  name?: string | null;
}) {
  const em = email ? [createHash("sha256").update(email).digest("hex")] : [];
  const fn = name ? [createHash("sha256").update(name).digest("hex")] : [];
  const external_id = createHash("sha256").update(userId).digest("hex");

  const eventData = {
    data: [
      {
        event_name: "CompleteRegistration",
        event_time: Math.floor(new Date().getTime() / 1000),
        action_source: "website",
        user_data: {
          em,
          fn,
          external_id,
        },
      },
    ],
  };
  const response = await fetch(
    `https://graph.facebook.com/v22.0/${env.NEXT_PUBLIC_META_PIXEL_ID}/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...eventData,
        access_token: env.META_ACCESS_TOKEN,
      }),
    },
  );

  if (!response.ok) console.error("[Meta] Error: ", await response.text());
  else console.log("[Meta] Response: ", await response.json());
}

export const authConfig = {
  adapter,
  // In development, we need to skip checks to allow Expo to work.
  ...(!isSecureContext
    ? {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
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
          const redirect = new URL(url);
          redirect.searchParams.set("callbackUrl", `/mobile`);
          url = redirect.toString();
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
    // Link a user to an OAuth account. Necessary for an Apple user to sign in on web.
    signIn: async ({ user, account }) => {
      let dbUser = await db.user.findFirst({
        where: { email: user.email },
      });

      // If there's no user in the database, create one.
      // Since the `createUser` event isn't working from Next Auth, this is a workaround.
      if (!dbUser) {
        dbUser = await db.user.create({
          data: { ...user },
        });

        // Report the user registration to Meta.
        await reportUserRegistration({
          userId: dbUser.id,
          email: user.email,
          name: user.name,
        });

        // Email the user a welcome email with a tutorial.
        if (user.email) {
          try {
            console.log("[Resend] Sending welcome email to: ", user.email);
            await resend.emails.send({
              from: "Theo from KnowNotes <theo@knownotes.ai>",
              to: user.email,
              subject: "Save hours studying",
              text: `\
        Welcome to KnowNotes!
        To make the most of KnowNotes, here's a short tutorial on how to use all its features (2min on 2x):
        https://www.loom.com/share/5f1fbb33b9a44d5ab2d61928d30af528?sid=94a40531-7cf3-48e4-826b-655bd32ee8be
        Let me know if you have any questions.
        Best,
        Theo`,
              html: `Welcome to KnowNotes!<br><br>To make the most of KnowNotes, here's a short tutorial on how to use all its features (2min on 2x):<br><a href="https://www.loom.com/share/5f1fbb33b9a44d5ab2d61928d30af528?sid=94a40531-7cf3-48e4-826b-655bd32ee8be">Watch the tutorial</a><br><br>Let me know if you have any questions.<br><br>Best,<br>Theo`,
            });
          } catch (error) {
            console.error("[Resend] Error sending welcome email: ", error);
          }
        }

        // If there's no user, then there is also no account.
        if (account) {
          // Check if the account is already linked to another user.
          const existingAccount = await db.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          if (existingAccount) {
            throw new Error(
              "This OAuth account is already linked to another user.",
            );
          }
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
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          if (dbAccount) {
            if (dbAccount.userId !== dbUser.id) {
              throw new Error(
                "This OAuth account is already linked to another user.",
              );
            }
            return true;
          }

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
