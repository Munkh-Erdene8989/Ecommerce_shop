import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'az-beauty',
    timestamp: new Date().toISOString(),
  })
}
