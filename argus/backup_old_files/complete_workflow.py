#!/usr/bin/env python3
"""
Complete Integrated Workflow
Handles the entire pipeline from image to final enhanced video
"""

import os
import sys
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Import our custom modules
try:
    from runway_image_to_video import RunwayImageToVideo
    from enhanced_video_generator import EnhancedVideoGenerator
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

# Import merge function
def merge_runway_with_v1():
    """Merge runway video with v1 - inline implementation"""
    import os
    from moviepy.editor import VideoFileClip, concatenate_videoclips
    
    videos_folder = os.path.join("src", "videosNEW")
    runway_video_path = os.path.join(videos_folder, "cctv-footage_generated.mp4")
    v1_video_path = os.path.join(videos_folder, "v1.mp4")
    output_path = os.path.join(videos_folder, "runway_v1_merged.mp4")
    
    try:
        print("Loading video files...")
        runway_clip = VideoFileClip(runway_video_path)
        v1_clip = VideoFileClip(v1_video_path)
        
        print(f"Runway video: {runway_clip.size} - {runway_clip.duration:.2f}s")
        print(f"V1 video: {v1_clip.size} - {v1_clip.duration:.2f}s")
        
        # Use runway resolution as target
        runway_width, runway_height = runway_clip.size
        v1_resized = v1_clip.resize((runway_width, runway_height))
        
        print("Concatenating videos...")
        final_clip = concatenate_videoclips([runway_clip, v1_resized])
        
        print(f"Saving merged video to: {output_path}")
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
        v1_resized.close()
        final_clip.close()
        
        print("Successfully merged videos!")
        return True
        
    except Exception as e:
        print(f"Error merging videos: {e}")
        return False

# Load environment variables
load_dotenv('.env.local')

