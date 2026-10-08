#!/usr/bin/env python3
"""
Test script to check the merged video integrity
"""

import os
from moviepy.editor import VideoFileClip

def test_merged_video():
    """Test the runway_v1_merged.mp4 file"""
    
    videos_folder = os.path.join("src", "videosNEW")
    merged_video_path = os.path.join(videos_folder, "runway_v1_merged.mp4")
    
    if not os.path.exists(merged_video_path):
        print(f"❌ Merged video not found: {merged_video_path}")
        return False
    
    try:
        print(f"🎬 Testing merged video: {merged_video_path}")
        
        with VideoFileClip(merged_video_path) as clip:
            print(f"✅ Video loaded successfully!")
            print(f"Duration: {clip.duration:.2f} seconds")
            print(f"Resolution: {clip.size}")
            print(f"FPS: {clip.fps}")
            print(f"Has audio: {clip.audio is not None}")
            
            if clip.audio:
                print(f"Audio duration: {clip.audio.duration:.2f} seconds")
            
            # Test if we can read frames at different times
            print("\n🔍 Testing video frames...")
            test_times = [0, clip.duration * 0.25, clip.duration * 0.5, clip.duration * 0.75, clip.duration - 0.1]
            
            for i, t in enumerate(test_times):
                if t < clip.duration:
                    try:
                        frame = clip.get_frame(t)
                        print(f"  Frame at {t:.1f}s: {frame.shape} ✅")
                    except Exception as e:
                        print(f"  Frame at {t:.1f}s: ERROR - {e} ❌")
            
            print(f"\n✅ Merged video appears to be intact!")
            return True
            
    except Exception as e:
        print(f"❌ Error testing merged video: {e}")
        return False

if __name__ == "__main__":
    test_merged_video()
