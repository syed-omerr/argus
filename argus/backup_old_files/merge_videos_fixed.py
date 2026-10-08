#!/usr/bin/env python3
"""
Fixed Video Merger Script
Properly handles videos with different resolutions and formats
"""

import os
from moviepy.editor import VideoFileClip, concatenate_videoclips

def merge_videos_with_resize():
    """
    Merge videos with proper resolution handling
    """
    # Define paths
    videos_folder = os.path.join("src", "videosNEW")
    video1_path = os.path.join(videos_folder, "v1.mp4")
    video2_path = os.path.join(videos_folder, "v2.mp4")
    output_path = os.path.join(videos_folder, "merged_video_fixed.mp4")
    
    # Check if input files exist
    if not os.path.exists(video1_path):
        print(f"Error: {video1_path} not found!")
        return False
    
    if not os.path.exists(video2_path):
        print(f"Error: {video2_path} not found!")
        return False
    
    try:
        print("🎬 Loading video files...")
        
        # Load video clips
        clip1 = VideoFileClip(video1_path)
        clip2 = VideoFileClip(video2_path)
        
        print(f"Video 1: {clip1.size} - {clip1.duration:.2f}s")
        print(f"Video 2: {clip2.size} - {clip2.duration:.2f}s")
        
        # Determine target resolution (use the larger one or a common resolution)
        # Option 1: Use v2's resolution since it's larger
        target_width, target_height = clip2.size
        
        print(f"Target resolution: {target_width}x{target_height}")
        
        # Resize clip1 to match clip2's resolution
        print("📐 Resizing videos to match...")
        clip1_resized = clip1.resize((target_width, target_height))
        
        # Keep clip2 as is since we're using its resolution
        clip2_resized = clip2
        
        print("🔗 Concatenating videos...")
        # Concatenate the resized videos
        final_clip = concatenate_videoclips([clip1_resized, clip2_resized])
        
        # Write the result to a file
        print(f"💾 Saving merged video to: {output_path}")
        final_clip.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac' if final_clip.audio else None,
            temp_audiofile='temp-audio.m4a',
            remove_temp=True,
            verbose=False,
            logger=None
        )
        
        # Clean up
        clip1.close()
        clip2.close()
        clip1_resized.close()
        clip2_resized.close()
        final_clip.close()
        
        print(f"✅ Successfully merged videos!")
        print(f"Output: {output_path}")
        print(f"Resolution: {target_width}x{target_height}")
        print(f"Total duration: {clip1.duration + clip2.duration:.2f} seconds")
        
        return True
        
    except Exception as e:
        print(f"❌ Error merging videos: {str(e)}")
        return False

def merge_videos_with_padding():
    """
    Alternative approach: Add padding to maintain aspect ratios
    """
    # Define paths
    videos_folder = os.path.join("src", "videosNEW")
    video1_path = os.path.join(videos_folder, "v1.mp4")
    video2_path = os.path.join(videos_folder, "v2.mp4")
    output_path = os.path.join(videos_folder, "merged_video_padded.mp4")
    
    try:
        print("\n🎬 Alternative method: Padding approach...")
        
        # Load video clips
        clip1 = VideoFileClip(video1_path)
        clip2 = VideoFileClip(video2_path)
        
        # Find the maximum dimensions
        max_width = max(clip1.w, clip2.w)
        max_height = max(clip1.h, clip2.h)
        
        print(f"Target canvas: {max_width}x{max_height}")
        
        # Resize both clips to fit in the canvas while maintaining aspect ratio
        clip1_fitted = clip1.resize(height=max_height).on_color(
            size=(max_width, max_height), 
            color=(0, 0, 0),  # Black padding
            pos='center'
        )
        
        clip2_fitted = clip2.resize(height=max_height).on_color(
            size=(max_width, max_height), 
            color=(0, 0, 0),  # Black padding
            pos='center'
        )
        
        # Concatenate the fitted videos
        final_clip = concatenate_videoclips([clip1_fitted, clip2_fitted])
        
        # Write the result
        final_clip.write_videofile(
            output_path,
            codec='libx264',
            verbose=False,
            logger=None
        )
        
        # Clean up
        clip1.close()
        clip2.close()
        clip1_fitted.close()
        clip2_fitted.close()
        final_clip.close()
        
        print(f"✅ Padded merge completed: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Padding method failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🎬 Fixed Video Merger Tool")
    print("=" * 35)
    
    # Try the resize method first
    success = merge_videos_with_resize()
    
    if not success:
        print("\n🔄 Resize method failed. Trying padding method...")
        success = merge_videos_with_padding()
    
    if success:
        print("\n🎉 Video merging completed successfully!")
        print("Check the videosNEW folder for the new merged video(s).")
    else:
        print("\n💥 All merging methods failed.")
        print("The videos might have incompatible formats.")
