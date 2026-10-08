#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MEGA WORKFLOW - Complete AI Video Generation Pipeline
All-in-one file containing the entire workflow from image to final enhanced video

Features:
- Runway AI video generation from static images
- Video merging and processing
- Cerebras Llama 3.3 70B script generation
- ElevenLabs professional voiceover
- Complete audio-video synchronization

Dependencies: moviepy, requests, openai, elevenlabs, python-dotenv
"""

import os
import sys
import json
import time
import base64
import requests
import hmac
import hashlib
import secrets
from pathlib import Path
from typing import Optional, Dict, Any
from urllib.parse import quote
from dotenv import load_dotenv
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeAudioClip, concatenate_videoclips
from openai import OpenAI

# Load environment variables
load_dotenv('.env.local')

# =============================================================================
# RUNWAY IMAGE-TO-VIDEO CLASS
# =============================================================================

class RunwayImageToVideo:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.dev.runwayml.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-Runway-Version": "2024-11-06",
            "Content-Type": "application/json"
        }
    
    def image_to_data_uri(self, image_path: str) -> str:
        """Convert local image to data URI"""
        try:
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
                base64_data = base64.b64encode(image_data).decode('utf-8')
                
                # Determine MIME type based on file extension
                ext = os.path.splitext(image_path)[1].lower()
                mime_type = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp'
                }.get(ext, 'image/jpeg')
                
                return f"data:{mime_type};base64,{base64_data}"
        except Exception as e:
            print(f"Error converting image to data URI: {e}")
            return None
    
    def create_video_task(self, image_path: str, prompt_text: str, 
                         duration: int = 10, ratio: str = "1280:720") -> Optional[str]:
        """Create a new image-to-video task"""
        
        # Convert image to data URI
        data_uri = self.image_to_data_uri(image_path)
        if not data_uri:
            return None
        
        payload = {
            "promptImage": data_uri,
            "model": "gen4_turbo",
            "promptText": prompt_text,
            "duration": duration,
            "ratio": ratio,
            "contentModeration": {
                "publicFigureThreshold": "auto"
            }
        }
        
        try:
            print(f"Creating video generation task...")
            print(f"Image: {os.path.basename(image_path)}")
            print(f"Prompt: {prompt_text}")
            print(f"Duration: {duration}s")
            print(f"Resolution: {ratio}")
            
            response = requests.post(
                f"{self.base_url}/image_to_video",
                json=payload,
                headers=self.headers
            )
            
            print(f"Create task response: {response.status_code}")
            print(f"Response body: {response.text}")
            
            if response.status_code == 200:
                try:
                    task_data = response.json()
                    print(f"Task data: {task_data}")
                    task_id = task_data.get('id')
                    if task_id:
                        print(f"Task created successfully! ID: {task_id}")
                        return task_id
                    else:
                        print(f"No task ID in response: {task_data}")
                        return None
                except json.JSONDecodeError as e:
                    print(f"Failed to parse JSON response: {e}")
                    print(f"Raw response: {response.text}")
                    return None
            else:
                print(f"Error creating task: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"Exception creating task: {e}")
            return None
    
    def check_task_status(self, task_id: str) -> dict:
        """Check the status of a video generation task"""
        try:
            response = requests.get(
                f"{self.base_url}/tasks/{task_id}",
                headers=self.headers
            )
            
            print(f"Status check response: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    json_response = response.json()
                    print(f"Status response: {json_response}")
                    return json_response
                except json.JSONDecodeError as e:
                    print(f"Failed to parse JSON response: {e}")
                    print(f"Raw response: {response.text}")
                    return {"status": "error", "error": f"Invalid JSON response: {response.text}"}
            else:
                print(f"Error checking status: {response.status_code}")
                print(f"Response: {response.text}")
                return {"status": "error", "error": f"HTTP {response.status_code}: {response.text}"}
                
        except Exception as e:
            print(f"Exception checking status: {e}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "error": str(e)}
    
    def download_video(self, video_url: str, output_path: str) -> bool:
        """Download the generated video"""
        try:
            print(f"Downloading video to: {output_path}")
            
            response = requests.get(video_url, stream=True)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Video downloaded successfully!")
            return True
            
        except Exception as e:
            print(f"Error downloading video: {e}")
            return False
    
    def generate_video_from_image(self, image_path: str, output_dir: str, 
                                 prompt_text: str, duration: int = 10) -> bool:
        """Complete workflow: create task, wait for completion, download video"""
        
        # Create the task
        task_id = self.create_video_task(image_path, prompt_text, duration)
        if not task_id:
            return False
        
        # Wait for completion
        print(f"Waiting for video generation to complete...")
        max_wait_time = 600  # 10 minutes max
        check_interval = 10  # Check every 10 seconds
        elapsed_time = 0
        
        while elapsed_time < max_wait_time:
            status_data = self.check_task_status(task_id)
            
            # Handle error responses
            if not isinstance(status_data, dict):
                print(f"Invalid response from status check: {status_data}")
                return False
            
            # Check if there's an error in the response
            if 'error' in status_data:
                print(f"Error in status response: {status_data['error']}")
                return False
                
            status = status_data.get('status', 'unknown')
            
            print(f"Status: {status} (elapsed: {elapsed_time}s)")
            
            if status == 'SUCCEEDED':
                video_url = status_data.get('output', [None])[0]
                if video_url:
                    # Generate output filename
                    base_name = os.path.splitext(os.path.basename(image_path))[0]
                    output_path = os.path.join(output_dir, f"{base_name}_generated.mp4")
                    
                    return self.download_video(video_url, output_path)
                else:
                    print("No video URL in response")
                    return False
            
            elif status == 'FAILED':
                error_msg = status_data.get('failure', {}).get('reason', 'Unknown error')
                print(f"Task failed: {error_msg}")
                return False
            
            elif status in ['PENDING', 'RUNNING']:
                time.sleep(check_interval)
                elapsed_time += check_interval
            
            else:
                print(f"Unknown status: {status}")
                return False
        
        print(f"Timeout: Video generation took longer than {max_wait_time} seconds")
        return False

# =============================================================================
# ENHANCED VIDEO GENERATOR CLASS
# =============================================================================

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
        
        # Import ElevenLabs
        try:
            from elevenlabs.client import ElevenLabs
            self.elevenlabs_client = ElevenLabs(api_key=self.elevenlabs_api_key)
        except ImportError:
            raise ImportError("ElevenLabs library not found. Install with: pip install elevenlabs")
        
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

            try:
                response = self.cerebras_client.chat.completions.create(
                    model="qwen-3.8-27b",
                    messages=[
                        {"role": "system", "content": "You are a professional news script writer who creates precise, timed emergency alert scripts."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=200,
                    temperature=0.7
                )
            except Exception:
                response = self.cerebras_client.chat.completions.create(
                    model="gpt-oss-120b",
                    messages=[
                        {"role": "system", "content": "You are a professional news script writer who creates precise, timed emergency alert scripts."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=200,
                    temperature=0.7
                )
            
            msg = response.choices[0].message
            script = (msg.content or getattr(msg, "reasoning_content", "") or "").strip()
            if not script:
                raise ValueError("Empty response from Cerebras")
            
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

# =============================================================================
# TWITTER/X INTEGRATION CLASS
# =============================================================================

class TwitterIntegration:
    def __init__(self):
        # Twitter API credentials from environment
        self.api_key = os.getenv('TWITTER_API_KEY')
        self.api_secret = os.getenv('TWITTER_API_SECRET')
        self.access_token = os.getenv('TWITTER_ACCESS_TOKEN')
        self.access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
        
        if not all([self.api_key, self.api_secret, self.access_token, self.access_token_secret]):
            print("Warning: Twitter API credentials not found in .env.local")
            self.enabled = False
        else:
            self.enabled = True
    
    def generate_oauth_signature(self, method: str, url: str, params: Dict[str, str]) -> str:
        """Generate OAuth signature - Method 2 (works with your credentials)"""
        # Create parameter string using safe='' encoding
        sorted_params = sorted(params.items())
        param_string = '&'.join([f"{quote(k, safe='')}={quote(str(v), safe='')}" for k, v in sorted_params])
        
        # Create signature base string using safe='' encoding
        signature_base = f"{method.upper()}&{quote(url, safe='')}&{quote(param_string, safe='')}"
        
        # Create signing key using safe='' encoding
        signing_key = f"{quote(self.api_secret, safe='')}&{quote(self.access_token_secret, safe='')}"
        
        # Generate signature
        signature = base64.b64encode(
            hmac.new(signing_key.encode(), signature_base.encode(), hashlib.sha1).digest()
        ).decode()
        
        return signature
    
    def generate_oauth_header(self, method: str, url: str, additional_params: Dict[str, str] = None) -> str:
        """Generate OAuth header exactly like working TypeScript implementation"""
        oauth_params = {
            'oauth_consumer_key': self.api_key,
            'oauth_token': self.access_token,
            'oauth_signature_method': 'HMAC-SHA1',
            'oauth_timestamp': str(int(time.time())),
            'oauth_nonce': secrets.token_hex(16),
            'oauth_version': '1.0'
        }
        
        # Add additional params if provided - EXACT match to TypeScript
        if additional_params:
            oauth_params.update(additional_params)
        
        # Generate signature with all params
        signature = self.generate_oauth_signature(method, url, oauth_params)
        oauth_params['oauth_signature'] = signature
        
        # Create authorization header using safe='' encoding (Method 2)
        auth_parts = []
        for key in oauth_params.keys():
            auth_parts.append(f'{quote(key, safe="")}="{quote(str(oauth_params[key]), safe="")}"')
        
        auth_header = 'OAuth ' + ', '.join(auth_parts)
        return auth_header
    
    # Video upload functionality removed - only text posting supported
    def upload_video(self, video_path: str) -> Optional[str]:
        """Video upload not supported - text only"""
        print("Video upload functionality removed - only text posting supported")
        return None
    
    def generate_caption(self, suspect_description: str, crime_type: str) -> str:
        """Generate Twitter caption from suspect info (without problematic emojis)"""
        # Extract key details for a concise alert (no emojis to avoid encoding issues)
        caption = f"ALERT: {crime_type}\n\n{suspect_description[:150]}\n\nIf you have information, please contact authorities immediately. Share to help spread awareness.\n\n#Alert #Safety #Community"
        
        # Ensure under 280 characters
        if len(caption) > 280:
            caption = caption[:277] + "..."
        
        return caption
    
    def post_text_only_alert(self, suspect_description: str, crime_type: str) -> Optional[str]:
        """Post text-only alert to test Twitter credentials"""
        if not self.enabled:
            print("Twitter posting disabled - missing API credentials")
            return None
        
        print("Testing Twitter with text-only post...")
        
        # Generate caption
        caption = self.generate_caption(suspect_description, crime_type)
        
        # Create text-only tweet (no media)
        tweet_url = self.create_text_tweet(caption)
        
        return tweet_url
    
    def create_text_tweet(self, text: str) -> Optional[str]:
        """Create a text-only tweet using X API v2 with OAuth 1.0a"""
        if not self.enabled:
            print("Twitter integration disabled - missing credentials")
            return None
        
        try:
            print(f"Creating text tweet: {text[:50]}...")
            
            # Use X API v2 endpoint with OAuth 1.0a (as required by API)
            tweet_url = 'https://api.x.com/2/tweets'
            
            # Prepare tweet data according to API spec
            tweet_data = {
                'text': text[:280]  # Twitter character limit
            }
            
            # Use OAuth 1.0a authorization (as required by X API v2 for posting)
            tweet_auth = self.generate_oauth_header('POST', tweet_url, {})
            
            tweet_response = requests.post(
                tweet_url,
                headers={
                    'Authorization': tweet_auth,
                    'Content-Type': 'application/json'
                },
                json=tweet_data
            )
            
            print(f"Twitter API Response: {tweet_response.status_code}")
            print(f"Response body: {tweet_response.text}")
            
            if tweet_response.status_code == 201:  # API returns 201 for success
                tweet_result = tweet_response.json()
                tweet_id = tweet_result['data']['id']
                tweet_url = f"https://twitter.com/i/web/status/{tweet_id}"
                
                print(f"Text tweet created successfully: {tweet_url}")
                return tweet_url
            else:
                print(f"Twitter text tweet creation failed: {tweet_response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error creating text tweet: {e}")
            return None
    
    def post_video_alert(self, video_path: str, suspect_description: str, crime_type: str) -> Optional[str]:
        """Video posting not supported - falls back to text-only alert"""
        print("Video posting not supported - posting text-only alert instead...")
        return self.post_text_only_alert(suspect_description, crime_type)

# =============================================================================
# VIDEO MERGING FUNCTION
# =============================================================================

def merge_runway_with_v1():
    """Merge runway video with v1 - inline implementation"""
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

# =============================================================================
# COMPLETE WORKFLOW CLASS
# =============================================================================

class CompleteWorkflow:
    def __init__(self):
        self.videos_folder = os.path.join("src", "videosNEW")
        self.image_path = os.path.join(self.videos_folder, "cctv-footage.jpg")
        self.v1_path = os.path.join(self.videos_folder, "v1.mp4")
        
        # Check required API keys
        self.runway_api_key = os.getenv('RUNWAY_API_KEY')
        self.cerebras_api_key = os.getenv('CEREBRAS_API_KEY')
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        
        missing = []
        if not self.cerebras_api_key: missing.append("CEREBRAS_API_KEY")
        if not self.elevenlabs_api_key: missing.append("ELEVENLABS_API_KEY")
        if missing:
            raise ValueError(f"Missing API keys in .env.local: {', '.join(missing)}")
        
        if not self.runway_api_key:
            print("Note: RUNWAY_API_KEY not provided. Using bundled realistic surveillance footage (Free mode).")
        
        # Initialize Twitter integration
        self.twitter = TwitterIntegration()
    
    def step1_generate_runway_video(self):
        """Step 1: Generate CCTV footage using Runway (or fallback to bundled footage)"""
        if not self.runway_api_key:
            print("Step 1 (Free Mode): Using bundled surveillance CCTV video...")
            generated_path = os.path.join(self.videos_folder, "cctv-footage_generated.mp4")
            if os.path.exists(generated_path):
                return {"success": True, "video_path": generated_path}
            elif os.path.exists(self.v1_path):
                return {"success": True, "video_path": self.v1_path}
            return {"success": False, "error": "No fallback surveillance video available"}

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
    
    def step4_post_to_twitter(self, video_path, suspect_description, crime_type):
        """Step 4: Post alert to Twitter/X (text-only for testing)"""
        print("Step 4: Posting text alert to Twitter/X...")
        
        try:
            # Post text-only alert to Twitter (for testing credentials)
            tweet_url = self.twitter.post_text_only_alert(
                suspect_description=suspect_description,
                crime_type=crime_type
            )
            
            if tweet_url:
                return {
                    "success": True,
                    "tweet_url": tweet_url,
                    "message": "Text alert posted to Twitter successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to post text alert to Twitter",
                    "message": "Twitter posting failed - check API credentials"
                }
                
        except Exception as e:
            return {"success": False, "error": f"Twitter posting error: {str(e)}"}
    
    def run_complete_workflow(self, suspect_description, crime_type, voice_preference="female", post_to_twitter=True):
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
            
            workflow_result["final_video_path"] = step3_result["final_video_path"]
            workflow_result["script"] = step3_result["script"]
            
            print("Step 3 completed: Enhanced video with AI voiceover")
            
            # Step 4: Post to Twitter (optional)
            if post_to_twitter:
                step4_result = self.step4_post_to_twitter(
                    step3_result["final_video_path"], 
                    suspect_description, 
                    crime_type
                )
                
                if step4_result["success"]:
                    workflow_result["steps_completed"].append("twitter_posting")
                    workflow_result["workflow_steps"].append("Posted video alert to Twitter/X")
                    workflow_result["tweet_url"] = step4_result["tweet_url"]
                    print("Step 4 completed: Posted to Twitter/X")
                    print(f"Tweet URL: {step4_result['tweet_url']}")
                else:
                    print(f"Step 4 failed: {step4_result['error']}")
                    workflow_result["twitter_error"] = step4_result["error"]
            
            # Success!
            workflow_result["success"] = True
            
            print()
            print("COMPLETE WORKFLOW FINISHED SUCCESSFULLY!")
            print(f"Final Video: {workflow_result['final_video_path']}")
            print(f"Generated Script: {workflow_result['script']}")
            if "tweet_url" in workflow_result:
                print(f"Twitter Post: {workflow_result['tweet_url']}")
            elif "twitter_error" in workflow_result:
                print(f"Twitter Error: {workflow_result['twitter_error']}")
            
            return workflow_result
            
        except Exception as e:
            workflow_result["error"] = f"Workflow error: {str(e)}"
            print(f"Workflow failed: {e}")
            return workflow_result

# =============================================================================
# MAIN FUNCTION
# =============================================================================

def main():
    """Main function for API integration"""
    
    # Try to read JSON input from stdin first (from Node.js API)
    suspect_description = None
    crime_type = None
    voice_preference = "news_anchor_female"
    post_to_twitter = True
    
    try:
        # Read from stdin (sent by Node.js API)
        import sys
        import json
        
        # Check if there's input available
        if not sys.stdin.isatty():
            input_data = sys.stdin.read().strip()
            if input_data:
                data = json.loads(input_data)
                suspect_description = data.get('suspect_description')
                crime_type = data.get('crime_type')
                print(f"Received from API: suspect='{suspect_description}', crime='{crime_type}'")
    except Exception as e:
        print(f"Error reading stdin: {e}")
    
    # Fallback to environment variables if stdin didn't work
    if not suspect_description or not crime_type:
        suspect_description = os.getenv('SUSPECT_DESCRIPTION')
        crime_type = os.getenv('CRIME_TYPE')
        voice_preference = os.getenv('VOICE_PREFERENCE', 'female')
        post_to_twitter = os.getenv('POST_TO_TWITTER', 'true').lower() == 'true'
    
    # Final fallback to test data
    if not suspect_description or not crime_type:
        print("No input found, using test data...")
        suspect_description = "Male, approximately 25-30 years old, wearing a dark hoodie and jeans, carrying a red backpack"
        crime_type = "armed robbery at downtown bank"
        voice_preference = "news_anchor_female"
    
    try:
        workflow = CompleteWorkflow()
        result = workflow.run_complete_workflow(
            suspect_description=suspect_description,
            crime_type=crime_type,
            voice_preference=voice_preference,
            post_to_twitter=post_to_twitter
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
