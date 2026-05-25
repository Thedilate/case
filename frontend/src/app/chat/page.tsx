'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { ChatMessage, ChatSession } from '@/types';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatPage() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.chat.history()
      .then((s: ChatSession) => setSession(s))
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const message = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message
    const optimisticMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };
    setSession((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, optimisticMsg] }
        : prev
    );

    try {
      const res = await api.chat.send(message, session?.id);
      // Refresh history to get proper IDs
      const updated = await api.chat.history();
      setSession(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI-наставник</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                Онлайн — отвечает на вопросы по обучению и карьере
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {session?.messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Чем могу помочь?
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Задавай вопросы про обучение, карьерный рост, онбординг или планирование встреч.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {[
                  'Какие курсы для роста до Senior?',
                  'Что делать в первую неделю?',
                  'Составь план на Q2',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {session?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-primary-500 to-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div
                className={`max-w-2xl px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-primary-500 text-white'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
                <p
                  className={`text-xs mt-2 ${
                    msg.role === 'assistant' ? 'text-gray-400' : 'text-primary-200'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-gray-100 px-5 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-8 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Напишите сообщение..."
              className="flex-1 px-5 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 hidden xl:block">
        <h3 className="font-semibold text-gray-900 mb-4">Контекст сотрудника</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Роль</p>
            <p className="text-sm font-medium text-gray-900">Backend Developer</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Грейд</p>
            <p className="text-sm font-medium text-gray-900">Middle</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Команда</p>
            <p className="text-sm font-medium text-gray-900">Platform Engineering</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Этап</p>
            <p className="text-sm font-medium text-gray-900">Непрерывное обучение</p>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Активные курсы</p>
            <div className="space-y-2">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-900">Advanced CI/CD</p>
                <p className="text-xs text-gray-500">45% пройдено</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-900">System Design</p>
                <p className="text-xs text-gray-500">0% пройдено</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
