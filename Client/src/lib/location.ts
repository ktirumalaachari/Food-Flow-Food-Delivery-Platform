"use client";

import { BANGLADESH_LOCATIONS } from "@/data/bangladeshLocations";
import { detectZone } from "@/lib/api/zone";

export interface ILocationInfo {
  city: string;
  area: string;
  formattedAddress?: string;
  division?: string;
  district?: string;
  upazila?: string;
  currentZoneId?: string;
  zoneName?: string;
  candidateZoneIds?: string[];
  maxDeliveryRadiusKm?: number;
  isInsideServiceArea?: boolean;
  isManualPreference?: boolean;
  isDetecting: boolean;
  hasRealLocation: boolean;
  error?: string | null;
  lat?: number;
  lng?: number;
}

export const DEFAULT_INITIAL_LOCATION: ILocationInfo = {
  city: "Detecting Location...",
  area: "Locating your area...",
  formattedAddress: "Locating your delivery address...",
  division: "Odisha",
  district: "Ganjam",
  upazila: "Prem Nagar 7th Lane",
  currentZoneId: "99",
  zoneName: "Prem Nagar & Odisha Food Hub",
  candidateZoneIds: ["99"],
  isInsideServiceArea: true,
  isDetecting: true,
  hasRealLocation: false,
  lat: 19.3149,
  lng: 84.7941,
};

let cachedLocation: ILocationInfo = { ...DEFAULT_INITIAL_LOCATION };

// Load user saved location preference from localStorage if present
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("food_flow_user_location");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        parsed.hasRealLocation &&
        parsed.city &&
        parsed.city !== "Detecting Location..."
      ) {
        cachedLocation = { ...DEFAULT_INITIAL_LOCATION, ...parsed, isDetecting: false };
      }
    }
  } catch {}
}

const LISTENERS = new Set<() => void>();

export function notifyLocationListeners() {
  LISTENERS.forEach((cb) => cb());
}

export function subscribeLocation(callback: () => void) {
  LISTENERS.add(callback);
  return () => {
    LISTENERS.delete(callback);
  };
}

export function getRealTimeLocation(): ILocationInfo {
  return cachedLocation;
}

/**
 * Parse reverse-geocode API response into Bangladesh Division, District, and Upazila
 */
