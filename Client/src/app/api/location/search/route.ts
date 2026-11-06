import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query");

    if (!query || !query.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const cleanQuery = query.trim();
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=6&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "FoodFlowApp/1.0 (contact@foodflow.com)",
        "Accept-Language": "en",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: [] });
    }

    const list = await res.json();
    if (!Array.isArray(list)) {
      return NextResponse.json({ success: true, data: [] });
    }

    const mapped = list.map((item: any) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      type: item.type,
      importance: item.importance,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to search location", data: [] },
      { status: 500 }
    );
  }
}
