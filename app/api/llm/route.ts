import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const ImageDataSchema = z.object({
  nodeId: z.string(),
  imageUrl: z.string().min(1).refine((v) => {
    if (v.startsWith('data:')) return true
    try {
      const u = new URL(v)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch (e) {
      return false
    }
  }, { message: 'imageUrl must be a data URL or an http/https URL' }),
})

const MessageSchema = z.object({ role: z.string(), content: z.string() })

const LLMRequestSchema = z.object({
  prompt: z.string().optional(),
  messages: z.array(MessageSchema).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  systemPrompt: z.string().optional(),
  images: z.array(ImageDataSchema).optional(),
  model: z.string().optional(),
}).refine((data) => !!(data.prompt || (data.messages && data.messages.length > 0)), {
  message: 'Either prompt or messages must be provided',
  path: ['prompt'],
})

export async function POST(request: NextRequest) {
  try {
    const jsonBody = await request.json();
    const parsed = LLMRequestSchema.safeParse(jsonBody);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'validation_error', details: parsed.error.format() }, { status: 400 });
    }

    const { prompt, messages, temperature = 0.7, maxTokens = 1000, systemPrompt, images, model = 'gemini-2.0-flash' } = parsed.data;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key not configured. Please add GOOGLE_GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }
    const modelName = model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const parts: any[] = [];

    if (images && images.length > 0) {
      for (const image of images) {
        if (image.imageUrl) {
          if (image.imageUrl.startsWith('data:')) {
            const [header, data] = image.imageUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            parts.push({
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            });
          } else {
            parts.push({
              fileData: {
                mimeType: 'image/jpeg',
                fileUri: image.imageUrl
              }
            });
          }
        }
      }
    }
    parts.push({ text: prompt });

    const content = messages && messages.length > 0
      ? {
          contents: messages.map((msg) => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })),
        }
      : {
          contents: [
            {
              role: 'user',
              parts: parts,
            },
          ],
        };

    const bodyPayload: any = {
      ...content,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemPrompt) {
      bodyPayload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const controller = new AbortController();
    const timeoutMs = 30000; 
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let data: any = {};
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      try {
        data = await res.json();
      } catch (parseErr) {
        data = { parseError: String(parseErr) };
      }
      if (!res.ok) {
        if (res.status === 404) {
          try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const listData = await listRes.json().catch(() => ({}));
            console.error('Gemini API error (model missing)', { generateError: data, models: listData });
            return NextResponse.json(
              { success: false, error: 'Model not found for generateContent', details: { generateError: data, availableModels: listData } },
              { status: res.status }
            );
          } catch (listErr) {
            console.error('Failed to list models after 404:', listErr);
          }
        }
        console.error('Gemini API error', data);
        return NextResponse.json({ success: false, error: 'Gemini API error', details: data }, { status: res.status });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('LLM API fetch error', err);
      const details = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ success: false, error: 'Internal server error', details }, { status: 500 });
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.candidates?.[0]?.content || '';
    return NextResponse.json({ success: true, provider: 'google', model: modelName, response: text, fullResponse: data });
  } catch (error) {
    console.error('LLM API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const apiKeyConfigured = !!process.env.GOOGLE_GEMINI_API_KEY;

  return NextResponse.json({
    status: 'ok',
    message: 'LLM API endpoint is running',
    provider: 'Google Generative AI',
    model: 'gemini-pro',
    apiKeyConfigured,
    instructions: 'Add GOOGLE_GEMINI_API_KEY to your .env.local file',
  });
}
