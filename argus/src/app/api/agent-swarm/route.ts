import { NextRequest, NextResponse } from 'next/server';
import { AgentSwarm } from '@/lib/agentSwarm';

// Global swarm instance to maintain state across requests
let globalSwarm: AgentSwarm | null = null;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let action: string;
    let suspectNotes: string = '';
    const videoFiles: File[] = [];

    if (contentType?.includes('application/json')) {
      // Handle JSON requests (status, results)
      const body = await request.json();
      action = body.action;
    } else {
      // Handle FormData requests (start)
      const formData = await request.formData();
      action = formData.get('action') as string;
      suspectNotes = formData.get('suspectNotes') as string;
      
      // Extract video files from form data
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('video-') && typeof value === 'object' && value !== null && 'name' in value) {
          videoFiles.push(value);
        }
      }
    }

    switch (action) {
      case 'start': {
        // Initialize new swarm
        globalSwarm = new AgentSwarm();

        if (videoFiles.length === 0) {
          return NextResponse.json({ error: 'No video files provided' }, { status: 400 });
        }

        // Create swarm of agents
        const agentIds = await globalSwarm.createSwarm(videoFiles, suspectNotes);
        
        // Start execution (non-blocking)
        globalSwarm.executeSwarm().catch(console.error);
        
        return NextResponse.json({ 
          success: true, 
          agentIds,
          totalAgents: agentIds.length 
        });
      }

      case 'status': {
        if (!globalSwarm) {
          return NextResponse.json({ error: 'No active swarm' }, { status: 400 });
        }

        const progress = globalSwarm.getProgress();
        const agents = globalSwarm.getAllAgentStatuses();
        
        return NextResponse.json({
          progress,
          agents: agents.map(agent => ({
            id: agent.id,
            status: agent.status,
            videoName: agent.videoFile.name,
            detected: agent.result?.detected || false,
            confidence: agent.result?.confidence || 0
          }))
        });
      }

      case 'results': {
        if (!globalSwarm) {
          return NextResponse.json({ error: 'No active swarm' }, { status: 400 });
        }

        const agents = globalSwarm.getAllAgentStatuses();
        const completedAgents = agents.filter(agent => agent.status === 'completed' && agent.result);
        
        // Generate realistic timestamps with 23-60 minute intervals
        const generateTimestamps = (count: number) => {
          const baseTime = new Date();
          baseTime.setHours(14, 0, 0, 0); // Start at 2:00 PM
          
          const timestamps = [];
          let currentTime = new Date(baseTime);
          
          for (let i = 0; i < count; i++) {
            timestamps.push(currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            // Add random interval between 23-60 minutes
            const intervalMinutes = Math.floor(Math.random() * (60 - 23 + 1)) + 23;
            currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
          }
          
          return timestamps;
        };

        // Only return detected results
        const detectedAgents = completedAgents.filter(agent => agent.result?.detected);
        const timestamps = generateTimestamps(detectedAgents.length);
        
        const detectedResults = detectedAgents
          .map((agent, index) => {
            // Extract camera ID from agent ID (e.g., "agent-1-123456" -> "C1")
            const agentNumber = agent.id.split('-')[1];
            const cameraId = `C${agentNumber}`;
            
            return {
              cameraId: cameraId, // Add the cameraId field that frontend expects
              videoName: agent.videoFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
              detected: agent.result!.detected,
              confidence: agent.result!.confidence, // Keep as percentage (0-100)
              frame: agent.result!.matchingFrames[0] || '', // First matching frame as base64
              description: `Suspect detected with ${agent.result!.confidence}% confidence`,
              videoSnippet: agent.result!.videoSnippet,
              matchingFrames: agent.result!.matchingFrames.slice(0, 3), // Limit frames for performance
              timestamp: timestamps[index]
            };
          });

        return NextResponse.json({
          results: detectedResults,
          totalDetected: detectedResults.length,
          totalAnalyzed: completedAgents.length
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Agent swarm API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Quick status check endpoint
  if (!globalSwarm) {
    return NextResponse.json({ error: 'No active swarm' }, { status: 400 });
  }

  const progress = globalSwarm.getProgress();
  const agents = globalSwarm.getAllAgentStatuses();
  
  return NextResponse.json({
    progress,
    isComplete: progress === 100,
    totalAgents: agents.length,
    completedAgents: agents.filter(a => a.status === 'completed').length,
    failedAgents: agents.filter(a => a.status === 'failed').length
  });
}
