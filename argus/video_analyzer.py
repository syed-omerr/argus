#!/usr/bin/env python3
"""
Video Analyzer Script
Analyzes video properties to diagnose merging issues
"""

import os
from moviepy.editor import VideoFileClip

def analyze_video(video_path):
    """Analyze a single video file"""
    try:
        print(f"\n📹 Analyzing: {os.path.basename(video_path)}")
        print("-" * 40)
        
        clip = VideoFileClip(video_path)
        
        print(f"Duration: {clip.duration:.2f} seconds")
        print(f"FPS: {clip.fps}")
        print(f"Size: {clip.size}")
        print(f"Has audio: {clip.audio is not None}")
        
        if clip.audio:
            print(f"Audio duration: {clip.audio.duration:.2f} seconds")
            print(f"Audio FPS: {clip.audio.fps}")
        
        # Check if video has any frames
        try:
            first_frame = clip.get_frame(0)
            print(f"First frame shape: {first_frame.shape}")
            print(f"First frame dtype: {first_frame.dtype}")
        except Exception as e:
            print(f"❌ Error reading first frame: {e}")
        
        clip.close()
        return True
        
    except Exception as e:
        print(f"❌ Error analyzing {video_path}: {e}")
        return False

def analyze_all_videos():
    """Analyze both video files"""
    videos_folder = os.path.join("src", "videosNEW")
    video1_path = os.path.join(videos_folder, "v1.mp4")
    video2_path = os.path.join(videos_folder, "v2.mp4")
    
    print("🔍 Video Analysis Report")
    print("=" * 50)
    
    for video_path in [video1_path, video2_path]:
        if os.path.exists(video_path):
            analyze_video(video_path)
        else:
            print(f"❌ File not found: {video_path}")
    
    # Also check the merged video if it exists
    merged_path = os.path.join(videos_folder, "merged_video.mp4")
    if os.path.exists(merged_path):
        analyze_video(merged_path)

if __name__ == "__main__":
    analyze_all_videos()
