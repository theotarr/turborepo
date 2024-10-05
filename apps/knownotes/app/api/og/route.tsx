import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  let heading = searchParams.get("heading");
  heading =
    heading?.length! > 140
      ? `${heading?.substring(0, 140)}...`
      : (heading ?? "KnowNotes");
  const type = searchParams.get("type") ?? "The AI Assistant For Students";

  // const geistRegular = fetch(
  //   new URL("../../../assets/fonts/GeistVariableVF.ttf", import.meta.url)
  // ).then((res) => res.arrayBuffer())
  // const geistBold = fetch(
  //   new URL("../../../assets/fonts/Geist-Bold.woff2", import.meta.url)
  // ).then((res) => res.arrayBuffer())

  const geistRegular = fetch(
    new URL("../../../assets/fonts/Inter-Regular.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());
  const geistBold = fetch(
    new URL("../../../assets/fonts/Inter-Bold.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  try {
    const fontRegular = await geistRegular;
    const fontBold = await geistBold;

    const paint = "#000";
    const fontSize = heading?.length! > 100 ? "70px" : "100px";

    return new ImageResponse(
      (
        <div
          tw="flex relative flex-col p-12 w-full h-full items-start"
          style={{
            color: paint,
            background: "white",
          }}
        >
          <div tw="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke={paint}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="14.31" x2="20.05" y1="8" y2="17.94" />
              <line x1="9.69" x2="21.17" y1="8" y2="8" />
              <line x1="7.38" x2="13.12" y1="12" y2="2.06" />
              <line x1="9.69" x2="3.95" y1="16" y2="6.06" />
              <line x1="14.31" x2="2.83" y1="16" y2="16" />
              <line x1="16.62" x2="10.88" y1="12" y2="21.94" />
            </svg>
            <div
              tw="flex ml-2"
              style={{
                fontFamily: "Geist",
                fontWeight: "bold",
                fontSize: "32px",
                letterSpacing: "-0.05em",
              }}
            >
              KnowNotes
            </div>
          </div>
          <div tw="flex flex-col flex-1 py-10">
            <div
              tw="flex text-xl uppercase font-bold tracking-tight text-[#2563eb] dark:text-[#3b82f6]"
              style={{
                fontFamily: "Geist",
                fontWeight: "bold",
              }}
            >
              {type}
            </div>
            <div
              tw="flex leading-[1.1] text-[80px] font-bold"
              style={{
                fontFamily: "Geist",
                fontWeight: "bold",
                marginLeft: "-3px",
                fontSize,
              }}
            >
              {heading}
            </div>
          </div>
          <div tw="flex items-center w-full justify-between">
            <div
              tw="flex text-xl"
              style={{ fontFamily: "Geist", fontWeight: "normal" }}
            >
              knownotes.ai
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Geist",
            data: fontRegular,
            weight: 400,
            style: "normal",
          },
          {
            name: "Geist",
            data: fontBold,
            weight: 700,
            style: "normal",
          },
        ],
      },
    );
  } catch (error) {
    console.error(error);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
