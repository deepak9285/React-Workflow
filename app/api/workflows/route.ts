import { NextRequest, NextResponse } from 'next/server'
import  {saveWorkFlow} from '@/lib/db'
import { z } from 'zod'
import { validateWorkflow } from '@/lib/validation'

export async function POST(req: Request) {
  try {
    const body = await req.json()
  
    // Validate workflow structure
    const validation = validateWorkflow(body.nodes || [], body.edges || [])
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid workflow: ${validation.errors.join(', ')}`,
        },
        { status: 400 }
      )
    }
  
    const result = await saveWorkFlow(body)
  

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}