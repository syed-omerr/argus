#!/usr/bin/env python3
"""
Enhanced Video Generator with AI Voiceover
Integrates Cerebras (Llama 3.3 70B) + ElevenLabs + Video Processing
"""

import os
import json
import time
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import requests
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeAudioClip
from elevenlabs.client import ElevenLabs
from openai import OpenAI

# Load environment variables
load_dotenv('.env.local')

class EnhancedVideoGenerator:
    def __init__(self):
        # API Keys from environment
        self.cerebras_api_key = os.getenv('CEREBRAS_API_KEY')
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        
        if not self.cerebras_api_key:
            raise ValueError("CEREBRAS_API_KEY not found in .env.local")
        if not self.elevenlabs_api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in .env.local")
        
        # Initialize clients
        self.cerebras_client = OpenAI(
            api_key=self.cerebras_api_key,
            base_url="https://api.cerebras.ai/v1"
        )
        
        # Initialize ElevenLabs client
        self.elevenlabs_client = ElevenLabs(api_key=self.elevenlabs_api_key)
        
        # Video paths
        self.videos_folder = os.path.join("src", "videosNEW")
        self.merged_video_path = os.path.join(self.videos_folder, "runway_v1_merged.mp4")
    
    def get_video_duration(self, video_path: str) -> float:
        """Get the duration of a video file in seconds"""
        try:
            with VideoFileClip(video_path) as clip:
                return clip.duration
        except Exception as e:
            print(f"Error getting video duration: {e}")
            return 10.0  # Default fallback
    
    def generate_script_with_cerebras(self, suspect_description: str, crime_type: str, 
                                    target_duration: float = 10.0) -> str:
        """Generate a video script using Cerebras Llama 3.3 70B"""
        try:
            print(f"Generating {target_duration}s script with Cerebras Llama 3.3 70B...")
            
            # Create a detailed prompt for the exact duration
            words_per_second = 2.5  # Average speaking rate
            target_words = int(target_duration * words_per_second)
            
            prompt = f"""You are a professional news reporter creating a {target_duration}-second emergency alert script.

REQUIREMENTS:
- Exactly {target_words} words (approximately {target_duration} seconds when spoken)
- Professional, urgent tone
- Include suspect description and crime details
- Clear call to action
- No extra commentary or stage directions

DETAILS:
- Crime Type: {crime_type}
- Suspect Description: {suspect_description}

Generate ONLY the script text that will be spoken, nothing else. Make it exactly {target_words} words for {target_duration} seconds of speech."""

            response = self.cerebras_client.chat.completions.create(
                model="llama-3.3-70b",
                messages=[
                    {"role": "system", "content": "You are a professional news script writer who creates precise, timed emergency alert scripts."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            script = response.choices[0].message.content.strip()
            
            print(f"Generated script ({len(script.split())} words):")
            print(f"Script: {script}")
            
            return script
            
        except Exception as e:
            print(f"Error generating script with Cerebras: {e}")
            # Fallback script
            fallback = f"Emergency alert: We are searching for a suspect involved in {crime_type}. The individual is described as {suspect_description}. If you see this person, please contact authorities immediately. Do not approach. Your safety is our priority."
            print(f"Using fallback script: {fallback}")
            return fallback
    
    def generate_voiceover_with_elevenlabs(self, script: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> str:
        """Generate voiceover using ElevenLabs"""
        try:
            print(f"Generating voiceover with ElevenLabs...")
            
            # Generate audio using the new client API
            audio_generator = self.elevenlabs_client.text_to_speech.convert(
                text=script,
                voice_id=voice_id,
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128"
            )
            
            # Save audio file
            audio_path = os.path.join(self.videos_folder, "generated_voiceover.mp3")
            
            # Convert generator to bytes and save
            audio_bytes = b"".join(audio_generator)
            with open(audio_path, "wb") as f:
                f.write(audio_bytes)
            
            print(f"Voiceover saved to: {audio_path}")
            return audio_path
            
        except Exception as e:
            print(f"Error generating voiceover: {e}")
            return None
    
    def sync_audio_with_video(self, video_path: str, audio_path: str, output_path: str) -> bool:
        """Sync the generated voiceover with the video"""
        try:
            print(f"Syncing audio with video...")
            
            # Load video and audio
            video_clip = VideoFileClip(video_path)
            audio_clip = AudioFileClip(audio_path)
            
            print(f"Video duration: {video_clip.duration:.2f}s")
            print(f"Audio duration: {audio_clip.duration:.2f}s")
            
            # Handle audio duration mismatch
            if audio_clip.duration > video_clip.duration:
                # Trim audio if it's longer
                audio_clip = audio_clip.subclip(0, video_clip.duration)
                print(f"Trimmed audio to {video_clip.duration:.2f}s")
            elif audio_clip.duration < video_clip.duration:
                # Extend audio with silence if it's shorter
                from moviepy.audio.AudioClip import AudioClip
                silence_duration = video_clip.duration - audio_clip.duration
                silence = AudioClip(lambda t: [0, 0], duration=silence_duration, fps=audio_clip.fps)
                audio_clip = CompositeAudioClip([audio_clip, silence.set_start(audio_clip.duration)])
                print(f"Extended audio with {silence_duration:.2f}s of silence")
            
            # Ensure audio clip duration matches video exactly
            audio_clip = audio_clip.set_duration(video_clip.duration)
            
            # Keep original video audio at very low volume and add voiceover
            if video_clip.audio:
                # Lower the original video audio significantly and mix with voiceover
                original_audio = video_clip.audio.volumex(0.05)  # 5% of original volume
                final_audio = CompositeAudioClip([original_audio, audio_clip.volumex(0.95)])
            else:
                final_audio = audio_clip
            
            # Create final video with new audio
            final_video = video_clip.set_audio(final_audio)
            
            # Write the final video with better settings to preserve quality
            print(f"Saving final video to: {output_path}")
            final_video.write_videofile(
                output_path,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile='temp-audio.m4a',
                remove_temp=True,
                verbose=False,
                logger=None,
                fps=video_clip.fps,  # Preserve original fps
                preset='medium'  # Better quality preset
            )
            
            # Clean up
            video_clip.close()
            audio_clip.close()
            final_video.close()
            
            print(f"Successfully created video with voiceover!")
            return True
            
        except Exception as e:
            print(f"Error syncing audio with video: {e}")
            return False
    
    def create_enhanced_video(self, suspect_description: str, crime_type: str, 
                            voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> Dict[str, Any]:
        """Complete workflow: Generate script, voiceover, and sync with video"""
        
        result = {
            "success": False,
            "script": "",
            "audio_path": "",
            "final_video_path": "",
            "error": ""
        }
        
        try:
            # Check if merged video exists
            if not os.path.exists(self.merged_video_path):
                result["error"] = f"Merged video not found: {self.merged_video_path}"
                return result
            
            # Get video duration for script timing
            video_duration = self.get_video_duration(self.merged_video_path)
            print(f"Target video duration: {video_duration:.2f}s")
            
            # Step 1: Generate script with Cerebras
            script = self.generate_script_with_cerebras(
                suspect_description, 
                crime_type, 
                video_duration
            )
            result["script"] = script
            
            # Step 2: Generate voiceover with ElevenLabs
            audio_path = self.generate_voiceover_with_elevenlabs(script, voice_id)
            if not audio_path:
                result["error"] = "Failed to generate voiceover"
                return result
            result["audio_path"] = audio_path
            
            # Step 3: Sync audio with video - create new enhanced video
            final_video_path = os.path.join(self.videos_folder, "final_enhanced_video.mp4")
            success = self.sync_audio_with_video(
                self.merged_video_path, 
                audio_path, 
                final_video_path
            )
            
            if success:
                result["success"] = True
                result["final_video_path"] = final_video_path
                print(f"\nEnhanced video created successfully!")
                print(f"Location: {final_video_path}")
            else:
                result["error"] = "Failed to sync audio with video"
            
            return result
            
        except Exception as e:
            result["error"] = str(e)
            print(f"Error in enhanced video creation: {e}")
            return result

def main():
    """Test the enhanced video generator"""
    try:
        generator = EnhancedVideoGenerator()
        
        # Test parameters
        suspect_description = "Male, approximately 30 years old, wearing dark clothing and a red cap"
        crime_type = "theft from local convenience store"
        
        print("🚀 Enhanced Video Generator Test")
        print("=" * 50)
        print(f"Suspect: {suspect_description}")
        print(f"Crime: {crime_type}")
        print()
        
        # Generate enhanced video
        result = generator.create_enhanced_video(suspect_description, crime_type)
        
        if result["success"]:
            print(f"\n✅ SUCCESS!")
            print(f"Script: {result['script']}")
            print(f"Final video: {result['final_video_path']}")
        else:
            print(f"\n❌ FAILED: {result['error']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
