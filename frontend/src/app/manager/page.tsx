'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Users,
  TrendingUp,
  BookOpen,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  BarChart3,
  GraduationCap,
  Zap,
} from 'lucide-react';

interface SubordinateStats {
  employee: {
    id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    grade?: { name: string };
    team?: { name: string };
    position?: string;
    status: string;
    avatar_url?: string;
  };
  stats: {
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
    avg_progress: number;
    active_idp: number;
    onboarding_progress: number | null;
    onboarding_status: string | null;
  };
}

interface ManagerDashboard {
  summary: {
    total_subordinates: number;
    avg_team_progress: number;
    onboarding_count: number;
    active_idp_count: number;
  };
  subordinates: SubordinateStats[];
}

export default function ManagerPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/manager/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
        ...(user ? { 'x-user-id': user.id } : {}),
      },
    })
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!data || data.subordinates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md p-8">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Кабинет руководителя</h2>
          <p className="text-gray-500">
            У вас пока нет подчиненных в системе. Когда сотрудники будут назначены вам, здесь отобразится их статистика.
          </p>
        </div>
      </div>
    );
  }

  const { summary, subordinates } = data;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary-500" />
          Кабинет руководителя
        </h1>
        <p className="text-gray-500 mt-1">Обзор развития команды</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Команда</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{summary.total_subordinates}</p>
          <p className="text-xs text-gray-500">человек</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-success" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Прогресс</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{summary.avg_team_progress}%</p>
          <p className="text-xs text-gray-500">средний</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-warning" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Онбординг</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{summary.onboarding_count}</p>
          <p className="text-xs text-gray-500">активных</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-secondary-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">IDP</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{summary.active_idp_count}</p>
          <p className="text-xs text-gray-500">активных целей</p>
        </div>
      </div>

      {/* Subordinates List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-500" />
            Статус команды
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {subordinates.map((sub) => (
            <div key={sub.employee.id} className="p-4 sm:p-6 hover:bg-gray-50 transition">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {sub.employee.first_name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{sub.employee.full_name}</h3>
                      <p className="text-sm text-gray-500">
                        {sub.employee.position || sub.employee.grade?.name} · {sub.employee.team?.name}
                      </p>
                    </div>
                    {sub.stats.onboarding_status === 'active' && (
                      <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        На онбординге
                      </span>
                    )}
                  </div>

                  {/* Progress Bars */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Courses */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Обучение
                        </span>
                        <span className="text-xs font-medium text-gray-900">{sub.stats.avg_progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${sub.stats.avg_progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          {sub.stats.completed_courses}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-primary-500" />
                          {sub.stats.in_progress_courses}
                        </span>
                      </div>
                    </div>

                    {/* IDP */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Target className="w-3 h-3" /> IDP
                        </span>
                        <span className="text-xs font-medium text-gray-900">{sub.stats.active_idp} активных</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: Math.min(sub.stats.active_idp, 5) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-secondary-500" />
                        ))}
                        {sub.stats.active_idp === 0 && (
                          <span className="text-[10px] text-gray-400">Нет активных целей</span>
                        )}
                      </div>
                    </div>

                    {/* Onboarding */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Онбординг
                        </span>
                        <span className="text-xs font-medium text-gray-900">
                          {sub.stats.onboarding_progress !== null ? `${sub.stats.onboarding_progress}%` : '—'}
                        </span>
                      </div>
                      {sub.stats.onboarding_progress !== null ? (
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success rounded-full"
                            style={{ width: `${sub.stats.onboarding_progress}%` }}
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">Не назначен</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
