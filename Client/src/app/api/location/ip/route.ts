import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.trim().replace(/^::ffff:/, "");
  return (
    clean === "127.0.0.1" ||
    clean === "::1" ||
    clean === "localhost" ||
    clean.startsWith("10.") ||
    clean.startsWith("192.168.") ||
    clean.startsWith("172.16.") ||
    clean.startsWith("172.17.") ||
    clean.startsWith("172.18.") ||
    clean.startsWith("172.19.") ||
    clean.startsWith("172.20.") ||
    clean.startsWith("172.21.") ||
    clean.startsWith("172.22.") ||
    clean.startsWith("172.23.") ||
    clean.startsWith("172.24.") ||
    clean.startsWith("172.25.") ||
    clean.startsWith("172.26.") ||
    clean.startsWith("172.27.") ||
    clean.startsWith("172.28.") ||
    clean.startsWith("172.29.") ||
    clean.startsWith("172.30.") ||
    clean.startsWith("172.31.")
  );
}

export async function GET(req: NextRequest) {
  try {
    // Extract real client IP from incoming request headers
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    const clientIp = (cfConnectingIp || (forwarded ? forwarded.split(",")[0].trim() : realIp) || "").trim();

    const queryIp = clientIp && !isPrivateIp(clientIp) ? clientIp : "";

    // 1. Try ipwho.is with client IP
    try {
      const url = queryIp ? `https://ipwho.is/${queryIp}` : "https://ipwho.is/";
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && data.latitude && data.longitude) {
          return NextResponse.json({
            success: true,
            data: {
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              city: data.city || "",
              region: data.region || "",
              country: data.country || "",
              postal: data.postal || "",
              ip: data.ip || clientIp,
            },
          });
        }
      }
    } catch {}

    // 2. Fallback to freeipapi with client IP
    try {
      const url2 = queryIp ? `https://freeipapi.com/api/json/${queryIp}` : "https://freeipapi.com/api/json";
      const res2 = await fetch(url2, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.latitude && data2.longitude) {
          return NextResponse.json({
            success: true,
            data: {
              latitude: Number(data2.latitude),
              longitude: Number(data2.longitude),
              city: data2.cityName || "",
              region: data2.regionName || "",
              country: data2.countryName || "",
              postal: data2.zipCode || "",
              ip: data2.ipAddress || clientIp,
            },
          });
        }
      }
    } catch {}

    // 3. Fallback default Berhampur coordinates
    return NextResponse.json({
      success: true,
      data: {
        latitude: 19.3149,
        longitude: 84.7941,
        city: "Berhampur",
        region: "Odisha",
        country: "India",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "IP detection failed" },
      { status: 500 }
    );
  }
}

