import { NextRequest, NextResponse } from 'next/server';
import { Cerebras } from '@cerebras/cerebras_cloud_sdk';

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, timelineContext } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const systemPrompt = `You are an AI assistant analyzing a suspect timeline from surveillance data. You have access to the following timeline information:

${timelineContext}

Answer questions about the suspect's movements, locations, timing, and patterns based on this timeline data. Be specific and reference the actual locations and times from the data. Keep responses concise and informative.`;

    const response = await cerebras.chat.completions.create({
      model: 'qwen-3.8-27b',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const answer = response.choices[0]?.message?.content || 'I could not process your question about the timeline.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error processing timeline chat:', error);
    return NextResponse.json({ 
      error: 'Failed to process timeline question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
