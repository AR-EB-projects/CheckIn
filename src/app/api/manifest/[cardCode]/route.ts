import { NextResponse } from "next/server";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ cardCode: string }> }
) {
  const { cardCode } = await params;

  return NextResponse.json({
    id: `/member/${cardCode}`,
    name: "Dalida Dance",
    short_name: "Dalida Dance",
    start_url: `/member/${cardCode}`,
    scope: "/member/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  });
}