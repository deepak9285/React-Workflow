import { NextRequest, NextResponse } from 'next/server'
import  {saveWorkFlow} from '@/lib/db'
import { z } from 'zod'
export async function POST(req: Request) {
  try {
    const body = await req.json()
  
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