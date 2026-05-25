'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CareerPath, CareerStep, IDPItem, GapAnalysisOut } from '@/types';
import { TrendingUp, Target, ChevronRight, Star, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function CareerPage() {
  const [careerPath, setCareerPath] = useState<{ path: CareerPath | null; steps: CareerStep[]; current_grade: string | null } | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisOut | null>(null);
  const [idpItems, setIdpItems] = useState<IDPItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.career.myPath(),
      api.career.gapAnalysis(),
      api.career.idp(),
    ])
      .then(([path, gap, idp]) => {
        setCareerPath(path);
        setGapAnalysis(gap);
        setIdpItems(idp);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary-500" />
          Карьерный трек
        </h1>
        <p className="text-gray-500 mt-1">Планирование развития и роста в компании</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Career Path */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            {careerPath?.path?.name || 'Карьерный путь'}
          </h2>

          <div className="space-y-4">
            {careerPath?.steps.map((step, idx) => {
              const isCurrent = step.grade_level === careerPath.current_grade;
              const isPast = careerPath.steps.findIndex(s => s.grade_level === careerPath.current_grade) > idx;
              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    isCurrent
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : isPast
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : step.sequence_num}
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-100 last:border-0 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold truncate ${isCurrent ? 'text-primary-700' : 'text-gray-900'}`}>
                        {step.position_name}
                      </h3>
                      {isCurrent && (
                        <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                          Текущая позиция
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{step.grade_level}</p>
                    {step.avg_time_months && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{step.avg_time_months} мес. на позиции
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Анализ пробелов</h2>
          {gapAnalysis && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Готовность</span>
                  <span className="font-semibold text-gray-900">{Math.round(gapAnalysis.overall_readiness * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${gapAnalysis.overall_readiness * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {gapAnalysis.gaps.map((gap, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{gap.skill}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        gap.priority === 'high' ? 'bg-error/10 text-error' :
                        gap.priority === 'medium' ? 'bg-warning/10 text-warning' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {gap.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Уровень {gap.current_level}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className="font-medium text-gray-900">{gap.required_level}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl border border-primary-100">
                <p className="text-sm text-primary-800">
                  <Star className="w-4 h-4 inline mr-1 text-primary-500" />
                  {gapAnalysis.ai_recommendations}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* IDP Section */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-secondary-500" />
          Индивидуальный план развития (IDP)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {idpItems.map((item) => (
            <div key={item.id} className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  item.status === 'active' ? 'bg-primary-50 text-primary-700' :
                  item.status === 'completed' ? 'bg-success/10 text-success' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {item.status === 'active' ? 'Активно' : item.status === 'completed' ? 'Завершено' : item.status}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 mb-3">{item.description}</p>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Прогресс</span>
                <span className="text-xs font-medium text-gray-900">{item.progress_pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${item.progress_pct}%` }} />
              </div>
              {item.deadline && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Дедлайн: {new Date(item.deadline).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
          ))}
          {idpItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Нет активных целей IDP</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
