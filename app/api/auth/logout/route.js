import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('sanjeevni_token', '', { maxAge: 0, path: '/' });
  return response;
}
