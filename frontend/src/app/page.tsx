'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardData } from '@/types';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  BookOpen, TrendingUp, Target, Bell, Sparkles,
  Calendar, Clock, ChevronRight, Zap
} from 'lucide-react';

const COLORS = ['#177FD6', '#E2E8F0'];
const HEATMAP_COLORS = ['#e2e8f0', '#bfdbfe', '#60a5fa', '#177FD6', '#074FB1'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.dashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  const progressData = [
    { name: 'Пройдено', value: data.learning_progress.completed },
    { name: 'Осталось', value: data.learning_progress.total - data.learning_progress.completed },
  ];

  const getHeatmapColor = (count: number) => {
    if (count === 0) return HEATMAP_COLORS[0];
    if (count <= 1) return HEATMAP_COLORS[1];
    if (count <= 2) return HEATMAP_COLORS[2];
    if (count <= 3) return HEATMAP_COLORS[3];
    return HEATMAP_COLORS[4];
  };

  // Group heatmap by week for display
  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];
  data.heatmap_data.forEach((day, idx) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length) weeks.push(currentWeek);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Привет, {data.user.first_name}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Learning Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              Прогресс обучения
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={50}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {progressData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {data.learning_progress.completed}/{data.learning_progress.total}
              </p>
              <p className="text-sm text-gray-500">курсов пройдено</p>
              <p className="text-sm font-medium text-primary-600 mt-1">
                {data.learning_progress.completion_rate}% завершено
              </p>
            </div>
          </div>
        </div>

        {/* Career Track */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary-500" />
              Карьерный трек
            </h3>
          </div>
          <div className="space-y-3">
            {data.career_steps.slice(0, 4).map((step, idx) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx <= 1 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.sequence_num}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${idx <= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.position_name}
                  </p>
                  <p className="text-xs text-gray-500">{step.grade_level}</p>
                </div>
                {idx === 1 && (
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                    Текущий
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* IDP Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-success" />
              Мой IDP
            </h3>
          </div>
          <div className="space-y-4">
            {data.idp_items.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <span className="text-xs text-gray-500">{item.progress_pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${item.progress_pct}%` }}
                  />
                </div>
                {item.deadline && (
                  <p className="text-xs text-gray-500 mt-1">
                    Дедлайн: {new Date(item.deadline).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            ))}
            {data.idp_items.length === 0 && (
              <p className="text-sm text-gray-500">Нет активных целей IDP</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Widget */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-6 text-white mb-8 ai-glow">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">AI-ассистент</h3>
            <p className="text-white/80 text-sm mb-4">
              Я проанализировал твой профиль. Для роста до Senior сфокусируйся на System Design и Kubernetes.
              Рекомендую начать с курса <strong>System Design Fundamentals</strong>.
            </p>
            <div className="flex gap-3">
              <button className="bg-white text-primary-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/90 transition">
                Начать обучение
              </button>
              <button className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/30 transition">
                Подробнее
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* My Courses */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Мои курсы</h3>
            <a href="/courses" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Все <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-4">
            {data.my_courses.slice(0, 3).map((enrollment) => (
              <div key={enrollment.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {enrollment.course?.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${enrollment.progress_pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{enrollment.progress_pct}%</span>
                  </div>
                </div>
              </div>
            ))}
            {data.my_courses.length === 0 && (
              <p className="text-sm text-gray-500">Нет активных курсов</p>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Ближайшие события
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-700">МАЙ</span>
                <span className="text-lg font-bold text-primary-700 leading-none">28</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">1-on-1 с руководителем</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> 11:00 — 11:30
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary-50 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-secondary-700">МАЙ</span>
                <span className="text-lg font-bold text-secondary-700 leading-none">30</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Команда: ретроспектива</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> 14:00 — 15:00
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-success">ИЮН</span>
                <span className="text-lg font-bold text-success leading-none">03</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Дедлайн IDP: CI/CD</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> До конца дня
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-warning" />
              Уведомления
            </h3>
          </div>
          <div className="space-y-3">
            {data.notifications.map((n) => (
              <div key={n.id} className={`p-3 rounded-xl ${n.is_read ? 'bg-gray-50' : 'bg-primary-50 border border-primary-100'}`}>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500 mt-1">{n.message}</p>
              </div>
            ))}
            {data.notifications.length === 0 && (
              <p className="text-sm text-gray-500">Нет новых уведомлений</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Heatmap */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Активность за 90 дней</h3>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: getHeatmapColor(day.count) }}
                  title={`${day.date}: ${day.count} событий`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Меньше</span>
          {HEATMAP_COLORS.map((c, i) => (
            <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>Больше</span>
        </div>
      </div>
    </div>
  );
}
