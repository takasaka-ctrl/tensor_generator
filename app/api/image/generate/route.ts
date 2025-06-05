import { tamsSDK } from '@/service/tams'
import { NextRequest, NextResponse } from 'next/server'
import * as uuid from 'uuid'
import { t } from 'tams-sdk'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    prompt: string
    negativePrompt?: string
    modelId: string
    otherParams?: any
  }

  if (!body.prompt || !body.modelId) {
    return NextResponse.json({ message: 'prompt and modelId required' }, { status: 400 })
  }

  const createJobBody: t.TamsApiCreateJobRequest = {
    requestId: uuid.v4(),
    stages: [
      {
        type: t.TamsApiStageTypeT.INPUT_INITIALIZE,
        inputInitialize: {
          seed: '-1',
          count: 1,
        },
      },
      {
        type: t.TamsApiStageTypeT.DIFFUSION,
        diffusion: {
          width: body.otherParams?.width ?? 512,
          height: body.otherParams?.height ?? 512,
          prompts: [{ text: body.prompt }],
          negativePrompts: body.negativePrompt ? [{ text: body.negativePrompt }] : [],
          sdModel: body.modelId,
          steps: body.otherParams?.steps ?? 20,
          cfgScale: body.otherParams?.cfgScale ?? 7,
        },
      },
    ],
  }

  const resp = await tamsSDK.v1.tamsApiV1ServiceCreateJob(createJobBody)
  return NextResponse.json(resp.data.job ?? {})
}
