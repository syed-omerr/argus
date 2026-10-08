#!/usr/bin/env python3
"""
Runway Image to Video Generator
Converts an image to video using Runway's gen4_turbo model
"""

import os
import requests
import time
import base64
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

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
            
            if response.status_code == 200:
                task_data = response.json()
                task_id = task_data.get('id')
                if task_id:
                    print(f"Task created successfully! ID: {task_id}")
                    return task_id
                else:
                    print(f"No task ID in response: {task_data}")
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
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error checking status: {response.status_code}")
                print(f"Response: {response.text}")
                return {"status": "error", "error": f"HTTP {response.status_code}: {response.text}"}
                
        except Exception as e:
            print(f"Exception checking status: {e}")
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

def main():
    """Main function to generate video from CCTV footage"""
    
    # Configuration
    image_path = os.path.join("src", "videosNEW", "cctv-footage.jpg")
    output_dir = os.path.join("src", "videosNEW")
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return
    
    # Get API key from environment variables
    api_key = os.getenv('RUNWAY_API_KEY')
    if not api_key:
        print("RUNWAY_API_KEY not found in .env.local file!")
        print("Please add: RUNWAY_API_KEY=your_api_key_here to your .env.local file")
        return
    
    # Prompt for realistic walking scene
    prompt_text = """People walking naturally and realistically through the scene, 
    smooth camera movement, realistic lighting and shadows, natural human movement, 
    cinematic quality, surveillance camera perspective"""
    
    print(f"\nRunway Image-to-Video Generator")
    print(f"=" * 40)
    print(f"Input image: {image_path}")
    print(f"Output directory: {output_dir}")
    print(f"Prompt: {prompt_text}")
    
    # Create generator instance
    generator = RunwayImageToVideo(api_key)
    
    # Generate video
    success = generator.generate_video_from_image(
        image_path=image_path,
        output_dir=output_dir,
        prompt_text=prompt_text,
        duration=10  # 10 seconds
    )
    
    if success:
        print(f"\nVideo generation completed successfully!")
        print(f"Check the {output_dir} folder for your generated video.")
    else:
        print(f"\nVideo generation failed.")

if __name__ == "__main__":
    main()
