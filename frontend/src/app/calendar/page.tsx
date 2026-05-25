'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Video, MapPin, Plus, X, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  type: '1on1' | 'team' | 'review' | 'workshop';
  location: string;
  participants: string[];
}

const MOCK_MEETINGS: Meeting[] = [
  { id: '1', title: '1-on-1 с руководителем', date: '2026-05-28', time: '11:00', duration: '30 мин', type: '1on1', location: 'Teams', participants: ['Руководитель'] },
  { id: '2', title: 'Ретроспектива команды', date: '2026-05-30', time: '14:00', duration: '1 час', type: 'team', location: 'Конференц-зал B', participants: ['Команда Platform'] },
  { id: '3', title: 'Performance Review Q2', date: '2026-06-05', time: '10:00', duration: '1.5 часа', type: 'review', location: 'Teams', participants: ['HR', 'Руководитель'] },
  { id: '4', title: 'Воркшоп по Kubernetes', date: '2026-06-10', time: '15:00', duration: '2 часа', type: 'workshop', location: 'Training Room', participants: ['DevOps CoE'] },
];

const TYPE_COLORS = {
  '1on1': 'bg-primary-100 text-primary-700 border-primary-200',
  'team': 'bg-success/10 text-success border-success/20',
  'review': 'bg-warning/10 text-warning border-warning/20',
  'workshop': 'bg-purple-100 text-purple-700 border-purple-200',
};

const TYPE_LABELS = {
  '1on1': '1-on-1',
  'team': 'Команда',
  'review': 'Review',
  'workshop': 'Воркшоп',
};

export default function CalendarPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate simple calendar for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 }, (_, i) => i);

  const getMeetingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return MOCK_MEETINGS.filter(m => m.date === dateStr);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-primary-500" />
            Календарь
          </h1>
          <p className="text-gray-500 mt-1">Планирование встреч и мероприятий</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition"
        >
          <Plus className="w-5 h-5" />
          Новая встреча
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {today.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
            {padding.map(i => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const meetings = getMeetingsForDate(day);
              const isToday = day === today.getDate();
              return (
                <button
                  key={day}
                  onClick={() => meetings.length > 0 && setSelectedDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                  className={`aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-start pt-1 sm:pt-2 transition ${
                    isToday ? 'bg-primary-50 border-2 border-primary-500' : 'hover:bg-gray-50 border border-transparent'
                  } ${meetings.length > 0 ? 'cursor-pointer' : ''}`}
                >
                  <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-primary-700' : 'text-gray-700'}`}>{day}</span>
                  {meetings.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 sm:mt-1">
                      {meetings.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary-500" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ближайшие встречи</h2>
          <div className="space-y-4">
            {MOCK_MEETINGS.map(meeting => (
              <div key={meeting.id} className="p-4 border border-gray-200 rounded-xl hover:border-primary-200 transition">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${TYPE_COLORS[meeting.type]}`}>
                    {TYPE_LABELS[meeting.type]}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{meeting.title}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {new Date(meeting.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {meeting.time} · {meeting.duration}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {meeting.location}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {meeting.participants.join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Новая встреча</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input type="text" placeholder="Например, 1-on-1 с менеджером" className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                  <input type="date" className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Время</label>
                  <input type="time" className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип встречи</label>
                <select className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                  <option>1-on-1</option>
                  <option>Командная встреча</option>
                  <option>Performance Review</option>
                  <option>Воркшоп</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition">
                  Создать встречу
                </button>
                <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
