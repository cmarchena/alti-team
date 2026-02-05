'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import MessageRenderer from '@/components/chat/MessageRenderer'
import WorkflowConfirmation from '@/components/chat/WorkflowConfirmation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface WorkflowState {
  id: string
  entityType: string
  data: Record<string, unknown>
  isActive: boolean
}

const initialMessages: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      "Hello! I'm your AltiTeam assistant. I can help you manage projects, tasks, teams, and more through natural conversation. What would you like to do today?",
    timestamp: new Date(),
  },
]

export default function ChatPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  interface SlashCommand {
    command: string
    description: string
    action: string
  }

  const slashCommands: SlashCommand[] = [
    {
      command: '/help',
      description: 'Show available commands',
      action: 'help',
    },
    { command: '/new', description: 'Start a new conversation', action: 'new' },
    {
      command: '/clear',
      description: 'Clear current conversation',
      action: 'clear',
    },
    { command: '/tasks', description: 'Show my tasks', action: 'tasks' },
    {
      command: '/projects',
      description: 'Show my projects',
      action: 'projects',
    },
    {
      command: '/organizations',
      description: 'Show my organizations',
      action: 'organizations',
    },
    {
      command: '/create-task',
      description: 'Create a new task',
      action: 'create-task',
    },
    {
      command: '/create-project',
      description: 'Create a new project',
      action: 'create-project',
    },
    {
      command: '/search',
      description: 'Search across all items',
      action: 'search',
    },
    {
      command: '/invite',
      description: 'Invite a team member',
      action: 'invite',
    },
  ]

  const filteredSlashCommands = inputValue.startsWith('/')
    ? slashCommands.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(inputValue.toLowerCase()) ||
          cmd.description.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : slashCommands

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (value.startsWith('/')) {
      setShowSlashMenu(true)
      setSelectedCommandIndex(0)
    } else {
      setShowSlashMenu(false)
    }
  }

  const selectCommand = (cmd: SlashCommand) => {
    switch (cmd.action) {
      case 'help':
        setInputValue('/help')
        break
      case 'new':
        setMessages(initialMessages)
        break
      case 'clear':
        setMessages(initialMessages)
        break
      case 'tasks':
        setInputValue('Show me my tasks')
        break
      case 'projects':
        setInputValue('Show me my projects')
        break
      case 'organizations':
        setInputValue('List my organizations')
        break
      case 'create-task':
        setInputValue('Create a new task')
        break
      case 'create-project':
        setInputValue('Create a new project')
        break
      case 'search':
        setInputValue('Search for ')
        break
      case 'invite':
        setInputValue('Invite a new team member')
        break
    }
    setShowSlashMenu(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setStreamingContent('')

    const convId = conversationId || `conv-${Date.now()}`

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
          conversationId: convId,
        }),
      })

      setConversationId(convId)

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantContent += chunk
        setStreamingContent(assistantContent)

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: assistantContent }
              : m,
          ),
        )
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          error instanceof Error && error.message.includes('401')
            ? 'Your session has expired. Please sign in again.'
            : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStreamingContent('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu && filteredSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCommandIndex((prev) =>
          prev < filteredSlashCommands.length - 1 ? prev + 1 : 0,
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCommandIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSlashCommands.length - 1,
        )
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedCommandIndex < filteredSlashCommands.length) {
          selectCommand(filteredSlashCommands[selectedCommandIndex])
        }
        return
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const quickPrompts = [
    'Show me my tasks',
    'Create a new project',
    'What tasks are due today?',
    'List my organizations',
  ]

  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null)
  const [workflowIsLoading, setWorkflowIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    setMessages(initialMessages)
    setWorkflowState(null)
    setConversationId(null)
  }

  const handleWorkflowConfirm = async () => {
    if (!workflowState) return

    setWorkflowIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: 'yes' },
          ],
          stream: true,
          conversationId: workflowState.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to confirm workflow')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantContent += chunk

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: assistantContent }
              : m,
          ),
        )
      }

      setWorkflowState(null)
      setConversationId(null)
    } catch (error) {
      console.error('Workflow confirmation error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          'I encountered an error while creating the item. Would you like to try again?',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setWorkflowState(null)
    } finally {
      setWorkflowIsLoading(false)
    }
  }

  const handleWorkflowCancel = () => {
    setWorkflowState(null)
    setConversationId(null)
  }

  const handleWorkflowBack = () => {
    setWorkflowState(null)
    setConversationId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                AltiTeam Chat
              </h1>
              <p className="text-sm text-gray-500">
                AI-powered project management
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {session?.user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-medium">
                    {session.user.name?.[0]?.toUpperCase() ||
                      session.user.email?.[0]?.toUpperCase() ||
                      'U'}
                  </span>
                </div>
                <span className="hidden sm:inline">
                  {session.user.name || session.user.email}
                </span>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex max-w-[85%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-indigo-600 ml-3'
                      : 'bg-gray-600 mr-3'
                  }`}
                >
                  {message.role === 'user' ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <MessageRenderer content={message.content} />
                  ) : (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {message.content || (
                        <span className="text-gray-400 italic">
                          Thinking...
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user'
                        ? 'text-indigo-200'
                        : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && !streamingContent && (
            <div className="flex justify-start">
              <div className="flex flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {workflowState?.isActive && (
            <WorkflowConfirmation
              entityType={workflowState.entityType}
              data={workflowState.data}
              onConfirm={handleWorkflowConfirm}
              onCancel={handleWorkflowCancel}
              onBack={handleWorkflowBack}
              isLoading={workflowIsLoading}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && !isLoading && (
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {showSlashMenu && inputValue.startsWith('/') && (
            <div className="mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <div className="py-1">
                {filteredSlashCommands.map((cmd, index) => (
                  <button
                    key={cmd.command}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                      selectedCommandIndex === index ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => selectCommand(cmd)}
                  >
                    <span className="font-mono text-sm text-indigo-600 w-20">
                      {cmd.command}
                    </span>
                    <span className="text-sm text-gray-600">
                      {cmd.description}
                    </span>
                  </button>
                ))}
                {filteredSlashCommands.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No commands found
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message or / for commands..."
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-400">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