export function parseBangladeshHierarchy(rawData: any): {
  division: string;
  district: string;
  upazila: string;
  city: string;
  area: string;
  formattedAddress?: string;
} {
  const addr = rawData?.address || {};
  const principalSubdivision = String(rawData.principalSubdivision || addr.state || "").trim();
  const cityRaw = String(rawData.city || addr.city || addr.town || addr.municipality || "").trim();
  const localityRaw = String(rawData.locality || addr.suburb || addr.neighbourhood || addr.village || "").trim();
  const countyRaw = String(addr.county || addr.state_district || addr.district || "").trim();
  const displayName = String(rawData.display_name || "").trim();
  
  const adminList = Array.isArray(rawData.localityInfo?.administrative)
    ? rawData.localityInfo.administrative
    : [];

  const combinedSearchText = [
    localityRaw,
    cityRaw,
    countyRaw,
    principalSubdivision,
    displayName,
    ...adminList.map((a: any) => a.name || ""),
  ].join(" ").toLowerCase();

  let foundDivision = "";
  let foundDistrict = "";
  let foundUpazila = "";

  // Helper dictionary of known district aliases to canonical BANGLADESH_LOCATIONS district name
  const DISTRICT_ALIASES: Record<string, { district: string; division: string }> = {
    moulvibazar: { district: "Moulvibazar", division: "Sylhet" },
    maulvibazar: { district: "Moulvibazar", division: "Sylhet" },
    maulavibazar: { district: "Moulvibazar", division: "Sylhet" },
    "maulvi bazar": { district: "Moulvibazar", division: "Sylhet" },
    "moulvi bazar": { district: "Moulvibazar", division: "Sylhet" },
    "maulavi bazar": { district: "Moulvibazar", division: "Sylhet" },
    sreemangal: { district: "Moulvibazar", division: "Sylhet" },
    kamalganj: { district: "Moulvibazar", division: "Sylhet" },
    kulaura: { district: "Moulvibazar", division: "Sylhet" },
    chattogram: { district: "Chattogram", division: "Chattogram" },
    chittagong: { district: "Chattogram", division: "Chattogram" },
    cumilla: { district: "Cumilla", division: "Chattogram" },
    comilla: { district: "Cumilla", division: "Chattogram" },
    bogura: { district: "Bogura", division: "Rajshahi" },
    bogra: { district: "Bogura", division: "Rajshahi" },
    jashore: { district: "Jashore", division: "Khulna" },
    jessore: { district: "Jashore", division: "Khulna" },
    barishal: { district: "Barishal", division: "Barishal" },
    barisal: { district: "Barishal", division: "Barishal" },
    "cox's bazar": { district: "Cox's Bazar", division: "Chattogram" },
    coxsbazar: { district: "Cox's Bazar", division: "Chattogram" },
    "coxs bazar": { district: "Cox's Bazar", division: "Chattogram" },
    mymensingh: { district: "Mymensingh", division: "Mymensingh" },
    dhaka: { district: "Dhaka", division: "Dhaka" },
    gazipur: { district: "Gazipur", division: "Dhaka" },
    narayanganj: { district: "Narayanganj", division: "Dhaka" },
    sylhet: { district: "Sylhet", division: "Sylhet" },
    habiganj: { district: "Habiganj", division: "Sylhet" },
    sunamganj: { district: "Sunamganj", division: "Sylhet" },
  };

  // 1. Check known aliases first
  for (const [alias, info] of Object.entries(DISTRICT_ALIASES)) {
    if (combinedSearchText.includes(alias)) {
      foundDistrict = info.district;
      foundDivision = info.division;
      break;
    }
  }

  // 2. Check for specific Upazila / Postal Code
  for (const divObj of BANGLADESH_LOCATIONS) {
    for (const distObj of divObj.districts) {
      for (const p of distObj.postalCodes) {
        const pNameLower = p.name.toLowerCase();
        if (
          combinedSearchText.includes(pNameLower) ||
          localityRaw.toLowerCase().includes(pNameLower) ||
          cityRaw.toLowerCase().includes(pNameLower)
        ) {
          foundUpazila = p.name;
          if (!foundDistrict) {
            foundDistrict = distObj.name;
            foundDivision = divObj.division;
          }
          break;
        }
      }
      if (foundUpazila) break;
    }
    if (foundUpazila) break;
  }

  // 3. Check all districts in BANGLADESH_LOCATIONS
  if (!foundDistrict) {
    for (const divObj of BANGLADESH_LOCATIONS) {
      for (const distObj of divObj.districts) {
        const distLower = distObj.name.toLowerCase();
        if (combinedSearchText.includes(distLower)) {
          foundDistrict = distObj.name;
          foundDivision = divObj.division;
          break;
        }
      }
      if (foundDistrict) break;
    }
  }

  // 4. Check for Division
  if (!foundDivision) {
    for (const divObj of BANGLADESH_LOCATIONS) {
      const divLower = divObj.division.toLowerCase();
      if (combinedSearchText.includes(divLower)) {
        foundDivision = divObj.division;
        break;
      }
    }
  }

  // Check for Odisha / Indian regional match
  if (
    combinedSearchText.includes("odisha") ||
    combinedSearchText.includes("orissa") ||
    combinedSearchText.includes("berhampur") ||
    combinedSearchText.includes("brahmapur") ||
    combinedSearchText.includes("ganjam")
  ) {
    foundDivision = "Odisha";
    foundDistrict = combinedSearchText.includes("ganjam") ? "Ganjam" : "Berhampur";
    foundUpazila = combinedSearchText.includes("prem nagar")
      ? "Prem Nagar 7th Lane"
      : localityRaw || cityRaw || "Prem Nagar";
  }

  // Fallbacks
  if (!foundDivision) {
    if (combinedSearchText.includes("dhaka")) foundDivision = "Dhaka";
    else if (combinedSearchText.includes("chittagong") || combinedSearchText.includes("chattogram")) foundDivision = "Chattogram";
    else if (combinedSearchText.includes("sylhet")) foundDivision = "Sylhet";
    else if (combinedSearchText.includes("rajshahi")) foundDivision = "Rajshahi";
    else if (combinedSearchText.includes("khulna")) foundDivision = "Khulna";
    else if (combinedSearchText.includes("barisal") || combinedSearchText.includes("barishal")) foundDivision = "Barishal";
    else if (combinedSearchText.includes("rangpur")) foundDivision = "Rangpur";
    else if (combinedSearchText.includes("mymensingh")) foundDivision = "Mymensingh";
    else if (principalSubdivision) foundDivision = principalSubdivision;
    else if (cityRaw) foundDivision = cityRaw;
    else foundDivision = "Odisha";
  }

  if (!foundDistrict) {
    foundDistrict = cityRaw || countyRaw || foundDivision || "Berhampur";
  }

  if (!foundUpazila) {
    foundUpazila = localityRaw || cityRaw || "";
  }

  // Clean area representation
  const cleanArea = foundUpazila
    ? `${foundUpazila}, ${foundDistrict}`
    : localityRaw && localityRaw.toLowerCase() !== foundDistrict.toLowerCase()
    ? `${localityRaw}, ${foundDistrict}`
    : `${foundDistrict} Central`;

  return {
    division: foundDivision,
    district: foundDistrict,
    upazila: foundUpazila,
    city: cityRaw || foundDistrict,
    area: cleanArea,
    formattedAddress: displayName || cleanArea,
  };
}

