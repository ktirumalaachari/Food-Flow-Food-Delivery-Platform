import { NextResponse } from "next/server";

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BLPoibZQOAKyFOXUIAVeCVl_24U_vyVSUrIo1Zwu2WtR58XiaEf9u_O3DMAz-xR58XCJNxyYeDv53QSqv2ANBQ0";

  return NextResponse.json({ publicKey });
}
