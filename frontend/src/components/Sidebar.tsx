'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Calendar,
  Settings,
  LogOut,
  Sparkles,
  X,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/chat', label: 'AI-чат', icon: MessageSquare },
  { href: '/courses', label: 'Курсы', icon: BookOpen },
  { href: '/career', label: 'Карьера', icon: TrendingUp },
  { href: '/calendar', label: 'Календарь', icon: Calendar },
  { href: '/manager', label: 'Команда', icon: Users },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isGuest, logout } = useAuth();

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col shadow-xl lg:shadow-none">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            AI
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-gray-900">T&D Platform</h1>
            <p className="text-xs text-gray-500">Газпром Нефть</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            aria-label="Закрыть меню"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-600' : 'text-gray-400')} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {user ? user.first_name.charAt(0) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user ? `${user.first_name} ${user.last_name.charAt(0)}.` : 'Загрузка...'}
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              <p className="text-xs text-gray-500 truncate">
                {user?.grade?.name || 'Сотрудник'}
              </p>
              {isGuest && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-secondary-100 text-secondary-700 text-[10px] font-medium">
                  <Sparkles className="w-3 h-3" />
                  Гость
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            onClose?.();
          }}
          className="mt-2 w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="truncate">Выйти</span>
        </button>
      </div>
    </aside>
  );
}
