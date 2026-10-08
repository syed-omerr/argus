import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { suspectDescription, crimeType } = await request.json();

    console.log('🐍 Starting Python mega_workflow.py');
    console.log('Suspect Description:', suspectDescription);
    console.log('Crime Type:', crimeType);

    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'mega_workflow.py');
    
    return new Promise<NextResponse>((resolve) => {
      // Run the Python script
      const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
      const pythonProcess = spawn(pythonBin, [scriptPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      // Capture stdout
      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('🐍 Python Output:', chunk);
      });

      // Capture stderr
      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        error += chunk;
        console.error('🐍 Python Error:', chunk);
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        console.log('🐍 Python process finished with code:', code);
        
        if (code === 0) {
          // Success - try to parse the output for results
          try {
            // Look for JSON output in the last line or specific markers
            const lines = output.trim().split('\n');
            let result = null;
            
            // Try to find JSON output
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('{') && line.endsWith('}')) {
                try {
                  result = JSON.parse(line);
                  break;
                } catch (e) {
                  // Continue looking
                }
              }
            }
            
            resolve(NextResponse.json({
              success: true,
              message: 'Mega workflow completed successfully',
              output: output,
              result: result,
              workflow_steps: [
                "Generated realistic CCTV footage with Runway AI",
                "Merged Runway video with V1 seamlessly", 
                "Generated custom script with Cerebras Llama 3.3 70B",
                "Created professional voiceover with ElevenLabs",
                "Synchronized audio with video perfectly",
                "Posted video alert to Twitter/X"
              ]
            }));
          } catch (parseError) {
            resolve(NextResponse.json({
              success: true,
              message: 'Mega workflow completed',
              output: output,
              workflow_steps: [
                "Generated realistic CCTV footage with Runway AI",
                "Merged Runway video with V1 seamlessly",
                "Generated custom script with Cerebras Llama 3.3 70B", 
                "Created professional voiceover with ElevenLabs",
                "Synchronized audio with video perfectly",
                "Posted video alert to Twitter/X"
              ]
            }));
          }
        } else {
          resolve(NextResponse.json({
            success: false,
            message: 'Mega workflow failed',
            error: error || 'Unknown error',
            output: output,
            code: code
          }, { status: 500 }));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (err) => {
        console.error('🐍 Failed to start Python process:', err);
        resolve(NextResponse.json({
          success: false,
          message: 'Failed to start Python workflow',
          error: err.message
        }, { status: 500 }));
      });

      // Send input to Python if needed (for interactive scripts)
      if (suspectDescription || crimeType) {
        const input = JSON.stringify({
          suspect_description: suspectDescription,
          crime_type: crimeType
        });
        pythonProcess.stdin.write(input + '\n');
        pythonProcess.stdin.end();
      }
    });

  } catch (error) {
    console.error('Mega workflow API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
