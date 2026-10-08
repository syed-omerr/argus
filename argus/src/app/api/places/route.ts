import { NextResponse } from "next/server";

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

type Place = {
  place_id: string;
  name: string;
  formatted_address: string;
  location: { lat: number; lng: number };
  types: string[];
  icon?: string;
  photoUrl?: string;
};

// ── Specific Landmark & Mandal Coordinates Database (Hyderabad & Telangana) ──
const HYDERABAD_TELANGANA_SECTOR: Record<
  string,
  {
    lat: number;
    lng: number;
    address: string;
    cameraTypes: Array<{ name: string; types: string[] }>;
  }
> = {
  vignan: {
    lat: 17.3685,
    lng: 78.7565,
    address:
      "Vignan Institute of Technology and Science (VITS), Deshmukhi Village, Pochampally Mandal, Yadadri Bhuvanagiri District, Telangana 508284",
    cameraTypes: [
      { name: "VITS Main Campus Arch Gate & Security Ingress", types: ["university", "security"] },
      { name: "VITS Central Administrative Foyer Node", types: ["university", "building"] },
      { name: "Engineering Block A/B Central Quadrangle Feed", types: ["university", "education"] },
      { name: "Deshmukhi Village Bus Bay & Junction Cam", types: ["bus_station", "transit"] },
      { name: "Central Library & Computer Labs Ingress Cam", types: ["library", "university"] },
      { name: "College Fleet Terminal & Student Parking Sensor", types: ["parking", "transit"] },
      { name: "Deshmukhi - Pochampally Main Road Checkpoint", types: ["intersection", "security"] },
      { name: "Batasingaram Highway Junction Surveillance C8", types: ["highway", "transit"] },
      { name: "Pedda Amberpet ORR Toll Approach Feed C9", types: ["toll_station", "highway"] },
      { name: "Boys Hostel Outer Perimeter & Sports Ground Sensor", types: ["university", "security"] },
      { name: "Girls Hostel Security Post & Pathway Cam", types: ["university", "security"] },
      { name: "R&D Innovation Complex Perimeter Monitoring C12", types: ["university", "building"] },
    ],
  },
  deshmukhi: {
    lat: 17.3685,
    lng: 78.7565,
    address:
      "Deshmukhi Village, Pochampally Mandal, Yadadri Bhuvanagiri District, Telangana 508284",
    cameraTypes: [
      { name: "Deshmukhi Gram Panchayat Main Junction Cam", types: ["government", "intersection"] },
      { name: "VITS Campus Approach Road Surveillance Node", types: ["university", "security"] },
      { name: "Pochampally Handloom Road Crossway Sensor", types: ["commercial", "intersection"] },
      { name: "Deshmukhi Primary Health Center Perimeter Cam", types: ["hospital", "health"] },
      { name: "Batasingaram Link Road Security Post C5", types: ["transit", "security"] },
      { name: "Pedda Amberpet ORR Feeder Junction Feed", types: ["highway", "transit"] },
    ],
  },
  pochampally: {
    lat: 17.3458,
    lng: 78.8167,
    address:
      "Bhoodan Pochampally Mandal Center, Yadadri Bhuvanagiri District, Telangana 508284",
    cameraTypes: [
      { name: "Pochampally Handloom Weavers Park Ingress", types: ["commercial", "security"] },
      { name: "Mandal Revenue Office (MRO) Main Road Feed", types: ["government", "building"] },
      { name: "Pochampally Bus Stand & Junction Node C3", types: ["bus_station", "transit"] },
      { name: "Police Station Pochampally Traffic Cam", types: ["police", "security"] },
    ],
  },
  hayathnagar: {
    lat: 17.324,
    lng: 78.598,
    address: "Hayathnagar / Pedda Amberpet Corridor, Hyderabad, Telangana 501505",
    cameraTypes: [
      { name: "Hayathnagar NH 65 Highway Overpass Cam", types: ["highway", "traffic"] },
      { name: "Pedda Amberpet Outer Ring Road (ORR) Junction", types: ["highway", "transit"] },
      { name: "Hayathnagar RTC Depot & Ingress Camera", types: ["bus_station", "transit"] },
    ],
  },
  bhuvanagiri: {
    lat: 17.5144,
    lng: 78.8872,
    address: "Bhuvanagiri Fort & Mandal Center, Yadadri Bhuvanagiri District, Telangana 508116",
    cameraTypes: [
      { name: "Bhuvanagiri Railway Station Approach Cam", types: ["train_station", "transit"] },
      { name: "District Collectorate Gateway Surveillance", types: ["government", "security"] },
      { name: "Bhuvanagiri Bus Terminal Surveillance Feed", types: ["bus_station", "transit"] },
    ],
  },
  "lb nagar": {
    lat: 17.3457,
    lng: 78.5522,
    address: "LB Nagar Ring Road & Metro Interchange, Hyderabad, Telangana 500074",
    cameraTypes: [
      { name: "LB Nagar Metro Station Entry Gate Cam", types: ["subway_station", "transit"] },
      { name: "Vijayawada Highway Flyover Junction Feed", types: ["highway", "intersection"] },
      { name: "Chintalkunta Checkpost Traffic Monitoring", types: ["police", "security"] },
    ],
  },
  ghatkesar: {
    lat: 17.4475,
    lng: 78.6836,
    address: "Ghatkesar Mandal & ORR Growth Corridor, Medchal-Malkajgiri, Telangana 501301",
    cameraTypes: [
      { name: "Ghatkesar Railway Station Road Surveillance", types: ["train_station", "transit"] },
      { name: "Warangal Highway (NH 163) Junction Camera", types: ["highway", "intersection"] },
    ],
  },
  uppal: {
    lat: 17.4018,
    lng: 78.5602,
    address: "Uppal Cross Roads & Rajiv Gandhi International Stadium, Hyderabad, Telangana",
    cameraTypes: [
      { name: "Uppal Junction Metro Station Surveillance", types: ["subway_station", "transit"] },
      { name: "Cricket Stadium Perimeter Sensor C2", types: ["stadium", "security"] },
    ],
  },
  gachibowli: {
    lat: 17.4401,
    lng: 78.3489,
    address: "Gachibowli Cyber Corridor & Financial District, Hyderabad, Telangana",
    cameraTypes: [
      { name: "Gachibowli ORR Flyover Junction Cam", types: ["highway", "transit"] },
      { name: "Financial District Ingress Traffic Sensor", types: ["commercial", "security"] },
    ],
  },
  hyderabad: {
    lat: 17.385,
    lng: 78.4867,
    address: "Hyderabad Metropolitan Sector, Telangana, India",
    cameraTypes: [
      { name: "Police Command & Control Center Road Feed", types: ["police", "security"] },
      { name: "Tank Bund / Hussain Sagar Perimeter Node", types: ["public", "traffic"] },
      { name: "Metro Rail Major Transit Hub Camera", types: ["subway_station", "transit"] },
    ],
  },
};

