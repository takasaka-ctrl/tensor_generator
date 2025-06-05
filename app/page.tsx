'use client'

import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useInterval } from 'ahooks'
import { produce } from 'immer'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { MODELS } from '@/constants'
import { Trash } from '@/components/icons/Trash'
import { Github } from '@/components/icons/Github'

export default function Home() {
  const [messages, setMessages] = useState<
    { content: string; type: 'success' | 'error' | 'info'; timestamp: number }[]
  >([])

  const [url, setUrl] = useState('')
  const [weight, setWeight] = useState('')
  const [prompt, setPrompt] = useState('')
  const [modelName, setModelName] = useState('')
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id)
  const isInited = useRef(false)
  const [history, setHistory, isHistoryInited] = useLocalStorage<
    { id: string; status: string; url?: string }[]
  >('HISTORY', [])

  useEffect(() => {
    if (isHistoryInited && !isInited.current) {
      isInited.current = true
      history.forEach((h) => {
        if (h.status === 'SUCCESS') {
          fetch(`/api/job/${h.id}`)
            .then((res) => res.json())
            .then(
              (res: {
                id: string
                status: string
                successInfo: { images: { url: string }[] }
              }) => {
                setHistory((history) => {
                  return produce(history!, (draftHistory) => {
                    const index = draftHistory.findIndex((h) => h.id === res.id)
                    if (index > -1) {
                      draftHistory[index].status = res.status
                      draftHistory[index].url = res.successInfo.images[0].url
                    }
                    draftHistory.splice(10)
                  })
                })
              },
            )
        }
      })
    }
  }, [history, isHistoryInited, setHistory])

  function handleRemoveHistory() {
    setHistory([])
  }

  async function handleFetchModelId() {
    if (!modelName) {
      return
    }
    try {
      const resp = await fetch(`/api/model/search?name=${encodeURIComponent(modelName)}`)
      if (!resp.ok) {
        const json = (await resp.json()) as { message: string }
        setMessages((messages) => {
          return produce(messages, (draft) => {
            draft.unshift({ content: json.message, timestamp: Date.now(), type: 'error' })
          })
        })
        return
      }
      const json = (await resp.json()) as { id: string }
      setSelectedModelId(json.id)
      setMessages((messages) => {
        return produce(messages, (draft) => {
          draft.unshift({ content: 'Model ID fetched', timestamp: Date.now(), type: 'success' })
        })
      })
    } catch (err) {
      setMessages((messages) => {
        return produce(messages, (draft) => {
          draft.unshift({ content: 'Failed to fetch model', timestamp: Date.now(), type: 'error' })
        })
      })
    }
  }

  async function handleGenerate() {
    try {
      if (Number.isNaN(+weight) || +weight <= 0) {
        setMessages((messages) => {
          return produce(messages, (draftMessages) => {
            draftMessages.unshift({
              content: 'Weight must be a number greater than zero',
              timestamp: Date.now(),
              type: 'error',
            })
          })
        })
        return
      }

      const resp = await fetch('/api/qrcode/generate', {
        method: 'POST',
        body: JSON.stringify({
          url,
          weight: +weight,
          prompt: prompt,
          modelId: selectedModelId,
        }),
      })

      if (!resp.ok) {
        const json = (await resp.json()) as { message: string }
        setMessages((messages) => {
          return produce(messages, (draftMessages) => {
            draftMessages.unshift({
              content: json.message,
              timestamp: Date.now(),
              type: 'error',
            })
          })
        })
        return
      }

      const json = (await resp.json()) as { id: string; status: string }
      if (json.id) {
        setHistory((history) => {
          return produce(history!, (draftHistory) => {
            draftHistory.unshift(json)
            draftHistory.splice(10)
          })
        })
      }
    } catch (err) {}
  }

  useInterval(
    () => {
      ;(history ?? [])
        .filter((history) =>
          ['CREATED', 'PENDING', 'RUNNING', 'WAITING'].includes(history.status),
        )
        .forEach((h) => {
          fetch(`/api/job/${h.id}`)
            .then((res) => res.json())
            .then(
              (res: {
                id: string
                status: string
                successInfo: { images: { url: string }[] }
              }) => {
                if (['CANCELED', 'SUCCESS', 'FAILED'].includes(res.status)) {
                  setHistory((history) => {
                    return produce(history!, (draftHistory) => {
                      const index = draftHistory.findIndex(
                        (h) => h.id === res.id,
                      )
                      if (index > -1) {
                        draftHistory[index].status = res.status
                        draftHistory[index].url =
                          res?.successInfo?.images?.[0]?.url ?? ''
                      }
                    })
                  })
                }
              },
            )
        })
    },
    5 * 1000,
    {
      immediate: true,
    },
  )

  useInterval(() => {
    setMessages((msgs) => {
      return msgs.filter((msg) => {
        if (Date.now() - msg.timestamp > 2 * 1000) {
          return false
        }
        return true
      })
    })
  }, 100)

  function getStatus({ status }: { status: string }) {
    if (status === 'FAILED') {
      return 'Failed'
    }

    return 'Loading'
  }

  return (
    <main className="flex flex-col p-4 sm:flex-row sm:pt-0 gap-4 relative">
      <div className="bg-white rounded-lg overflow-hidden relative shadow">
        <div className="h-[calc(100vh-64px)] overflow-y-scroll py-4 px-6 pb-[100px]">
          <div className="flex justify-between items-center mb-2">
            <div className="text-lg font-semibold">🪄 Workspace</div>
            <div className="flex gap-2 items-center">
              <Link
                className="flex items-center text-slate-800 hover:text-primary"
                href="/dashboard"
              >
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link
                className="flex items-center text-slate-800 hover:text-primary"
                href="https://github.com/Tensor-Art/tams-gen-qrcode-example"
                target="_blank"
              >
                <Github />
                <span className="text-sm ml-1">Source Code</span>
              </Link>
            </div>
          </div>
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">
                URL<span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="Please enter URL"
              className="input input-bordered w-full max-w-xs"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">
                Weight<span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="Please enter weight (eg. 2)"
              className="input input-bordered w-full max-w-xs"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt">
                The larger the weight value, the easier it is for the QR code to
                be scanned, but the artistic quality may decrease
              </span>
            </label>
          </div>
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Style</span>
            </label>
            <div>
              {MODELS.map((m) => (
                <div
                  key={m.id}
                  className={clsx(
                    'flex items-center border-2 border-solid rounded-lg cursor-pointer p-2',
                    {
                      'border-primary': selectedModelId === m.id,
                      'border-transparent': selectedModelId !== m.id,
                    },
                  )}
                  onClick={() => setSelectedModelId(m.id)}
                >
                  <div className="rounded w-12 h-12 bg-gray-300 mr-2 overflow-hidden">
                    <Image src={m.src} width="48" height="48" alt="" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {m.name}
                    </div>
                    <div className="text-sm text-slate-500">{m.modelName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Model Name</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter model name"
                className="input input-bordered flex-auto"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
              <button className="btn btn-outline" onClick={handleFetchModelId}>
                Fetch Model ID
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt">Current ID: {selectedModelId}</span>
            </label>
          </div>
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">
                Prompt<span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Please enter prompt (eg. 1girl, sitting on the chair)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            ></textarea>
          </div>
        </div>
        <div className="flex items-center border-t border-gray-200 absolute bottom-0 left-0 right-0 bg-white px-6 py-4">
          <button
            className="btn btn-primary flex-auto"
            onClick={handleGenerate}
          >
            Generate
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg overflow-hidden relative shadow">
        <div className="w-auto sm:w-[300px] h-[calc(100vh-64px)] p-4 overflow-y-scroll">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">📌 History</div>
            <div onClick={handleRemoveHistory} className="cursor-pointer">
              <Trash />
            </div>
          </div>
          <div className="text-xs mb-2">
            The history will only be saved locally. Clearing the cache will
            result in losing the history.
          </div>
          {history!.length === 0 ? (
            <div className="h-full text-gray-500 flex items-center justify-center">
              No history yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {history!.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-gray-100 rounded-lg aspect-square overflow-hidden flex items-center justify-center"
                  >
                    {item.url ? (
                      <img src={item.url} alt="" />
                    ) : (
                      <span className="text-gray-500">{getStatus(item)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="toast toast-bottom toast-end">
        {messages.map((msg) => (
          <div
            key={msg.timestamp}
            className={clsx('alert', {
              'alert-success': msg.type === 'success',
              'alert-info': msg.type === 'info',
              'alert-error': msg.type === 'error',
            })}
          >
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
