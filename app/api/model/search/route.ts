import { NextRequest, NextResponse } from 'next/server'
import { tamsSDK } from '@/service/tams'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  if (!name) {
    return NextResponse.json({ message: 'name is required' }, { status: 400 })
  }

  try {
    // attempt to search model by name using TAMS SDK
    // the exact API may vary; this is a best-effort implementation
    const resp: any = await (tamsSDK as any).v1.tamsApiV1ServiceListSdModels({
      name,
      page: 1,
      pageSize: 10,
    })
    const models = resp?.data?.sdModels || []
    const match = models.find((m: any) => m.name === name)
    if (!match) {
      return NextResponse.json({ message: 'Model not found' }, { status: 404 })
    }
    return NextResponse.json({ id: match.id })
  } catch (err) {
    console.error('model fetch failed', err)
    return NextResponse.json({ message: 'Failed to fetch model id' }, { status: 500 })
  }
}
