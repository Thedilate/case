'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Employee } from '@/types';
import { Settings as SettingsIcon, User, Bell, Shield, Mail, Smartphone, Moon, Save, Calendar as CalendarIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user: authUser, isGuest } = useAuth();
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Notification settings
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [courseReminders, setCourseReminders] = useState(true);
  const [meetingReminders, setMeetingReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (authUser) {
      api.users.profile(authUser.id)
        .then((u: Employee) => setUser(u))
        .finally(() => setLoading(false));
    }
  }, [authUser]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary-500" />
          Настройки
        </h1>
        <p className="text-gray-500 mt-1">Управление профилем и предпочтениями</p>
      </div>

      {isGuest && (
        <div className="mb-6 p-4 bg-secondary-50 border border-secondary-200 rounded-xl flex items-center gap-3">
          <Shield className="w-5 h-5 text-secondary-600" />
          <p className="text-sm text-secondary-800">
            Вы вошли как <strong>гость</strong>. Настройки профиля недоступны в гостевом режиме.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            Профиль
          </h2>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
              {user?.first_name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                <input
                  type="text"
                  value={user?.last_name || ''}
                  disabled={isGuest}
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <input
                  type="text"
                  value={user?.first_name || ''}
                  disabled={isGuest}
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Грейд</label>
                <input
                  type="text"
                  value={user?.grade?.name || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Команда</label>
                <input
                  type="text"
                  value={user?.team?.name || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                <input
                  type="text"
                  value={user?.status === 'active' ? 'Активен' : user?.status || ''}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-warning" />
            Уведомления
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email-уведомления</p>
                  <p className="text-xs text-gray-500">Получать дайджесты и напоминания на почту</p>
                </div>
              </div>
              <button
                onClick={() => setEmailNotif(!emailNotif)}
                disabled={isGuest}
                className={`w-12 h-6 rounded-full transition relative disabled:opacity-50 ${emailNotif ? 'bg-primary-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition ${emailNotif ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Push-уведомления</p>
                  <p className="text-xs text-gray-500">Уведомления в браузере и мобильном приложении</p>
                </div>
              </div>
              <button
                onClick={() => setPushNotif(!pushNotif)}
                disabled={isGuest}
                className={`w-12 h-6 rounded-full transition relative disabled:opacity-50 ${pushNotif ? 'bg-primary-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition ${pushNotif ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Напоминания о курсах</p>
                  <p className="text-xs text-gray-500">Уведомления о дедлайнах и прогрессе обучения</p>
                </div>
              </div>
              <button
                onClick={() => setCourseReminders(!courseReminders)}
                disabled={isGuest}
                className={`w-12 h-6 rounded-full transition relative disabled:opacity-50 ${courseReminders ? 'bg-primary-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition ${courseReminders ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Напоминания о встречах</p>
                  <p className="text-xs text-gray-500">Уведомления за 15 минут до начала встречи</p>
                </div>
              </div>
              <button
                onClick={() => setMeetingReminders(!meetingReminders)}
                disabled={isGuest}
                className={`w-12 h-6 rounded-full transition relative disabled:opacity-50 ${meetingReminders ? 'bg-primary-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition ${meetingReminders ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-500" />
            Внешний вид
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Тёмная тема</p>
              <p className="text-xs text-gray-500">Переключить интерфейс в тёмный режим</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full transition relative ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition ${darkMode ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isGuest}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saved ? 'Сохранено!' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  );
}
