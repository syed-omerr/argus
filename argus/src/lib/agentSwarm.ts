import OpenAI from 'openai';
import { Cerebras } from '@cerebras/cerebras_cloud_sdk';
import ffmpeg from 'ffmpeg-static';
import { execSync } from 'child_process';
// import sharp from 'sharp'; // Removed unused import
import { spawn } from 'child_process';
import { promises as fs, existsSync } from 'fs';
import path from 'path';
import os from 'os';

// Types
export interface DetectionResult {
  videoFile: File;
  detected: boolean;
  matchingFrames: string[]; // Base64 encoded images
  confidence: number;
  videoSnippet?: string; // Base64 encoded video snippet
}

export interface AgentTask {
  id: string;
  videoFile: File;
  suspectQuery: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: DetectionResult;
}

export class AgentSwarm {
  private openai: OpenAI;
  private cerebras: Cerebras;
  private agents: Map<string, AgentTask> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.cerebras = new Cerebras({
      apiKey: process.env.CEREBRAS_API_KEY,
    });
  }

  // Create swarm of agents based on video files
  async createSwarm(videoFiles: File[], suspectNotes: string): Promise<string[]> {
    const agentIds: string[] = [];
    
    for (let i = 0; i < videoFiles.length; i++) {
      const agentId = `agent-${i + 1}-${Date.now()}`;
      const task: AgentTask = {
        id: agentId,
        videoFile: videoFiles[i],
        suspectQuery: suspectNotes.trim() 
          ? `Can you see ${suspectNotes.trim()} in this image? Look carefully for any person matching this description.`
          : `Can you see any person or suspicious activity in this image? Look carefully for any individuals.`,
        status: 'pending'
      };
      
      this.agents.set(agentId, task);
      agentIds.push(agentId);
    }
    
    return agentIds;
  }

  // Execute all agents in parallel
  async executeSwarm(): Promise<DetectionResult[]> {
    const tasks = Array.from(this.agents.values());
    const results = await Promise.all(
      tasks.map(task => this.executeAgent(task.id))
    );
    
    return results.filter(result => result !== null) as DetectionResult[];
  }

  // Execute individual agent
  async executeAgent(agentId: string): Promise<DetectionResult | null> {
    const task = this.agents.get(agentId);
    if (!task) return null;

    try {
      // Add small delay to prevent timestamp collisions
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      task.status = 'processing';
      this.agents.set(agentId, task);

      // Extract frames from video
      const frames = await this.extractVideoFrames(task.videoFile);
      
      // Analyze each frame with Cerebras vision model
      const detectionResults = await this.analyzeFrames(frames, task.suspectQuery);
      
      // Filter matching frames
      const matchingFrames = detectionResults
        .filter(result => result.detected)
        .map(result => result.frame);

      const detected = matchingFrames.length > 0;
      let videoSnippet: string | undefined;

      // If matches found, create video snippet
      if (detected) {
        videoSnippet = await this.createVideoSnippet(task.videoFile, detectionResults);
      }

      const result: DetectionResult = {
        videoFile: task.videoFile,
        detected,
        matchingFrames,
        confidence: detected ? Math.max(...detectionResults.map(r => r.confidence)) : 0,
        videoSnippet
      };

      task.result = result;
      task.status = 'completed';
      this.agents.set(task.id, task);

      return result;
    } catch (error) {
      console.error(`Agent ${task.id} failed:`, error);
      task.status = 'failed';
      this.agents.set(task.id, task);
      return null;
    }
  }

  // Extract frames from video file
  private async extractVideoFrames(videoFile: File): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert File to buffer
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const originalVideoPath = path.join(os.tmpdir(), `original-${uniqueId}.${videoFile.name.split('.').pop()}`);
        const tempFramesDir = path.join(os.tmpdir(), `frames-${uniqueId}`);
        
        // Write original video to temp file
        await fs.writeFile(originalVideoPath, buffer);
        await fs.mkdir(tempFramesDir, { recursive: true });

        // Skip conversion - use uploaded file directly
        console.log('Using uploaded video file directly (no conversion)');
        const videoToProcess = originalVideoPath;

        // Extract frames using ffmpeg (1 frame per 5 seconds)
        let ffmpegPath = ffmpeg;
        
        // Fix invalid ffmpeg-static paths (/ROOT/ or missing)
        if (ffmpegPath && (ffmpegPath.includes('/ROOT/') || ffmpegPath.includes('\\ROOT\\') || !existsSync(ffmpegPath))) {
          const localStatic = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
          if (existsSync(localStatic)) {
            ffmpegPath = localStatic;
          } else {
            ffmpegPath = null;
          }
        }
        
        if (!ffmpegPath || !existsSync(ffmpegPath)) {
          const imageioMacFfmpeg = '/Library/Frameworks/Python.framework/Versions/3.13/lib/python3.13/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1';
          if (existsSync(imageioMacFfmpeg)) {
            ffmpegPath = imageioMacFfmpeg;
          } else if (process.platform === 'win32') {
            const commonPaths = [
              'ffmpeg.exe',
              'C:\\ffmpeg\\bin\\ffmpeg.exe',
              'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
              path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-7.1-essentials_build', 'bin', 'ffmpeg.exe')
            ];
            ffmpegPath = commonPaths.find((p) => existsSync(p)) || 'ffmpeg.exe';
          } else {
            ffmpegPath = 'ffmpeg';
          }
        }
        
        console.log('Using FFmpeg path:', ffmpegPath);
        console.log('Processing video:', videoFile.name, 'Size:', videoFile.size, 'Type:', videoFile.type);
        
        // Use more compatible FFmpeg parameters - extract 1 frame per second
        const ffmpegArgs = [
          '-i', videoToProcess,
          '-vf', 'fps=1,scale=640:480', // 1 frame per second, smaller resolution
          '-q:v', '8', // Lower quality for maximum compatibility
          '-f', 'image2', // Force image format
          '-pix_fmt', 'yuvj420p', // Compatible pixel format
          '-y', // Overwrite output files
          path.join(tempFramesDir, 'frame_%04d.jpg')
        ];

        console.log('FFmpeg command:', ffmpegPath, ffmpegArgs.join(' '));
        
        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, {
          stdio: ['pipe', 'pipe', 'pipe'] // Capture all output
        });

        // Log FFmpeg output for debugging
        ffmpegProcess.stdout.on('data', (data) => {
          console.log('FFmpeg stdout:', data.toString());
        });

        ffmpegProcess.stderr.on('data', (data) => {
          console.log('FFmpeg stderr:', data.toString());
        });

        ffmpegProcess.on('close', async (code) => {
          if (code === 0) {
            try {
              // Read extracted frames
              const frameFiles = await fs.readdir(tempFramesDir);
              const frames: string[] = [];

              for (const frameFile of frameFiles.sort()) {
                const framePath = path.join(tempFramesDir, frameFile);
                const frameBuffer = await fs.readFile(framePath);
                const base64Frame = frameBuffer.toString('base64');
                
                // Log frame size for debugging
                console.log(`Frame ${frameFile} base64 length: ${base64Frame.length}`);
                
                frames.push(base64Frame);
              }

              // Cleanup
              try {
                await fs.unlink(originalVideoPath);
              } catch (unlinkError) {
                // File might already be deleted by another process
                console.log('Video file already cleaned up:', originalVideoPath);
              }
              await fs.rm(tempFramesDir, { recursive: true });

              resolve(frames);
            } catch (error) {
              reject(error);
            }
          } else {
            console.error(`FFmpeg failed with code ${code}. This usually indicates:`);
            console.error('- Unsupported video format/codec');
            console.error('- Corrupted video file');
            console.error('- Missing video codecs');
            console.error('Video file info:', videoFile.name, videoFile.type, videoFile.size);
            
            // Cleanup temp files even on failure
            try {
              try {
                await fs.unlink(originalVideoPath);
              } catch (unlinkError) {
                // File might already be deleted by another process
                console.log('Video file already cleaned up:', originalVideoPath);
              }
              await fs.rm(tempFramesDir, { recursive: true });
            } catch (cleanupError) {
              console.error('Cleanup error:', cleanupError);
            }
            
            reject(new Error(`FFmpeg failed with code ${code}. Video format may be unsupported. Try converting to MP4 with H.264 codec.`));
          }
        });

        ffmpegProcess.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Analyze frames using Cerebras vision model
  private async analyzeFrames(frames: string[], query: string): Promise<Array<{frame: string, detected: boolean, confidence: number}>> {
    const results = [];

    for (const frame of frames) {
      try {
        // Use OpenAI for vision inference since Cerebras doesn't support images properly
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `${query} Please respond with YES or NO, followed by a confidence score from 0-100.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${frame}`
                  }
                }
              ]
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        });

        const responseText = response.choices[0]?.message?.content || '';
        const detected = responseText.toLowerCase().includes('yes');
        
        // Extract confidence score (simple regex)
        const confidenceMatch = responseText.match(/(\d+)/);
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : (detected ? 70 : 30);

        // Debug logging
        console.log('🔍 FRAME ANALYSIS DEBUG:');
        console.log('Query:', query);
        console.log('Model Response:', responseText);
        console.log('Detected:', detected);
        console.log('Confidence:', confidence);
        console.log('---');

        results.push({
          frame,
          detected,
          confidence
        });
      } catch (error) {
        console.error('Error analyzing frame:', error);
        results.push({
          frame,
          detected: false,
          confidence: 0
        });
      }
    }

    return results;
  }

  // Create video snippet from matching frames
  private async createVideoSnippet(videoFile: File, detectionResults: Array<{frame: string, detected: boolean, confidence: number}>): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const tempVideoPath = path.join(os.tmpdir(), `input-${Date.now()}.mp4`);
        const outputVideoPath = path.join(os.tmpdir(), `snippet-${Date.now()}.mp4`);
        
        await fs.writeFile(tempVideoPath, buffer);

        // Find time ranges where detection occurred
        const detectedFrameIndices = detectionResults
          .map((result, index) => ({ ...result, index }))
          .filter(result => result.detected)
          .map(result => result.index);

        if (detectedFrameIndices.length === 0) {
          resolve('');
          return;
        }

        // Create 3-second snippets around detected frames
        const startTime = Math.max(0, detectedFrameIndices[0] - 1); // 1 second before first detection
        const duration = 3; // 3 seconds total

        // Create snippet using ffmpeg
        let ffmpegPath = ffmpeg;
        
        // Fix invalid ffmpeg-static paths on Windows
        if (ffmpegPath && ffmpegPath.includes('\\ROOT\\')) {
          console.log('Invalid ffmpeg-static path detected, using system ffmpeg');
          ffmpegPath = null;
        }
        
        if (!ffmpegPath) {
          ffmpegPath = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
        }
        const ffmpegProcess = spawn(ffmpegPath, [
          '-i', tempVideoPath,
          '-ss', startTime.toString(),
          '-t', duration.toString(),
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-y', // Overwrite output
          outputVideoPath
        ]);

        ffmpegProcess.on('close', async (code) => {
          if (code === 0) {
            try {
              const snippetBuffer = await fs.readFile(outputVideoPath);
              const base64Snippet = snippetBuffer.toString('base64');
              
              // Cleanup
              await fs.unlink(tempVideoPath);
              await fs.unlink(outputVideoPath);
              
              resolve(base64Snippet);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`FFmpeg snippet creation failed with code ${code}`));
          }
        });

        ffmpegProcess.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get agent status
  getAgentStatus(agentId: string): AgentTask | undefined {
    return this.agents.get(agentId);
  }

  // Get all agent statuses
  getAllAgentStatuses(): AgentTask[] {
    return Array.from(this.agents.values());
  }

  // Get progress (percentage of completed agents)
  getProgress(): number {
    const total = this.agents.size;
    if (total === 0) return 0;
    
    const completed = Array.from(this.agents.values())
      .filter(agent => agent.status === 'completed' || agent.status === 'failed').length;
    
    return Math.round((completed / total) * 100);
  }

  // Convert video to compatible format
  private async convertVideoToCompatibleFormat(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let ffmpegPath = ffmpeg;
      
      // Fix invalid ffmpeg-static paths on Windows
      if (ffmpegPath && ffmpegPath.includes('\\ROOT\\')) {
        console.log('Invalid ffmpeg-static path detected, using system ffmpeg');
        ffmpegPath = null;
      }
      
      if (!ffmpegPath) {
        ffmpegPath = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
      }
      
      console.log('Converting video:', inputPath, '->', outputPath);
      
      const convertProcess = spawn(ffmpegPath, [
        '-i', inputPath,
        '-c:v', 'libx264', // H.264 codec
        '-c:a', 'aac', // AAC audio
        '-preset', 'fast', // Fast encoding
        '-crf', '23', // Good quality
        '-movflags', '+faststart', // Web optimization
        '-y', // Overwrite output
        outputPath
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      convertProcess.stdout.on('data', (data) => {
        console.log('Convert stdout:', data.toString());
      });

      convertProcess.stderr.on('data', (data) => {
        console.log('Convert stderr:', data.toString());
      });

      convertProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Video conversion successful');
          resolve();
        } else {
          console.error('Video conversion failed with code:', code);
          reject(new Error(`Video conversion failed with code ${code}`));
        }
      });

      convertProcess.on('error', (error) => {
        console.error('Video conversion error:', error);
        reject(error);
      });
    });
  }
}
