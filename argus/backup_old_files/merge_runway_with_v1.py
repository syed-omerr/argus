#!/usr/bin/env python3
"""
Merge Runway Generated Video with V1
Merges the AI-generated CCTV video with v1.mp4
"""

import os
from moviepy.editor import VideoFileClip, concatenate_videoclips

def merge_runway_with_v1():
    """
    Merge the Runway-generated video with v1.mp4
    """
    # Define paths
    videos_folder = os.path.join("src", "videosNEW")
    runway_video_path = os.path.join(videos_folder, "cctv-footage_generated.mp4")
    v1_video_path = os.path.join(videos_folder, "v1.mp4")
    output_path = os.path.join(videos_folder, "runway_v1_merged.mp4")
    
    # Check if input files exist
    if not os.path.exists(runway_video_path):
        print(f"❌ Error: {runway_video_path} not found!")
        print("Make sure the Runway video generation completed successfully.")
        return False
    
    if not os.path.exists(v1_video_path):
        print(f"❌ Error: {v1_video_path} not found!")
        return False
    
    try:
        print("🎬 Loading video files...")
        
        # Load video clips
        runway_clip = VideoFileClip(runway_video_path)
        v1_clip = VideoFileClip(v1_video_path)
        
        print(f"Runway video: {runway_clip.size} - {runway_clip.duration:.2f}s")
        print(f"V1 video: {v1_clip.size} - {v1_clip.duration:.2f}s")
        
        # Determine target resolution (use the larger resolution)
        runway_width, runway_height = runway_clip.size
        v1_width, v1_height = v1_clip.size
        
        # Use the higher resolution as target
        if runway_width * runway_height >= v1_width * v1_height:
            target_width, target_height = runway_width, runway_height
            print(f"Using Runway video resolution: {target_width}x{target_height}")
            runway_resized = runway_clip
            v1_resized = v1_clip.resize((target_width, target_height))
        else:
            target_width, target_height = v1_width, v1_height
            print(f"Using V1 video resolution: {target_width}x{target_height}")
            runway_resized = runway_clip.resize((target_width, target_height))
            v1_resized = v1_clip
        
        print("🔗 Concatenating videos...")
        # Concatenate: Runway video first, then v1
        final_clip = concatenate_videoclips([runway_resized, v1_resized])
        
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
        runway_clip.close()
        v1_clip.close()
        runway_resized.close()
        v1_resized.close()
        final_clip.close()
        
        total_duration = runway_clip.duration + v1_clip.duration
        
        print(f"✅ Successfully merged videos!")
        print(f"Output: {output_path}")
        print(f"Resolution: {target_width}x{target_height}")
        print(f"Total duration: {total_duration:.2f} seconds")
        print(f"Sequence: Runway video ({runway_clip.duration:.1f}s) → V1 video ({v1_clip.duration:.1f}s)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error merging videos: {str(e)}")
        return False

def merge_with_padding():
    """
    Alternative approach: Add padding to maintain aspect ratios
    """
    videos_folder = os.path.join("src", "videosNEW")
    runway_video_path = os.path.join(videos_folder, "cctv-footage_generated.mp4")
    v1_video_path = os.path.join(videos_folder, "v1.mp4")
    output_path = os.path.join(videos_folder, "runway_v1_padded.mp4")
    
    try:
        print("\n🎬 Alternative method: Padding approach...")
        
        # Load video clips
        runway_clip = VideoFileClip(runway_video_path)
        v1_clip = VideoFileClip(v1_video_path)
        
        # Find the maximum dimensions
        max_width = max(runway_clip.w, v1_clip.w)
        max_height = max(runway_clip.h, v1_clip.h)
        
        print(f"Target canvas: {max_width}x{max_height}")
        
        # Resize both clips to fit in the canvas while maintaining aspect ratio
        runway_fitted = runway_clip.resize(height=max_height).on_color(
            size=(max_width, max_height), 
            color=(0, 0, 0),  # Black padding
            pos='center'
        )
        
        v1_fitted = v1_clip.resize(height=max_height).on_color(
            size=(max_width, max_height), 
            color=(0, 0, 0),  # Black padding
            pos='center'
        )
        
        # Concatenate the fitted videos
        final_clip = concatenate_videoclips([runway_fitted, v1_fitted])
        
        # Write the result
        final_clip.write_videofile(
            output_path,
            codec='libx264',
            verbose=False,
            logger=None
        )
        
        # Clean up
        runway_clip.close()
        v1_clip.close()
        runway_fitted.close()
        v1_fitted.close()
        final_clip.close()
        
        print(f"✅ Padded merge completed: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Padding method failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🎬 Runway + V1 Video Merger")
    print("=" * 35)
    
    # Try the resize method first
    success = merge_runway_with_v1()
    
    if not success:
        print("\n🔄 Resize method failed. Trying padding method...")
        success = merge_with_padding()
    
    if success:
        print("\n🎉 Video merging completed successfully!")
        print("Check the videosNEW folder for the new merged video.")
    else:
        print("\n💥 All merging methods failed.")
        print("Please check that both video files exist and are valid.")
