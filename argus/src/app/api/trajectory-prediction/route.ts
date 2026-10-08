import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface FaceDetectionRecord {
  cameraId: string;
  cameraName: string;
  frameIndex: number;
  timestamp: string;
  zoomImage: string;
  fullImage: string;
  confidence: number;
  isPositiveHit: boolean;
  statusText: string;
  attributes: {
    gender: string;
    heightApprox: string;
    apparel: string;
    carriedItem: string;
  };
  location: { lat: number; lng: number };
}

export interface TrajectoryPrediction {
  lastSeenCamera: string;
  lastSeenTime: string;
  trajectoryHeadingDegrees: number;
  trajectoryDirection: string;
  speedMps: number;
  predictedLocation: {
    name: string;
    lat: number;
    lng: number;
    uncertaintyRadiusMeters: number;
    etaMinutes: number;
    probability: number;
    sectorDescription: string;
  };
  faces: FaceDetectionRecord[];
  predictiveVideoUrl: string;
}

export async function GET() {
  try {
    const facesDir = path.join(process.cwd(), "public", "faces");
    const hasFaces = fs.existsSync(facesDir);

    // Camera mapping for VITS Deshmukhi surveillance feeds
    // NOTE: In the footage, CAM 05 is the ONLY feed with the confirmed suspect hit.
    // The other feeds are verified empty / clear perimeter scans.
    const cameraMetadata: Record<
      string,
      {
        name: string;
        time: string;
        lat: number;
        lng: number;
        conf: number;
        isHit: boolean;
        statusText: string;
      }
    > = {
      cam_05: {
        name: "C5: Central Library & Computer Labs (Stairwell)",
        time: "14:11:05 IST",
        lat: 17.3667,
        lng: 78.7583,
        conf: 0.96,
        isHit: true,
        statusText: "CONFIRMED HIT: Culprit Face & Blue Laptop Lock",
      },
      cam_01: {
        name: "C1: VITS Main Campus Arch Gate",
        time: "14:02:15 IST",
        lat: 17.3702,
        lng: 78.7569,
        conf: 0.0,
        isHit: false,
        statusText: "NO TARGET DETECTED (FEED CLEAR)",
      },
      cam_2: {
        name: "C2: VITS Central Administrative Foyer",
        time: "14:04:30 IST",
        lat: 17.3707,
        lng: 78.7571,
        conf: 0.0,
        isHit: false,
        statusText: "NO TARGET DETECTED (FEED CLEAR)",
      },
      cam_03: {
        name: "C3: Engineering Block A/B Quadrangle",
        time: "14:06:50 IST",
        lat: 17.3698,
        lng: 78.7582,
        conf: 0.0,
        isHit: false,
        statusText: "NO TARGET DETECTED (FEED CLEAR)",
      },
      cam_04: {
        name: "C4: Deshmukhi Village Bus Bay",
        time: "14:09:12 IST",
        lat: 17.368,
        lng: 78.7588,
        conf: 0.0,
        isHit: false,
        statusText: "NO TARGET DETECTED (FEED CLEAR)",
      },
      cam_08: {
        name: "C8: Deshmukhi - Pochampally Road Junction",
        time: "14:13:40 IST",
        lat: 17.3645,
        lng: 78.761,
        conf: 0.0,
        isHit: false,
        statusText: "NO TARGET DETECTED (FEED CLEAR)",
      },
      cam_10: {
        name: "C10: Boys Hostel Outer Perimeter Sensor",
        time: "14:16:22 IST",
        lat: 17.3628,
        lng: 78.7635,
        conf: 0.0,
        isHit: false,
        statusText: "NO TARGET DETECTED (FEED CLEAR)",
      },
      cam_11: {
        name: "C11: Batasingaram Highway Approach Cam",
        time: "14:19:05 IST",
        lat: 17.3605,
        lng: 78.7665,
        conf: 0.0,
        isHit: false,
        statusText: "NO TARGET DETECTED (FEED CLEAR)",
      },
    };

    const faces: FaceDetectionRecord[] = [];

    if (hasFaces) {
      // Put confirmed hit CAM 05 FIRST
      const order = ["cam_05", "cam_01", "cam_2", "cam_03", "cam_04", "cam_08", "cam_10", "cam_11"];
      for (const camKey of order) {
        const meta = cameraMetadata[camKey];
        if (!meta) continue;

        const zoomFile = `/faces/zoom_${camKey}.jpg`;
        const fullFile = `/faces/full_${camKey}.jpg`;

        faces.push({
          cameraId: camKey.toUpperCase().replace("_", ""),
          cameraName: meta.name,
          frameIndex: meta.isHit ? 423 : 100,
          timestamp: meta.time,
          zoomImage: zoomFile,
          fullImage: fullFile,
          confidence: meta.conf,
          isPositiveHit: meta.isHit,
          statusText: meta.statusText,
          attributes: meta.isHit
            ? {
                gender: "Male",
                heightApprox: "5'10\"",
                apparel: "Light shirt, dark trousers, lanyard",
                carriedItem: "Blue laptop & documents",
              }
            : {
                gender: "N/A",
                heightApprox: "N/A",
                apparel: "N/A",
                carriedItem: "N/A",
              },
          location: { lat: meta.lat, lng: meta.lng },
        });
      }
    }

    // Trajectory calculation originating from the confirmed sighting at C5 (Library Stairwell)
    // Headed South-East (135°) through Deshmukhi Road towards Batasingaram Junction (NH-65)
    const prediction: TrajectoryPrediction = {
      lastSeenCamera: "C5: Central Library & Computer Labs (Stairwell)",
      lastSeenTime: "14:11:05 IST",
      trajectoryHeadingDegrees: 135,
      trajectoryDirection: "South-East egress corridor from Library towards Batasingaram Highway Junction",
      speedMps: 1.4, // brisk pedestrian walk ~ 5 km/h
      predictedLocation: {
        name: "Batasingaram Highway Junction & Toll Approach (NH-65)",
        lat: 17.3562,
        lng: 78.7715,
        uncertaintyRadiusMeters: 380,
        etaMinutes: 6.2,
        probability: 0.94,
        sectorDescription:
          "High-probability intercept zone along the South-East exit road from VITS Deshmukhi connecting to NH-65 Hyderabad-Vijayawada highway corridor.",
      },
      faces,
      predictiveVideoUrl: "/videos/final_enhanced_video.mp4",
    };

    return NextResponse.json(prediction);
  } catch (error: unknown) {
    console.error("[Trajectory Prediction Error]:", error);
    return NextResponse.json({ error: "Failed to compute trajectory" }, { status: 500 });
  }
}
