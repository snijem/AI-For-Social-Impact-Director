import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    routes: {
      generateVideo: {
        exists: true,
        path: '/app/api/generate-video/route.js',
        methods: ['GET', 'POST'],
        dynamic: true,
      },
      testLuma: {
        exists: true,
        path: '/app/api/test-luma/route.js',
        methods: ['GET', 'POST'],
        dynamic: true,
      },
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      lumaApiKeyConfigured: !!process.env.LUMA_API_KEY,
      lumaApiKeyLength: process.env.LUMA_API_KEY ? process.env.LUMA_API_KEY.length : 0,
    },
    server: {
      cwd: process.cwd(),
      uptime: process.uptime(),
    },
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
