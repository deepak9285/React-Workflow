

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

const ImageDataSchema = z.object({
  nodeId: z.string(),
  imageUrl: z.string().min(1),
})

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const LLMRequestSchema = z
  .object({
    prompt: z.string().optional(),
    messages: z.array(MessageSchema).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
    systemPrompt: z.string().optional(),
    images: z.array(ImageDataSchema).optional(),
    model: z.string().optional(),
  })
  .refine(
    (data) => !!(data.prompt || (data.messages && data.messages.length > 0)),
    { message: 'Either prompt or messages must be provided' }
  )


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LLMRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'validation_error', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const {
      prompt,
      messages,
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt,
      images,
      model = 'gemini-2.5-flash',
    } = parsed.data

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const genModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
      systemInstruction: systemPrompt,

    })


    const parts: any[] = []

    if (images?.length) {
      for (const img of images) {
        if (img.imageUrl.startsWith('data:')) {
          const [, base64] = img.imageUrl.split(',')
          parts.push({
            inlineData: {
              data: base64,
              mimeType: 'image/jpeg',
            },
          })
        }
      }
    }
    if (prompt) {
      parts.push({ text: prompt })
    }


    let result

    if (messages && messages.length > 0) {
      const chat = genModel.startChat({
        history: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      })

      result = await chat.sendMessage(prompt ?? '')
    } else {
      result = await genModel.generateContent({
        contents: [{ role: 'user', parts }],
      })
    }

    const responseText =
      result.response.text() ??
      result.response.candidates?.[0]?.content?.parts?.[0]?.text ??
      ''
      console.log('Gemini SDK Response:', responseText);

    return NextResponse.json({
      success: true,
      provider: 'google',
      model,
      response: responseText,
      fullResponse: result.response,
    })
  } catch (error) {
    console.error('Gemini SDK Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'Google Generative AI',
    apiKeyConfigured: !!process.env.GOOGLE_GEMINI_API_KEY,
  })
}
