import { NextResponse } from 'next/server';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    hasKey: !!process.env.SPORTSDATAIO_API_KEY,
    keyLength: process.env.SPORTSDATAIO_API_KEY?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    firstChars: process.env.SPORTSDATAIO_API_KEY?.substring(0, 4),
  });
}
