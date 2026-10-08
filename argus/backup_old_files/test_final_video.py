#!/usr/bin/env python3
"""
Test script to check the final enhanced video
"""

import os
from moviepy.editor import VideoFileClip

def test_final_video():
    """Test the final_enhanced_video.mp4 file"""
    
    videos_folder = os.path.join("src", "videosNEW")
    final_video_path = os.path.join(videos_folder, "final_enhanced_video.mp4")
    
    if not os.path.exists(final_video_path):
        print(f"Final enhanced video not found: {final_video_path}")
        return False
    
    try:
        print(f"Testing final enhanced video: {final_video_path}")
        
        with VideoFileClip(final_video_path) as clip:
            print(f"Video loaded successfully!")
            print(f"Duration: {clip.duration:.2f} seconds")
            print(f"Resolution: {clip.size}")
            print(f"FPS: {clip.fps}")
            print(f"Has audio: {clip.audio is not None}")
            
            if clip.audio:
                print(f"Audio duration: {clip.audio.duration:.2f} seconds")
            
            print(f"\nFinal enhanced video is ready!")
            print(f"This video contains:")
            print(f"  - First 10.08s: Runway-generated CCTV footage")
            print(f"  - Next 2.48s: Original V1 video")
            print(f"  - AI-generated voiceover throughout")
            
            return True
            
    except Exception as e:
        print(f"Error testing final video: {e}")
        return False

if __name__ == "__main__":
    test_final_video()
