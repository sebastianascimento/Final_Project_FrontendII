import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nextAuthUrl: process.env.NEXTAUTH_URL || 'não definido',
    googleClientIdDefined: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecretDefined: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 8) + '...' : 'não definido'
  });
}