class CompleteWorkflow:
    def __init__(self):
        self.videos_folder = os.path.join("src", "videosNEW")
        self.image_path = os.path.join(self.videos_folder, "cctv-footage.jpg")
        self.v1_path = os.path.join(self.videos_folder, "v1.mp4")
        
        # Check required API keys
        self.runway_api_key = os.getenv('RUNWAY_API_KEY')
        self.cerebras_api_key = os.getenv('CEREBRAS_API_KEY')
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        
        if not all([self.runway_api_key, self.cerebras_api_key, self.elevenlabs_api_key]):
            missing = []
            if not self.runway_api_key: missing.append("RUNWAY_API_KEY")
            if not self.cerebras_api_key: missing.append("CEREBRAS_API_KEY")
            if not self.elevenlabs_api_key: missing.append("ELEVENLABS_API_KEY")
            raise ValueError(f"Missing API keys in .env.local: {', '.join(missing)}")
    
    def step1_generate_runway_video(self):
        """Step 1: Generate CCTV footage using Runway"""
        print("Step 1: Generating realistic CCTV footage with Runway AI...")
        
        if not os.path.exists(self.image_path):
            return {"success": False, "error": f"Source image not found: {self.image_path}"}
        
        try:
            runway_generator = RunwayImageToVideo(self.runway_api_key)
            
            # Generate video from CCTV image
            success = runway_generator.generate_video_from_image(
                image_path=self.image_path,
                output_dir=self.videos_folder,
                prompt_text="People walking naturally and realistically through the scene, smooth camera movement, realistic lighting and shadows, natural human movement, cinematic quality, surveillance camera perspective",
                duration=10
            )
            
            if success:
                generated_path = os.path.join(self.videos_folder, "cctv-footage_generated.mp4")
                return {"success": True, "video_path": generated_path}
            else:
                return {"success": False, "error": "Runway video generation failed"}
                
        except Exception as e:
            return {"success": False, "error": f"Runway generation error: {str(e)}"}
    
    def step2_merge_videos(self):
        """Step 2: Merge Runway video with V1"""
        print("Step 2: Merging Runway video with V1...")
        
        runway_video = os.path.join(self.videos_folder, "cctv-footage_generated.mp4")
        
        if not os.path.exists(runway_video):
            return {"success": False, "error": "Runway video not found for merging"}
        
        if not os.path.exists(self.v1_path):
            return {"success": False, "error": f"V1 video not found: {self.v1_path}"}
        
        try:
            # Use the existing merge function
            success = merge_runway_with_v1()
            
            if success:
                merged_path = os.path.join(self.videos_folder, "runway_v1_merged.mp4")
                return {"success": True, "merged_path": merged_path}
            else:
                return {"success": False, "error": "Video merging failed"}
                
        except Exception as e:
            return {"success": False, "error": f"Video merging error: {str(e)}"}
    
    def step3_generate_enhanced_video(self, suspect_description, crime_type, voice_preference="female"):
        """Step 3: Generate AI script, voiceover, and final video"""
        print("Step 3: Creating AI script and voiceover...")
        
        merged_video = os.path.join(self.videos_folder, "runway_v1_merged.mp4")
        
        if not os.path.exists(merged_video):
            return {"success": False, "error": "Merged video not found for enhancement"}
        
        try:
            # Voice ID mapping
            voice_mapping = {
                "female": "21m00Tcm4TlvDq8ikWAM",
                "male": "2EiwWnXFnvU5JabPnv8n",
                "news_anchor_female": "EXAVITQu4vr4xnSDxMaL",
                "news_anchor_male": "VR6AewLTigWG4xSOukaG"
            }
            
            voice_id = voice_mapping.get(voice_preference, voice_mapping["female"])
            
            # Generate enhanced video
            enhancer = EnhancedVideoGenerator()
            result = enhancer.create_enhanced_video(
                suspect_description=suspect_description,
                crime_type=crime_type,
                voice_id=voice_id
            )
            
            return result
            
        except Exception as e:
            return {"success": False, "error": f"Enhanced video generation error: {str(e)}"}
    
    def run_complete_workflow(self, suspect_description, crime_type, voice_preference="female"):
        """Run the complete workflow from image to final enhanced video"""
        
        workflow_result = {
            "success": False,
            "steps_completed": [],
            "final_video_path": "",
            "script": "",
            "error": "",
            "workflow_steps": []
        }
        
        try:
            print("Starting Complete AI Video Generation Workflow")
            print("=" * 60)
            print(f"Suspect Description: {suspect_description}")
            print(f"Crime Type: {crime_type}")
            print(f"Voice Preference: {voice_preference}")
            print()
            
            # Step 1: Generate Runway video
            step1_result = self.step1_generate_runway_video()
            if not step1_result["success"]:
                workflow_result["error"] = f"Step 1 failed: {step1_result['error']}"
                return workflow_result
            
            workflow_result["steps_completed"].append("runway_generation")
            workflow_result["workflow_steps"].append("Generated realistic CCTV footage with Runway AI")
            print("Step 1 completed: Runway video generated")
            
            # Step 2: Merge videos
            step2_result = self.step2_merge_videos()
            if not step2_result["success"]:
                workflow_result["error"] = f"Step 2 failed: {step2_result['error']}"
                return workflow_result
            
            workflow_result["steps_completed"].append("video_merging")
            workflow_result["workflow_steps"].append("Merged Runway video with V1 seamlessly")
            print("Step 2 completed: Videos merged")
            
            # Step 3: Generate enhanced video with AI
            step3_result = self.step3_generate_enhanced_video(
                suspect_description, crime_type, voice_preference
            )
            if not step3_result["success"]:
                workflow_result["error"] = f"Step 3 failed: {step3_result['error']}"
                return workflow_result
            
            workflow_result["steps_completed"].append("ai_enhancement")
            workflow_result["workflow_steps"].extend([
                "Generated custom script with Cerebras Llama 3.3 70B",
                "Created professional voiceover with ElevenLabs",
                "Synchronized audio with video perfectly"
            ])
            
            # Success!
            workflow_result["success"] = True
            workflow_result["final_video_path"] = step3_result["final_video_path"]
            workflow_result["script"] = step3_result["script"]
            
            print("Step 3 completed: Enhanced video with AI voiceover")
            print()
            print("COMPLETE WORKFLOW FINISHED SUCCESSFULLY!")
            print(f"Final Video: {workflow_result['final_video_path']}")
            print(f"Generated Script: {workflow_result['script']}")
            
            return workflow_result
            
        except Exception as e:
            workflow_result["error"] = f"Workflow error: {str(e)}"
            print(f"Workflow failed: {e}")
            return workflow_result

def main():
    """Main function for API integration"""
    
    # Get parameters from environment variables (set by Node.js API)
    suspect_description = os.getenv('SUSPECT_DESCRIPTION')
    crime_type = os.getenv('CRIME_TYPE') 
    voice_preference = os.getenv('VOICE_PREFERENCE', 'female')
    
    # Fallback to test data if no environment variables
    if not suspect_description or not crime_type:
        print("No environment variables found, using test data...")
        suspect_description = "Male, approximately 25-30 years old, wearing a dark hoodie and jeans, carrying a red backpack"
        crime_type = "armed robbery at downtown bank"
        voice_preference = "news_anchor_female"
    
    try:
        workflow = CompleteWorkflow()
        result = workflow.run_complete_workflow(
            suspect_description=suspect_description,
            crime_type=crime_type,
            voice_preference=voice_preference
        )
        
        # Output JSON for API consumption
        print(json.dumps(result, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if result["success"] else 1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "message": f"Complete workflow failed: {str(e)}"
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
