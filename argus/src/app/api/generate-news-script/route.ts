import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional news script writer. Generate realistic, professional news scripts that are under 30 seconds when read aloud. Keep the tone serious and informative.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const script = response.choices[0]?.message?.content || '';

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Error generating news script:', error);
    return NextResponse.json({ 
      error: 'Failed to generate news script',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
