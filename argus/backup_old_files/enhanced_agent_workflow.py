#!/usr/bin/env python3
"""
Enhanced Agent Workflow Integration
Integrates the enhanced video generator with the existing agent workflow
"""

import os
import sys
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from enhanced_video_generator import EnhancedVideoGenerator

class EnhancedAgentWorkflow:
    def __init__(self):
        self.video_generator = EnhancedVideoGenerator()
        
    def process_enhanced_workflow(self, suspect_description: str, crime_type: str, 
                                voice_preference: str = "female") -> dict:
        """
        Enhanced workflow that integrates with the existing agent system
        """
        
        print("Starting Enhanced Agent Workflow")
        print("=" * 50)
        print(f"Suspect Description: {suspect_description}")
        print(f"Crime Type: {crime_type}")
        print(f"Voice Preference: {voice_preference}")
        print()
        
        # Voice ID mapping for ElevenLabs
        voice_mapping = {
            "female": "21m00Tcm4TlvDq8ikWAM",  # Rachel - Professional female
            "male": "2EiwWnXFnvU5JabPnv8n",    # Adam - Professional male
            "news_anchor_female": "EXAVITQu4vr4xnSDxMaL",  # Bella - News anchor style
            "news_anchor_male": "VR6AewLTigWG4xSOukaG"     # Antoni - News anchor style
        }
        
        voice_id = voice_mapping.get(voice_preference, voice_mapping["female"])
        
        try:
            # Step 1: Create enhanced video with voiceover
            result = self.video_generator.create_enhanced_video(
                suspect_description=suspect_description,
                crime_type=crime_type,
                voice_id=voice_id
            )
            
            if result["success"]:
                print(f"Enhanced video workflow completed successfully!")
                
                # Return comprehensive result
                return {
                    "success": True,
                    "script": result["script"],
                    "audio_path": result["audio_path"],
                    "final_video_path": result["final_video_path"],
                    "message": "Enhanced video with AI voiceover created successfully!",
                    "workflow_steps": [
                        "Generated script with Cerebras Llama 3.3 70B",
                        "Created voiceover with ElevenLabs",
                        "Synced audio with Runway+V1 merged video",
                        "Final enhanced video ready"
                    ]
                }
            else:
                return {
                    "success": False,
                    "error": result["error"],
                    "message": f"Enhanced workflow failed: {result['error']}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Enhanced workflow error: {str(e)}"
            }

def main():
    """Main function that can be called from API or command line"""
    
    # Get data from environment variables (set by Node.js API) or use test data
    suspect_description = os.getenv('SUSPECT_DESCRIPTION')
    crime_type = os.getenv('CRIME_TYPE')
    voice_preference = os.getenv('VOICE_PREFERENCE', 'female')
    
    # If no environment variables, use test data
    if not suspect_description or not crime_type:
        print("No environment variables found, using test data...")
        suspect_description = "Male, approximately 25-30 years old, wearing a dark hoodie and jeans, carrying a red backpack"
        crime_type = "armed robbery at downtown bank"
        voice_preference = "news_anchor_female"
    
    try:
        workflow = EnhancedAgentWorkflow()
        result = workflow.process_enhanced_workflow(
            suspect_description=suspect_description,
            crime_type=crime_type,
            voice_preference=voice_preference
        )
        
        # Output JSON result for API consumption
        print(json.dumps(result, indent=2))
        
        # Also output human-readable format
        print("\n" + "=" * 50, file=sys.stderr)
        print("WORKFLOW RESULT:", file=sys.stderr)
        print("=" * 50, file=sys.stderr)
        
        if result["success"]:
            print("SUCCESS!", file=sys.stderr)
            print(f"Message: {result['message']}", file=sys.stderr)
            print(f"Script: {result['script']}", file=sys.stderr)
            print(f"Final Video: {result['final_video_path']}", file=sys.stderr)
            print("\nWorkflow Steps:", file=sys.stderr)
            for step in result.get("workflow_steps", []):
                print(f"  {step}", file=sys.stderr)
        else:
            print("FAILED!", file=sys.stderr)
            print(f"Error: {result['error']}", file=sys.stderr)
            print(f"Message: {result['message']}", file=sys.stderr)
            
        # Exit with appropriate code
        sys.exit(0 if result["success"] else 1)
            
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "message": f"Workflow failed: {str(e)}"
        }
        print(json.dumps(error_result, indent=2))
        print(f"Test failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
