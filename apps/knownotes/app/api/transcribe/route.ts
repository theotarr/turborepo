import { NextResponse } from "next/server";
import { env } from "@/env";
import { createClient, DeepgramError } from "@deepgram/sdk";

export async function GET(request: Request) {
  // // Exit early so we don't request thousands of keys in development.
  // if (process.env.NODE_ENV === "development") {
  //   return NextResponse.json({
  //     key: env.DEEPGRAM_API_KEY ?? "",
  //   });
  // }

  // Use the request object to invalidate the cache every request.
  const url = request.url;
  const deepgram = createClient(env.DEEPGRAM_API_KEY);

  let { result: tokenResult, error: tokenError } =
    await deepgram.auth.grantToken();

  if (tokenError) {
    return NextResponse.json(tokenError);
  }

  if (!tokenResult) {
    return NextResponse.json(
      new DeepgramError(
        "Failed to generate temporary token. Make sure your API key is of scope Member or higher.",
      ),
    );
  }

  const response = NextResponse.json({ ...tokenResult, url });
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set(
    "Cache-Control",
    "s-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Expires", "0");

  return response;
}
