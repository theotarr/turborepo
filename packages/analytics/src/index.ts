export const TIKTOK_PIXEL_ID = "COH8383C77UC70DIPSOG";
const isProd = process.env.NODE_ENV === "production";

// Helper function to hash a string with SHA-256.
async function hashString(input: string): Promise<string> {
  const hashed = Buffer.from(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)),
  ).toString("hex");
  return hashed;
}

// Meta
export async function trackMetaEvent({
  userId,
  event,
  email,
  name,
}: {
  userId: string;
  event: "CompleteRegistration" | "AddPaymentInfo" | "Subscribe";
  email?: string | null;
  name?: string | null;
}) {
  // Only track events in production
  if (!isProd) {
    console.log("[trackMetaEvent] Skipping in non-production environment");
    return;
  }

  console.debug("[trackMetaEvent] Input:", { userId, event, email, name });
  const em = email ? [await hashString(email)] : [];
  const fn = name ? [await hashString(name)] : [];
  const external_id = await hashString(userId);

  const eventData = {
    data: [
      {
        event_name: event,
        event_time: Math.floor(new Date().getTime() / 1000),
        action_source: "website",
        user_data: {
          ...(email ? { em } : {}),
          ...(name ? { fn } : {}),
          external_id,
        },
      },
    ],
  };
  console.debug("[trackMetaEvent] Event Data:", eventData);

  const response = await fetch(
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    `https://graph.facebook.com/v22.0/${process.env.NEXT_PUBLIC_META_PIXEL_ID}/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...eventData,
        // eslint-disable-next-line turbo/no-undeclared-env-vars, @typescript-eslint/no-non-null-assertion
        access_token: process.env.META_ACCESS_TOKEN!,
      }),
    },
  );

  if (!response.ok) console.error("[Meta] Error: ", await response.text());
  else console.log("[Meta] Response: ", await response.json());
}

// TikTok
export async function trackTiktokEvent({
  userId,
  event,
  email,
  url,
}: {
  userId: string;
  event: "CompleteRegistration" | "AddPaymentInfo" | "Subscribe";
  email?: string | null;
  url: string;
}) {
  // Only track events in production
  if (!isProd) {
    console.log("[trackTiktokEvent] Skipping in non-production environment");
    return;
  }

  console.debug("[trackTiktokEvent] Input:", { userId, event, email, url });
  const eventData = {
    event_source: "web",
    event_source_id: TIKTOK_PIXEL_ID,
    data: [
      {
        event,
        event_time: Math.floor(new Date().getTime() / 1000), // Unix timestamp in seconds, UTC+0
        user: {
          external_id: await hashString(userId),
          ...(email ? { email: await hashString(email) } : {}),
        },
        page: {
          url,
        },
      },
    ],
  };
  console.debug("[trackTiktokEvent] Event Data:", eventData);

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/event/track/",
    {
      method: "POST",
      headers: {
        // eslint-disable-next-line turbo/no-undeclared-env-vars, @typescript-eslint/no-non-null-assertion
        "Access-Token": process.env.TIKTOK_ACCESS_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    },
  );

  if (!response.ok) console.error("[TikTok] Error: ", await response.text());
  else console.log("[TikTok] Response: ", await response.json());
}
