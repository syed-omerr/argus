import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    
    // Check if videos directory exists
    if (!fs.existsSync(videosDir)) {
      return NextResponse.json({ error: 'Videos directory not found' }, { status: 404 });
    }
    
    // Read all files in the videos directory
    const files = fs.readdirSync(videosDir);
    
    // Filter for video files only
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return videoExtensions.includes(ext);
    });
    
    return NextResponse.json(videoFiles);
  } catch (error) {
    console.error('Error reading videos directory:', error);
    return NextResponse.json({ error: 'Failed to read videos directory' }, { status: 500 });
  }
}