export async function reverseGeocodeCoordinates(lat: number, lon: number) {
  // 1. Try our internal server endpoint which uses Nominatim with proper User-Agent
  try {
    const res = await fetch(`/api/location/reverse?lat=${lat}&lng=${lon}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        const d = json.data;
        return {
          division: d.division || d.state || "Region",
          district: d.district || d.city || "District",
          upazila: d.upazila || d.area || "",
          city: d.city || d.district || "City",
          area: d.area || d.formattedAddress || `${d.city || "Location"} Area`,
          formattedAddress: d.formattedAddress || d.area,
        };
      }
    }
  } catch (err) {
    console.warn("Internal reverse geocode failed, falling back to BigDataCloud:", err);
  }

  // 2. Direct client fallback to BigDataCloud (works in browsers without CORS or 403)
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      return parseBangladeshHierarchy(bdcData);
    }
  } catch {}

  return parseBangladeshHierarchy({});
}

/**
 * Haversine formula to calculate the distance between two coordinates in meters
 */
export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let lastResolvedCoords: { lat: number; lng: number } | null = null;
const MIN_DISTANCE_METERS = 30; // Minimum 30m distance delta before re-resolving location
const MAX_ACCEPTABLE_ACCURACY = 2500; // Ignore GPS jitter with accuracy radius > 2500m

export function updateRealTimeLocation(
  city: string,
  area?: string,
  lat?: number,
  lng?: number,
  hierarchy?: { division?: string; district?: string; upazila?: string },
  zoneInfo?: {
    currentZoneId?: string;
    zoneName?: string;
    candidateZoneIds?: string[];
    maxDeliveryRadiusKm?: number;
  }
) {
  const cleanCity = city.trim();
  const cleanArea = area ? area.trim() : `${cleanCity} Central`;

  if (lat !== undefined && lng !== undefined) {
    lastResolvedCoords = { lat, lng };
  }

  const newLoc: ILocationInfo = {
    city: cleanCity,
    area: cleanArea,
    formattedAddress: cleanArea,
    division: hierarchy?.division || "",
    district: hierarchy?.district || cleanCity,
    upazila: hierarchy?.upazila || cleanArea,
    currentZoneId: zoneInfo ? (zoneInfo.currentZoneId ?? "") : (cachedLocation.currentZoneId ?? ""),
    zoneName: zoneInfo ? (zoneInfo.zoneName ?? "") : (cachedLocation.zoneName ?? ""),
    candidateZoneIds: zoneInfo ? (zoneInfo.candidateZoneIds ?? []) : (cachedLocation.candidateZoneIds ?? []),
    maxDeliveryRadiusKm: zoneInfo?.maxDeliveryRadiusKm ?? 6.0,
    isInsideServiceArea: Boolean(zoneInfo?.currentZoneId),
    isManualPreference: true,
    lat: lat ?? cachedLocation.lat,
    lng: lng ?? cachedLocation.lng,
    isDetecting: false,
    hasRealLocation: true,
  };

  cachedLocation = newLoc;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("food_flow_user_location", JSON.stringify(newLoc));
    } catch {}
  }

  notifyLocationListeners();
}

export async function fetchIpBasedLocationFallback(): Promise<ILocationInfo | null> {
  let lat = 19.3149;
  let lon = 84.7941;
  let ipCity = "";
  let ipRegion = "";

  try {
    const res = await fetch("/api/location/ip", { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        lat = Number(json.data.latitude) || lat;
        lon = Number(json.data.longitude) || lon;
        ipCity = json.data.city || "";
        ipRegion = json.data.region || "";
      }
    }
  } catch {
    try {
      const res2 = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(3000) });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2?.success !== false && data2?.latitude && data2?.longitude) {
          lat = Number(data2.latitude);
          lon = Number(data2.longitude);
          ipCity = data2.city || "";
          ipRegion = data2.region || "";
        }
      }
    } catch {}
  }

  try {
    const parsed = await reverseGeocodeCoordinates(lat, lon);
    let zoneData: any = null;
    try {
      const zoneRes = await detectZone(lat, lon);
      if (zoneRes?.success && zoneRes.data) {
        zoneData = zoneRes.data;
      }
    } catch {}

    const city = parsed.city || ipCity || "Local City";
    const district = parsed.district || ipRegion || city;
    const division = parsed.division || ipRegion || "State";
    const zId =
      zoneData?.primaryZone?.zoneId !== undefined
        ? String(zoneData.primaryZone.zoneId)
        : zoneData?.primaryZone?._id || "";

    return {
      city,
      area: parsed.area || `${city} Area`,
      formattedAddress: parsed.formattedAddress || parsed.area,
      division,
      district,
      upazila: parsed.upazila || "",
      currentZoneId: zId,
      zoneName: zoneData?.primaryZone?.name || "",
      candidateZoneIds:
        zoneData?.candidateZoneIds && zoneData.candidateZoneIds.length > 0
          ? zoneData.candidateZoneIds.map(String)
          : zId
          ? [zId]
          : [],
      maxDeliveryRadiusKm: zoneData?.maxDeliveryRadiusKm || 5.0,
      isInsideServiceArea: Boolean(zoneData?.isInsideServiceArea && zoneData?.primaryZone),
      lat,
      lng: lon,
      isDetecting: false,
      hasRealLocation: true,
    };
  } catch {}
  return null;
}

export async function detectRealTimeLocation(force: boolean = false): Promise<ILocationInfo> {
  if (typeof window === "undefined") return cachedLocation;

  // If user previously manually selected a location and this is an automatic background check, keep user choice!
  if (!force && cachedLocation.isManualPreference && cachedLocation.hasRealLocation) {
    return cachedLocation;
  }

  cachedLocation = { ...cachedLocation, isDetecting: true };
  notifyLocationListeners();

  // Helper to query browser geolocation with timeout
  const getBrowserCoords = (highAccuracy: boolean): Promise<{ lat: number; lon: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation unsupported"));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => reject(err),
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 5000 : 7000,
          maximumAge: force ? 0 : 30000,
        }
      );
    });
  };

  let resolvedLat: number | null = null;
  let resolvedLon: number | null = null;

  try {
    // Attempt 1: High accuracy GPS (phone/tablet or GPS device)
    const gps1 = await getBrowserCoords(true);
    resolvedLat = gps1.lat;
    resolvedLon = gps1.lon;
  } catch {
    try {
      // Attempt 2: Standard network accuracy (laptops, PCs, Wi-Fi location)
      const gps2 = await getBrowserCoords(false);
      resolvedLat = gps2.lat;
      resolvedLon = gps2.lon;
    } catch {
      // Attempt 3: IP based location fallback
      const ipLoc = await fetchIpBasedLocationFallback();
      if (ipLoc) {
        cachedLocation = ipLoc;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("food_flow_user_location", JSON.stringify(ipLoc));
          } catch {}
        }
        notifyLocationListeners();
        return ipLoc;
      }
    }
  }

  if (resolvedLat !== null && resolvedLon !== null) {
    try {
      const parsed = await reverseGeocodeCoordinates(resolvedLat, resolvedLon);
      lastResolvedCoords = { lat: resolvedLat, lng: resolvedLon };

      let zoneData: any = null;
      try {
        const zoneRes = await detectZone(resolvedLat, resolvedLon);
        if (zoneRes?.success && zoneRes.data) {
          zoneData = zoneRes.data;
        }
      } catch {}

      const detectedZoneId =
        zoneData?.primaryZone?.zoneId !== undefined
          ? String(zoneData.primaryZone.zoneId)
          : zoneData?.primaryZone?._id || "";

      const newLoc: ILocationInfo = {
        city: parsed.city,
        area: parsed.area,
        formattedAddress: parsed.formattedAddress || parsed.area,
        division: parsed.division,
        district: parsed.district,
        upazila: parsed.upazila,
        currentZoneId: detectedZoneId,
        zoneName: zoneData?.primaryZone?.name || "",
        candidateZoneIds:
          zoneData?.candidateZoneIds && zoneData.candidateZoneIds.length > 0
            ? zoneData.candidateZoneIds.map(String)
            : detectedZoneId
            ? [detectedZoneId]
            : [],
        maxDeliveryRadiusKm: zoneData?.maxDeliveryRadiusKm || 5.0,
        isInsideServiceArea: Boolean(zoneData?.isInsideServiceArea && zoneData?.primaryZone),
        isManualPreference: false,
        lat: resolvedLat,
        lng: resolvedLon,
        isDetecting: false,
        hasRealLocation: true,
      };

      cachedLocation = newLoc;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("food_flow_user_location", JSON.stringify(newLoc));
        } catch {}
      }

      notifyLocationListeners();
      return newLoc;
    } catch (err) {
      console.warn("Error processing resolved location coordinates:", err);
    }
  }

  // Fallback to safe default if completely unable to locate
  cachedLocation = { ...cachedLocation, isDetecting: false };
  notifyLocationListeners();
  return cachedLocation;
}


