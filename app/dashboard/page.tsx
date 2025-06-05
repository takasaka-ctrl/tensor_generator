'use client'

import { useState, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import clsx from 'clsx'
import { v4 as uuidv4 } from 'uuid'

export default function Dashboard() {
  const [raw, setRaw] = useState('')
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('')
  const [modelName, setModelName] = useState('')
  const [modelId, setModelId] = useState('')
  const [steps, setSteps] = useState('20')
  const [cfgScale, setCfgScale] = useState('7')
  const [templates, setTemplates] = useLocalStorage<{id:string;name:string;config:any}[]>('TEMPLATES', [])
  const [selectedTemplate, setSelectedTemplate] = useState('')

  useEffect(() => {
    const t = templates.find(t => t.id === selectedTemplate)
    if (t) {
      const c = t.config
      setPrompt(c.prompt || '')
      setNegative(c.negativePrompt || '')
      setModelName(c.modelName || '')
      setModelId(c.modelId || '')
      setSteps(String(c.steps || '20'))
      setCfgScale(String(c.cfgScale || '7'))
    }
  }, [selectedTemplate, templates])

  function handleAutoFill() {
    try {
      const data = JSON.parse(raw)
      setPrompt(data.prompt || '')
      setNegative(data.negative_prompt || '')
      setModelName(data.model || '')
      setSteps(String(data.steps || '20'))
      setCfgScale(String(data.cfg_scale || '7'))
    } catch (err) {
      console.error('parse failed')
    }
  }

  async function handleFetchModelId() {
    if (!modelName) return
    const resp = await fetch(`/api/model/search?name=${encodeURIComponent(modelName)}`)
    if (resp.ok) {
      const json = await resp.json()
      setModelId(json.id)
    }
  }

  async function handleGenerate() {
    const resp = await fetch('/api/image/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        negativePrompt: negative,
        modelId,
        otherParams: { steps: Number(steps), cfgScale: Number(cfgScale) },
      }),
    })
    if (resp.ok) {
      const job = await resp.json()
      console.log('job created', job)
    }
  }

  function handleSaveTemplate() {
    const name = prompt.slice(0, 20) || 'template'
    setTemplates(ts => [{ id: uuidv4(), name, config: { prompt, negativePrompt: negative, modelName, modelId, steps:Number(steps), cfgScale:Number(cfgScale)}}, ...ts].slice(0, 20))
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">AI Image Dashboard</h1>
      <div className="flex flex-col gap-2 max-w-md">
        <textarea className="textarea textarea-bordered" placeholder="Paste tensor.art JSON" value={raw} onChange={e=>setRaw(e.target.value)}></textarea>
        <button className="btn btn-outline" onClick={handleAutoFill}>Auto Fill</button>
        <input className="input input-bordered" placeholder="Prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} />
        <input className="input input-bordered" placeholder="Negative Prompt" value={negative} onChange={e=>setNegative(e.target.value)} />
        <div className="flex gap-2">
          <input className="input input-bordered flex-auto" placeholder="Model name" value={modelName} onChange={e=>setModelName(e.target.value)} />
          <button className="btn" onClick={handleFetchModelId}>Fetch Model ID</button>
        </div>
        <input className="input input-bordered" placeholder="Model ID" value={modelId} onChange={e=>setModelId(e.target.value)} />
        <div className="flex gap-2">
          <input className="input input-bordered" placeholder="Steps" value={steps} onChange={e=>setSteps(e.target.value)} />
          <input className="input input-bordered" placeholder="CFG Scale" value={cfgScale} onChange={e=>setCfgScale(e.target.value)} />
        </div>
        <select className="select select-bordered" value={selectedTemplate} onChange={e=>setSelectedTemplate(e.target.value)}>
          <option value="">Select template</option>
          {templates.map(t=> (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleGenerate}>Generate</button>
          <button className="btn btn-outline" onClick={handleSaveTemplate}>Save Template</button>
        </div>
      </div>
    </div>
  )
}
