'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Course, CourseCategory } from '@/types';
import { Search, Filter, BookOpen, Star, Clock, BarChart3, Play, X, SlidersHorizontal } from 'lucide-react';

const DIFFICULTIES = [
  { value: 'beginner', label: 'Junior' },
  { value: 'intermediate', label: 'Middle' },
  { value: 'advanced', label: 'Senior' },
];

const FORMATS = [
  { value: 'video', label: 'Видео' },
  { value: 'interactive', label: 'Интерактив' },
  { value: 'text', label: 'Текст' },
  { value: 'webinar', label: 'Вебинар' },
  { value: 'simulation', label: 'Симуляция' },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'my'>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    Promise.all([
      api.courses.list(),
      api.courses.recommended(),
    ]).then(([all, rec]) => {
      setCourses(all);
      setRecommended(rec);
      const cats = new Map<string, CourseCategory>();
      all.forEach((c: Course) => {
        if (c.category) cats.set(c.category.id, c.category);
      });
      setCategories(Array.from(cats.values()));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedCategory) params.category_id = selectedCategory;
    if (selectedDifficulty) params.difficulty = selectedDifficulty;
    if (selectedFormat) params.format = selectedFormat;
    if (search) params.search = search;

    api.courses.list(params).then(setCourses);
  }, [selectedCategory, selectedDifficulty, selectedFormat, search]);

  const displayedCourses = activeTab === 'recommended' ? recommended : courses;

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'beginner': return 'bg-success/10 text-success';
      case 'intermediate': return 'bg-warning/10 text-warning';
      case 'advanced': return 'bg-error/10 text-error';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDifficultyLabel = (d: string) => {
    switch (d) {
      case 'beginner': return 'Junior';
      case 'intermediate': return 'Middle';
      case 'advanced': return 'Senior';
      default: return d;
    }
  };

  const getFormatIcon = (f: string) => {
    switch (f) {
      case 'video': return <Play className="w-3 h-3" />;
      default: return <BookOpen className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full relative">
      {/* Mobile filter overlay */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setShowMobileFilters(false)}
        />
      )}

      {/* Sidebar Filters */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:transform-none ${
        showMobileFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Фильтры</h2>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="lg:hidden ml-auto w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск курсов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Категория</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === ''}
                onChange={() => setSelectedCategory('')}
                className="text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Все категории</span>
            </label>
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat.id}
                  onChange={() => setSelectedCategory(cat.id)}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Уровень</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                checked={selectedDifficulty === ''}
                onChange={() => setSelectedDifficulty('')}
                className="text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Все уровни</span>
            </label>
            {DIFFICULTIES.map((d) => (
              <label key={d.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  checked={selectedDifficulty === d.value}
                  onChange={() => setSelectedDifficulty(d.value)}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Формат</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={selectedFormat === ''}
                onChange={() => setSelectedFormat('')}
                className="text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Все форматы</span>
            </label>
            {FORMATS.map((f) => (
              <label key={f.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={selectedFormat === f.value}
                  onChange={() => setSelectedFormat(f.value)}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры
          </button>
        </div>
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: 'all' as const, label: 'Каталог' },
            { key: 'recommended' as const, label: 'AI Рекомендации' },
            { key: 'my' as const, label: 'Мои курсы' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* AI Explanation for recommended */}
        {activeTab === 'recommended' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl">
            <p className="text-sm text-primary-800">
              <strong>AI-рекомендации</strong> подобраны на основе твоего профиля, текущих скиллов и карьерного трека.
              Приоритет отдан курсам, которые помогут закрыть пробелы для роста до Senior.
            </p>
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary-200 transition cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-gray-300 group-hover:text-primary-300 transition" />
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                    {getDifficultyLabel(course.difficulty)}
                  </span>
                </div>
                {course.format === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-600 ml-0.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                    {getFormatIcon(course.format)}
                    {course.format}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {Math.round(course.duration_min / 60)}ч
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm font-medium text-gray-900">{course.rating_avg}</span>
                    <span className="text-xs text-gray-500">({course.rating_count})</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {course.completion_count} завершили
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayedCourses.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Курсы не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(selectedCourse.difficulty)}`}>
                      {getDifficultyLabel(selectedCourse.difficulty)}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                      {getFormatIcon(selectedCourse.format)}
                      {selectedCourse.format}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">{selectedCourse.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{Math.round(selectedCourse.duration_min / 60)}ч</p>
                  <p className="text-xs text-gray-500">Длительность</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <Star className="w-5 h-5 text-warning mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{selectedCourse.rating_avg}</p>
                  <p className="text-xs text-gray-500">Рейтинг</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <BarChart3 className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{selectedCourse.completion_count}</p>
                  <p className="text-xs text-gray-500">Завершили</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition">
                  Записаться на курс
                </button>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
