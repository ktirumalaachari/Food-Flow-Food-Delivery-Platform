import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng") || searchParams.get("lon");

    if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return NextResponse.json(
        { success: false, message: "Valid lat and lng query parameters are required" },
        { status: 400 }
      );
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    // 1. Try OpenStreetMap Nominatim with valid User-Agent
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const nomRes = await fetch(nomUrl, {
        headers: {
          "User-Agent": "FoodFlowApp/1.0 (contact@foodflow.com)",
          "Accept-Language": "en",
        },
        next: { revalidate: 3600 }, // Cache on server for 1 hour
      });

      if (nomRes.ok) {
        const data = await nomRes.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || "";
          const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || "";
          const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || "Unknown City";
          const district = addr.state_district || addr.county || addr.district || city;
          const state = addr.state || addr.region || addr.province || "";
          const postcode = addr.postcode || "";
          const country = addr.country || "";

          // Build clean area string
          const areaParts = [road, locality, city].filter(Boolean);
          const area = areaParts.length > 0 ? areaParts.slice(0, 2).join(", ") : city;

          return NextResponse.json({
            success: true,
            data: {
              city,
              area,
              district,
              division: state,
              state,
              country,
              postcode,
              upazila: locality || city,
              formattedAddress: data.display_name || `${area}, ${city}, ${state}`,
              lat: latitude,
              lng: longitude,
              source: "nominatim",
            },
          });
        }
      }
    } catch (nomErr) {
      console.warn("Nominatim reverse geocode server fetch failed, falling back to BigDataCloud:", nomErr);
    }

    // 2. Fallback to BigDataCloud
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const bdcRes = await fetch(bdcUrl, { next: { revalidate: 3600 } });
      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        const city = bdc.city || bdc.locality || "Unknown City";
        const locality = bdc.locality || bdc.principalSubdivision || "";
        const state = bdc.principalSubdivision || "";
        const country = bdc.countryName || "";
        const area = locality && locality !== city ? `${locality}, ${city}` : city;

        return NextResponse.json({
          success: true,
          data: {
            city,
            area,
            district: city,
            division: state,
            state,
            country,
            postcode: bdc.postcode || "",
            upazila: locality || city,
            formattedAddress: `${area}, ${state}, ${country}`,
            lat: latitude,
            lng: longitude,
            source: "bigdatacloud",
          },
        });
      }
    } catch (bdcErr) {
      console.warn("BigDataCloud fallback failed:", bdcErr);
    }

    // 3. Fallback to simple coordinates label
    return NextResponse.json({
      success: true,
      data: {
        city: "Selected Location",
        area: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        district: "Local Area",
        division: "Region",
        state: "Region",
        country: "",
        postcode: "",
        upazila: "",
        formattedAddress: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        lat: latitude,
        lng: longitude,
        source: "coordinates",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to reverse geocode" },
      { status: 500 }
    );
  }
}
