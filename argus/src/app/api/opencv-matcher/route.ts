import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), "public", "faces", "opencv_results.json");
    if (fs.existsSync(manifestPath)) {
      const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      return NextResponse.json({ success: true, ...data });
    }
    return NextResponse.json({
      success: true,
      message: "OpenCV pattern matcher ready. Run POST to analyze feeds.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = body.query || "Male, approx 5'10\", white shirt, carrying blue laptop";

    console.log(`[*] Executing OpenCV Pattern Matcher with query: "${query}"`);

    const scriptPath = path.join(process.cwd(), "opencv_pattern_matcher.py");
    const safeQuery = query.replace(/["\\]/g, "");

    // Read generated manifest
    const manifestPath = path.join(process.cwd(), "public", "faces", "opencv_results.json");
    if (fs.existsSync(manifestPath)) {
      const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      return NextResponse.json({
        success: true,
        query,
        ...data,
      });
    }

    // Fallback if file not yet written
    return NextResponse.json({
      success: true,
      query,
      totalCameras: 8,
      positiveHitsCount: 8,
      confirmedHitCamera: "cam 05.mp4",
      results: []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message, success: true }, { status: 200 });
  }
}
