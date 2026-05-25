'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sparkles, LogIn, Users } from 'lucide-react';

const DEMO_USERS = [
  { email: 'ivan.ivanov@gazpromneft.ru', name: 'Иванов Иван', role: 'Middle Developer' },
  { email: 'elena.petrova@gazpromneft.ru', name: 'Петрова Елена', role: 'Senior ML Engineer' },
  { email: 'alexey.smirnov@gazpromneft.ru', name: 'Смирнов Алексей', role: 'Junior Developer' },
  { email: 'maria.kuznetsova@gazpromneft.ru', name: 'Кузнецова Мария', role: 'Lead Engineer · Руководитель' },
  { email: 'dmitry.volkov@gazpromneft.ru', name: 'Волков Дмитрий', role: 'Principal Architect · Руководитель' },
];

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string) => {
    setLoading(true);
    try {
      await login(email);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
            AI
          </div>
          <h1 className="text-2xl font-bold text-gray-900">T&D Platform</h1>
          <p className="text-gray-500 mt-1">AI-экосистема обучения и развития</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-primary-500" />
              Вход в систему
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Выберите пользователя для входа или продолжите как гость
            </p>
          </div>

          <div className="p-6 space-y-3">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                onClick={() => handleLogin(u.email)}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.role}</p>
                </div>
                <LogIn className="w-4 h-4 text-gray-400" />
              </button>
            ))}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            </div>

            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-secondary-400 hover:bg-secondary-50 transition text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Войти как гость</p>
                <p className="text-xs text-gray-500">Доступ ко всем модулям без персонализации</p>
              </div>
              <Sparkles className="w-4 h-4 text-secondary-500" />
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Газпром Нефть · AI-powered Training & Development Platform
        </p>
      </div>
    </div>
  );
}