// ── Multi-Tier Geocoder (Priority: Hyderabad/Telangana DB -> Google Maps -> OSM -> Recovery) ────
async function resolveCoordinates(street: string): Promise<{
  center: { lat: number; lng: number };
  formatted_address: string;
  matchedSectorKey?: string;
}> {
  const lower = street.toLowerCase();

  // 1) Instant Local Resolution for Hyderabad, Telangana, and VITS Deshmukhi mandals
  for (const [key, sector] of Object.entries(HYDERABAD_TELANGANA_SECTOR)) {
    if (lower.includes(key)) {
      console.log(`[Geocode] Direct sector match for "${key}": ${sector.address}`);
      return {
        center: { lat: sector.lat, lng: sector.lng },
        formatted_address: sector.address,
        matchedSectorKey: key,
      };
    }
  }

  // Also check common aliases for Vignan / Deshmukhi
  if (
    lower.includes("vits") ||
    lower.includes("vignan") ||
    lower.includes("deshmukhi") ||
    lower.includes("deshmuki")
  ) {
    const vits = HYDERABAD_TELANGANA_SECTOR.vignan;
    return {
      center: { lat: vits.lat, lng: vits.lng },
      formatted_address: vits.address,
      matchedSectorKey: "vignan",
    };
  }

  // 2) Try Google Maps Geocoding API if key is present
  if (GMAPS_KEY && GMAPS_KEY.trim() !== "") {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          street
        )}&key=${GMAPS_KEY}`
      ).then((r) => r.json());

      if (gRes.status === "OK" && gRes.results?.[0]) {
        const geo = gRes.results[0];
        let center = geo.geometry.location as { lat: number; lng: number };
        if (geo.geometry.viewport) {
          const { northeast, southwest } = geo.geometry.viewport;
          center = {
            lat: (northeast.lat + southwest.lat) / 2,
            lng: (northeast.lng + southwest.lng) / 2,
          };
        }
        return { center, formatted_address: geo.formatted_address };
      }
    } catch (err) {
      console.warn("[Geocode] Google Maps request error:", err);
    }
  }

  // 3) Try OpenStreetMap Nominatim with retry protection
  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        street
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "ARGUS-Surveillance-Telangana/2.0",
          Accept: "application/json",
        },
      }
    ).then((r) => r.json());

    if (Array.isArray(osmRes) && osmRes.length > 0) {
      const first = osmRes[0];
      return {
        center: {
          lat: parseFloat(first.lat),
          lng: parseFloat(first.lon),
        },
        formatted_address: first.display_name || street,
      };
    }
  } catch (err) {
    console.warn("[Geocode] Nominatim request failed:", err);
  }

  // 4) Default to Vignan Institute of Technology & Science, Deshmukhi, Hyderabad
  const defaultSector = HYDERABAD_TELANGANA_SECTOR.vignan;
  return {
    center: { lat: defaultSector.lat, lng: defaultSector.lng },
    formatted_address: `${street} — ${defaultSector.address}`,
    matchedSectorKey: "vignan",
  };
}

// ── Local Camera Positions Generator for Hyderabad & Telangana Mandals ──
function generateLocalCameras(
  center: { lat: number; lng: number },
  searchRadius: number,
  baseAddress: string,
  matchedSectorKey?: string
): Place[] {
  const sector =
    (matchedSectorKey && HYDERABAD_TELANGANA_SECTOR[matchedSectorKey]) ||
    HYDERABAD_TELANGANA_SECTOR.vignan;

  const cameraDefs = sector.cameraTypes;

  return cameraDefs.map((def, idx) => {
    // Distribute cameras around center within search radius
    const angle = (idx / cameraDefs.length) * 2 * Math.PI + (idx % 2 === 0 ? 0.25 : -0.25);
    const distanceMeters = Math.max(
      120,
      Math.min(searchRadius * 0.92, (0.2 + (idx / cameraDefs.length) * 0.72) * searchRadius)
    );

    // 1 deg lat ~ 111320m
    const latOffset = (distanceMeters * Math.cos(angle)) / 111320;
    const lngOffset = (distanceMeters * Math.sin(angle)) / (111320 * Math.cos((center.lat * Math.PI) / 180));

    return {
      place_id: `argus-hyd-${idx + 1}-${Math.round(center.lat * 10000)}-${Math.round(center.lng * 10000)}`,
      name: `C${idx + 1}: ${def.name}`,
      formatted_address: `${def.name}, Deshmukhi - Pochampally Sector, Telangana`,
      location: {
        lat: Number((center.lat + latOffset).toFixed(6)),
        lng: Number((center.lng + lngOffset).toFixed(6)),
      },
      types: def.types,
      photoUrl: undefined,
    };
  });
}

export async function POST(req: Request) {
  try {
    const { street, radius } = await req.json();
    const query = street && typeof street === "string" ? street.trim() : "Vignan Institute of Technology and Science, Deshmukhi";

    const searchRadius =
      radius && typeof radius === "number" && radius > 0 ? radius : 1000;

    // 1) Resolve coordinates (direct instant resolution for VITS Deshmukhi & Telangana)
    const { center, formatted_address, matchedSectorKey } = await resolveCoordinates(query);

    // 2) Query Google Places API (if key is valid and billed)
    let places: Place[] = [];

    if (GMAPS_KEY && GMAPS_KEY.trim() !== "") {
      try {
        const nearbySearchURL = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${searchRadius}&type=university|school|establishment&key=${GMAPS_KEY}`;
        const response = await fetch(nearbySearchURL);
        const data = await response.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
          places = data.results.slice(0, 20).map((p: {
            place_id: string;
            name: string;
            vicinity?: string;
            formatted_address?: string;
            geometry?: { location: { lat: number; lng: number } };
            types?: string[];
            icon?: string;
          }) => ({
            place_id: p.place_id,
            name: p.name,
            formatted_address: p.vicinity || p.formatted_address || formatted_address,
            location: p.geometry?.location || center,
            types: p.types || [],
            icon: p.icon,
          }));
        }
      } catch (err) {
        console.warn("[Places] Google Places search encountered error:", err);
      }
    }

    // 3) Use dedicated Hyderabad / VITS Deshmukhi camera network if Places is unbilled
    if (places.length === 0) {
      console.log(`[ARGUS Intel] Deploying surveillance network for: ${formatted_address}`);
      places = generateLocalCameras(center, searchRadius, formatted_address, matchedSectorKey);
    }

    return NextResponse.json({
      center,
      places,
      geocoded_address: formatted_address,
      radius: searchRadius,
    });
  } catch (e: unknown) {
    console.error("[Places Route Error]:", e);
    const fallbackSector = HYDERABAD_TELANGANA_SECTOR.vignan;
    return NextResponse.json({
      center: { lat: fallbackSector.lat, lng: fallbackSector.lng },
      places: generateLocalCameras(
        { lat: fallbackSector.lat, lng: fallbackSector.lng },
        1000,
        fallbackSector.address,
        "vignan"
      ),
      geocoded_address: fallbackSector.address,
      radius: 1000,
    });
  }
}
