'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { sendChatMessage } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) return <span>{content}</span>

  // Split into blocks by double newline (paragraphs)
  const blocks = content.split(/\n{2,}/)

  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const lines = block.split('\n')
        const isList = lines.every(l => /^[-•*]\s/.test(l.trim()) || l.trim() === '')

        if (isList) {
          return (
            <ul key={bi} className="space-y-0.5 pl-1">
              {lines.filter(l => l.trim()).map((line, li) => (
                <li key={li} className="flex gap-1.5">
                  <span className="mt-0.5 text-[#CC0000] flex-shrink-0">•</span>
                  <span>{renderInline(line.replace(/^[-•*]\s/, ''))}</span>
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={bi}>
            {lines.map((line, li) => (
              <span key={li}>
                {renderInline(line)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

const SUGGESTED_QUESTIONS = [
  'Do I need renters insurance?',
  'What benefits do I qualify for?',
  'How do I build my credit score?',
  'What should I do in a financial emergency?',
]

export default function ChatWidget() {
  const { user } = useAuth()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || ''
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      if (!hasGreeted) {
        setMessages([{
          role: 'assistant',
          content: `Hi${firstName ? `, ${firstName}` : ''}! I'm your SafeCircle financial assistant. I've read your risk scan and I'm here to help. Ask me anything — insurance gaps, benefits you qualify for, what to do in a crisis, or anything else about your finances.`,
        }])
        setHasGreeted(true)
      }
    }
  }, [open, hasGreeted, firstName])

  if (!user) return null

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }))
      const res = await sendChatMessage(msg, history.slice(0, -1))
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#CC0000] to-[#A50000] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">SafeCircle Assistant</p>
                <p className="text-red-100 text-xs">Personalized to your risk scan</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2.5 items-start', msg.role === 'user' && 'flex-row-reverse')}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  msg.role === 'assistant' ? 'bg-[#CC0000]' : 'bg-slate-200'
                )}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-3.5 h-3.5 text-white" />
                    : <User className="w-3.5 h-3.5 text-slate-500" />
                  }
                </div>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-slate-50 text-slate-800 rounded-tl-sm'
                    : 'bg-[#CC0000] text-white rounded-tr-sm'
                )}>
                  <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-[#CC0000] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-400 font-medium px-1">Suggested questions</p>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="w-full text-left text-xs bg-white border border-slate-200 hover:border-[#CC0000] hover:text-[#CC0000] rounded-xl px-3 py-2 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3 flex-shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your finances..."
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-full bg-[#CC0000] hover:bg-[#A50000] disabled:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-300 mt-1.5">Powered by Claude AI · Not financial advice</p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          open ? 'bg-slate-700 hover:bg-slate-800' : 'bg-[#CC0000] hover:bg-[#A50000] hover:scale-110'
        )}
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  )
}
