import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // 1. Try ipwho.is
    try {
      const res = await fetch("https://ipwho.is/", {
        next: { revalidate: 3600 },
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
            },
          });
        }
      }
    } catch {}

    // 2. Fallback to freeipapi
    try {
      const res2 = await fetch("https://freeipapi.com/api/json", {
        next: { revalidate: 3600 },
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
            },
          });
        }
      }
    } catch {}

    // 3. Fallback default Berhampur
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
