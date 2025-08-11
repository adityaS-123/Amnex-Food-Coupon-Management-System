import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Remove or modify this middleware if it exists
export function middleware(request: NextRequest) {
  // Instead of blocking access completely, we'll allow access to the site at all times
  return NextResponse.next();
}
