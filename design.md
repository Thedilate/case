# Design Document: AI-экосистема T&D ИТ-кластера "Газпром Нефти"

**Версия:** 1.0  
**Дата:** 2025-01-15  
**Автор:** Architecture & Design Team  
**Проект:** AI-powered Training & Development Platform

---

## 1. Архитектура системы

### 1.1 Общая архитектура (микросервисы)

Система построена на микросервисной архитектуре с доменно-ориентированным разбиением (DDD). Event-Driven Architecture с CQRS для операционных и аналитических нагрузок.

**Архитектурные слои:**

| Слой | Компоненты | Технологии |
|------|-----------|------------|
| Client Layer | Web App, Mobile App, PWA | Next.js 14, React Native |
| Gateway Layer | API Gateway, Load Balancer, WAF | Kong, NGINX, ModSecurity |
| Service Mesh | mTLS, Traffic Management | Istio |
| Core Services | 9 микросервисов | FastAPI (Python) |
| AI/ML Services | 5 агентов + PII Guard + RAG | LangGraph, LLM, Qdrant |
| Data Layer | 7 хранилищ | PostgreSQL HA, Qdrant, Redis, Kafka, ClickHouse, MinIO, ES |
| Integration Layer | 6+ внешних систем | REST API, LDAP, Graph API |

### 1.2 Компоненты архитектуры

#### Core Services

| Сервис | Ответственность | Технологии | Репликация |
|--------|----------------|------------|------------|
| User Service | Пользователи, профили, оргструктура | FastAPI, PostgreSQL | 3+ pods |
| Content Service | Каталог курсов, поиск | FastAPI, PostgreSQL, ES | 3+ pods |
| Learning Service | Записи, прогресс, оценки | FastAPI, PostgreSQL | 3+ pods |
| Career Service | Карьерные треки, компетенции | FastAPI, PostgreSQL | 2+ pods |
| Comm Service | Уведомления, чат, календари | FastAPI, WebSocket | 2+ pods |
| Analytics Service | Аналитика, отчеты, прогнозы | FastAPI/Go, ClickHouse | 2+ pods |
| Onboarding Service | Планы адаптации, чек-листы | FastAPI, PostgreSQL | 2+ pods |
| Gamification Service | Баллы, бейджи, лидерборды | FastAPI, Redis | 2+ pods |
| Admin Service | Настройки, RBAC, аудит | FastAPI, PostgreSQL | 2+ pods |

#### AI/ML Services

| Сервис | Назначение | Технологии |
|--------|-----------|------------|
| LLM Gateway | Управление доступом к LLM, routing, fallback | vLLM / TGI |
| RAG Pipeline | Retrieval-Augmented Generation | LangChain, Qdrant, BGE-M3 |
| Tutor Agent | AI-наставник | LangGraph, LLM, RAG, Tools |
| Recommender Agent | Рекомендации контента | Two-Tower Model, LightFM, LLM Ranker |
| Scheduling Agent | Планирование встреч | LangGraph, Calendar Adapters |
| Analytics Agent | Аналитика и прогнозы | CatBoost, XGBoost, ClickHouse |
| Admin Agent | Административные задачи | LangGraph, RBAC Tools |
| PII Guard | Защита ПД | Presidio, кастомные правила |

#### Data Layer

| Компонент | Назначение | HA-стратегия |
|-----------|-----------|-------------|
| PostgreSQL (Patroni) | Основные данные | Patroni + streaming replication, 3 nodes |
| Qdrant / Milvus | Векторный поиск | Кластер: 3+ nodes |
| Redis Cluster | Кэш, сессии, rate limiting | 6 nodes (3m + 3r) |
| Kafka | Event streaming | 3 brokers, RF=3 |
| ClickHouse | Аналитика | 2 shards x 2 replicas |
| MinIO | Object storage | Distributed, erasure coding |
| Elasticsearch | Полнотекстовый поиск | 3 nodes |

### 1.3 Потоки данных

**Поток 1: Онбординг нового сотрудника**
```
HR создает сотрудника → User Service → Kafka (employee.created) 
→ Onboarding Service (генерация плана) → Tutor Agent (персонализация)
→ Content Service (назначение курсов) → Comm Service (welcome email)
→ Analytics Service (событие)
```

**Поток 2: AI-рекомендация курсов**
```
Запрос сотрудника → Learning Service (профиль скиллов)
→ Recommender Agent: Stage 1 (Two-Tower Model, top-200) 
→ Stage 2 (LLM Ranker, top-10 с обоснованием)
→ Content Service (детали) → WebSocket (ответ) 
→ Analytics Service (feedback loop)
```

**Поток 3: Tutor Agent — обработка вопроса**
```
Вопрос в чат → WebSocket → PII Guard → Tutor Agent (LangGraph)
→ Classifier (intent) → Router: RAG Pipeline / Recommender / Career / Scheduling
→ PII Guard (output) → Formatter → WebSocket (ответ) → Kafka (лог)
```

**Поток 4: Batch-аналитика (ежедневно, 02:00 MSK)**
```
Kafka events → ClickHouse (агрегация) → ML-модели (CatBoost/XGBoost)
→ Прогнозы оттока, вовлеченности → PostgreSQL (кэш) → Дашборды
```

---

## 2. Дизайн AI-агентов

### 2.1 Архитектура агентов

**Cognitive Agent Architecture** — единая архитектура для всех агентов:

| Компонент | Технология | Описание |
|-----------|-----------|----------|
| Orchestrator | LangGraph | FSM-управление workflow |
| LLM Core | GigaChat MAX PRO / Saiga / Llama 3 | Reasoning, генерация |
| Memory | Redis + PostgreSQL + Qdrant | Краткосрочная, долгосрочная, эпизодическая |
| RAG | LangChain + Qdrant | Retrieval-Augmented Generation |
| Tools | MCP (Model Context Protocol) | Интерфейс для инструментов |
| Guardrails | PII Guard + Content Filter | Защита от утечек |
| Reflection | Self-critique loop | Коррекция ответов |

### 2.2 Описание каждого агента

#### Tutor Agent (Агент-наставник)

```yaml
agent:
  name: Tutor Agent
  code: tutor_agent
  назначение: Персональный AI-наставник сотрудника

  input: [user_query, user_id, session_id, conversation_history]

  context_sources:
    - employee_profile: full_name, role, grade, team, competencies, onboarding_stage, idp, learning_history
    - org_context: manager, teammates, center_of_competence
    - rag_context: top_k_documents из базы знаний

  workflow (LangGraph nodes):
    1. intent_classifier: intent ∈ [onboarding, learning, career, tech_help, admin, other]
    2. context_assembler: fetch_profile + fetch_history(limit=10) + retrieve_documents(top_k=5)
    3. reasoning_engine: routing по intent → handler
    4. response_generator: LLM prompt с контекстом → markdown
    5. guardrails: pii_scan + content_safety + hallucination_check
    6. output_formatter: quick_actions + related_questions + sources

  tools:
    - search_knowledge_base, get_course_info, get_career_path
    - create_learning_plan, schedule_meeting, escalate_to_human

  memory:
    short_term: Redis (TTL: 24h)
    long_term: PostgreSQL (история диалогов)
    episodic: Qdrant (важные факты о сотруднике)

  guardrails:
    - input_pii_detection, output_pii_filter
    - topic_restriction (только T&D)
    - hallucination_prevention (citation required)
    - tone: профессиональный, поддерживающий
```

#### Recommender Agent (Агент-рекомендатель)

**Двухэтапная архитектура:**

**Stage 1 — Candidate Generation:**

| Модель | Алгоритм | Weight |
|--------|----------|--------|
| Two-Tower Model | Neural Collaborative Filtering | 50% |
| Content-Based | Cosine similarity on skill embeddings | 30% |
| Popularity Boost | Trending + team signals | 20% |

**Stage 2 — LLM Ranking:**
- Вход: top-200 candidates + user_context
- LLM анализирует профиль и отранжирует top-10 с обоснованием
- Выход: ranked_list + explanation + learning_path_suggestion

**Feedback Loop:** impression(+0.1), click(+1.0), enroll(+5.0), complete(+10.0), rate(rating*2). Переобучение: еженедельно.

#### Scheduling Agent (Агент-планировщик)

```yaml
workflow:
  1. parse_request: participants, duration, preferred_time, meeting_type
  2. collect_availability: get_calendar_freebusy(MS 365 / Google API)
  3. find_optimal_slot: constraint satisfaction (минимум конфликтов, часовые пояса)
  4. generate_agenda: LLM на основе типа встречи, контекста, целей
  5. create_event: calendar API + invitations
  6. post_meeting: summary + action_items + tasks

meeting_types:
  one_on_one:         {duration: 30min, frequency: weekly,     agenda: [чек-ин, прогресс, обратная связь, планы]}
  performance_review:  {duration: 60min, frequency: semi-annual, agenda: [достижения, развитие, цели, обратная связь]}
  onboarding_checkin: {duration: 30min, frequency: weekly(3mo), agenda: [адаптация, вопросы, прогресс, шаги]}
  career_discussion:  {duration: 45min, frequency: quarterly,  agenda: [цели, компетенции, план развития]}
```

#### Analytics Agent (Агент-аналитик)

```yaml
components:
  batch_analytics: ежедневно 02:00 MSK: ClickHouse → агрегация → ML → alerts
  real_time_analytics: Kafka streams → real-time дашборды

  predictive_models:
    churn_prediction: CatBoost, target=P(уход в 90д), threshold: high>0.7, medium>0.4
    engagement_scoring: XGBoost, output=0-100, segments: [>75, 50-75, 25-50, <25]
    learning_effectiveness: pretest vs posttest + проектные метрики + feedback менеджера

  nlp_analytics:
    sentiment_analysis: ruBERT-base на отзывы и чек-ины
    topic_modeling: BERTopic на запросы к Tutor Agent
```

#### Admin Agent (Агент-администратор)

```yaml
permissions: [read: all_employee_data, write: assignments/plans/config, admin: rbac/workflows]

capabilities:
  batch_operations: массовое назначение курсов, пакетный онбординг, compliance-отчеты
  workflow_automation:
    - onboarding_workflow: new_employee → [plan, courses, notify, checkins]
    - promotion_workflow: grade_change → [requirements, courses, notify]
    - compliance_workflow: deadline_approaching → [reminder, escalate, report]
  configuration: course_catalog, career_paths, RBAC, workflows
```

### 2.3 Сценарии взаимодействия агентов

#### Сценарий 1: Онбординг нового сотрудника
```
HR создает сотрудника → Admin Agent (план из шаблона) → Tutor Agent (персонализация)
→ Tutor Agent (welcome сообщение) → Recommender Agent (must-have курсы)
→ Scheduling Agent (1-on-1, buddy intro) → Tutor Agent (Day 1 чек-ин)
→ Analytics Agent (tracking) → [если отставание] Tutor Agent (напоминание)
→ [если риск отказа] Analytics Agent → Admin Agent → HR + Руководитель
```

#### Сценарий 2: Рекомендации по развитию
```
"Хочу вырасти до Senior" → Tutor Agent → Career Service (трек Senior)
→ Recommendation Agent: gap_analysis → Two-Tower (top-200) → LLM Rank (top-10)
→ Tutor Agent (форматирование) → предложение создать IDP → Admin Agent (создание IDP)
```

#### Сценарий 3: HR запрашивает аналитику
```
"Аналитика по Platform Engineering за Q4" → Analytics Agent
→ ClickHouse + User Service + Learning Service → compute metrics
→ LLM insights → generate_report → PDF + дашборд
```

#### Сценарий 4: AI-планирование встречи
```
"Спланируй 1-on-1 с менеджером на следующей неделе" → Tutor Agent → Scheduling Agent
→ parse(participants, type, duration) → get_freebusy(MS 365) → find_optimal_slot
→ fetch_context(прогресс, цели) → generate_agenda(LLM) → create_event
→ Comm Service (уведомления)
```


---

## 3. Пользовательский интерфейс

### 3.1 Дизайн-система

#### Цветовая палитра

```css
:root {
  /* Primary — Корпоративный синий */
  --color-primary-500: #177FD6; --color-primary-600: #1477D0;
  --color-primary-700: #116CC8; --color-primary-800: #0D62C0;
  --color-primary-900: #074FB1;

  /* Secondary — Теплый акцент */
  --color-secondary-500: #FF8C42; --color-secondary-600: #F57A2D;

  /* Semantic */
  --color-success: #22C55E; --color-warning: #EAB308;
  --color-error: #EF4444; --color-info: #3B82F6;

  /* Neutral */
  --color-gray-50: #F8FAFC; --color-gray-100: #F1F5F9;
  --color-gray-200: #E2E8F0; --color-gray-300: #CBD5E1;
  --color-gray-400: #94A3B8; --color-gray-500: #64748B;
  --color-gray-600: #475569; --color-gray-700: #334155;
  --color-gray-800: #1E293B; --color-gray-900: #0F172A;

  /* AI Accent */
  --color-ai-gradient: linear-gradient(135deg, #177FD6 0%, #8B5CF6 100%);
  --color-ai-glow: rgba(23, 127, 214, 0.15);
}
```

#### Типографика

| Элемент | Шрифт | Размер | Вес | Интервал |
|---------|-------|--------|-----|----------|
| H1 (Page Title) | Inter | 32px | 700 (Bold) | -0.02em |
| H2 (Section) | Inter | 24px | 600 (SemiBold) | -0.01em |
| H3 (Card Title) | Inter | 18px | 600 (SemiBold) | 0 |
| H4 (Subsection) | Inter | 16px | 600 (SemiBold) | 0 |
| Body Large | Inter | 16px | 400 (Regular) | 0 |
| Body | Inter | 14px | 400 (Regular) | 0 |
| Caption | Inter | 12px | 400 (Regular) | 0.01em |
| Button | Inter | 14px | 500 (Medium) | 0 |
| Data/Numbers | Inter / JetBrains Mono | 14-24px | 600 | -0.02em |

**Line height:** Headings 1.2, Body 1.5, Captions 1.4

#### UI Kit Компоненты

| Компонент | База | Кастомизация |
|-----------|------|-------------|
| Button | Ant Design | 3 варианта: primary, secondary, ghost |
| Card | Ant Design + custom | Скругление 12px, level-based тень |
| Input / Select | Ant Design | Корпоративная тема, inline-валидация |
| Table | Ant Design | Sortable, filterable, expandable |
| Modal | Ant Design | sm (400px), md (600px), lg (900px) |
| Tabs | Ant Design | default, card, pills |
| Progress | Ant Design + custom | Doughnut, linear, stepped |
| Chart | Recharts / ECharts | 10+ типов |
| Chat Bubble | Custom | Markdown, code highlight, action buttons |
| Timeline | Custom | Вертикальный с прогрессом |
| AI Typing Indicator | Custom | Анимация, gradient glow |
| Skill Bar | Custom | Уровни 1-5, цветовые зоны |
| Org Tree | Custom + D3 | Интерактивное дерево |
| Heatmap Calendar | ECharts | GitHub-style |

#### Принципы дизайна

1. **Mobile-first responsive** — breakpoints: 320px, 768px, 1024px, 1440px, 1920px
2. **Accessibility** — WCAG 2.1 Level AA, keyboard navigation, screen reader support
3. **Performance** — < 3s FCP, < 5s TTI
4. **Consistency** — единый дизайн-токен во всех модулях
5. **AI-first** — AI-элементы: gradient glow, typing indicators, subtle animations

### 3.2 Главная страница (Дашборд)

**Layout:** Sidebar navigation (240px) + Main content area (fluid)

**Компоненты:**

| # | Компонент | Размер | Описание |
|---|-----------|--------|----------|
| 1 | Welcome Header | Full width | Приветствие + дата + Quick Actions |
| 2 | Learning Progress | 1/3 | Doughnut chart, "X/Y курсов", drill-down |
| 3 | Career Track | 1/3 | Мини-визуализация пути, прогресс к следующей позиции |
| 4 | IDP Status | 1/3 | Прогресс-бар, дедлайны, % выполнения |
| 5 | AI Assistant Widget | Full width | Проактивные рекомендации Tutor Agent, inline-кнопки |
| 6 | My Courses | 1/3 | Список активных курсов с прогресс-барами |
| 7 | Upcoming Events | 1/3 | Мини-календарь, 3 ближайших события |
| 8 | Team Activity | 1/3 | Лента активности команды (анонимизированная) |
| 9 | Weekly Heatmap | Full width | GitHub-style календарь активности |

### 3.3 Экран онбординга

**Layout:** Vertical tabs (Overview, My Plan, Checklist, Courses, Team, AI Mentor) + Content

**Компоненты:**

| Компонент | Описание |
|-----------|----------|
| Timeline | 4 фазы: Предвход, Первая неделя, Первый месяц, Первые 3 мес. Цвета: зеленый/синий/серый |
| Checklist | Иерархический список, 3 состояния (done/in_progress/todo), auto-check, ручное подтверждение |
| AI Mentor Chat | Slide-over панель (400px), контекст этапа, быстрые вопросы (chips), markdown |
| Buddy Card | Фото, контакты, экспертиза, кнопки "Написать" / "Запланировать встречу" |
| Progress Analytics | Прогресс по неделям, сравнение с командой, AI-прогноз завершения |

### 3.4 Экран обучения (Каталог курсов)

**Layout:** Sidebar filters (280px) + Main content

**Табы:** AI Recommended | My Courses | Catalog | Learning Paths | Skills

**Фильтры sidebar:**
- Категория (50 ЦК: Data Engineering, ML/AI, Backend, Frontend, DevOps...)
- Формат: Video / Interactive / Text / Webinar / Simulation
- Уровень: Junior / Middle / Senior
- Длительность: range slider (0 - 40+ часов)
- Рейтинг: 4+ звезд

**Карточка курса:**
- Thumbnail (16:9) с play overlay
- Badges: формат, длительность, сложность
- Title + категория · уровень · длительность
- Progress bar (если начат)
- Tags технологий: [K8s] [Docker] [CI/CD]
- Actions: Continue Learning / Enroll / Details
- Rating: stars + count

**AI-ассистент:** Диалоговый поиск естественным языком, top-3 результата с обоснованием, inline-кнопки Enroll/Compare/Show Path.

**Learning Path визуализация:** Последовательность шагов, статусы (completed/in_progress/locked), lock-зависимости, суммарная длительность.

### 3.5 Экран карьерного трека

**Табы:** My Career | Team Careers | Succession Planning | Analytics

**Компоненты:**

| Компонент | Описание |
|-----------|----------|
| Career Path Graph | D3.js: узлы=позиции, ребра=переходы. Текущая (синий glow), целевая (зеленый). Клик → детали |
| Skills Matrix | Радар-чарт: текущий vs требуемый. Таблица: компетенция→текущий→требуемый→gap→рекомендация |
| Gap Analysis | AI-список пробелов: курсы, проекты, менторство, временная оценка, приоритизация must/should/could |
| IDP Timeline | Квартальные вкладки (Q1-Q4), чекбоксы целей, прогресс-бары, дедлайны |
| Succession Matrix | Позиция→преемники→readiness score. Уровни: Ready (зеленый), 1-2yr (желтый), Potential (серый) |

### 3.6 Экран коммуникаций

**Табы:** Unified Inbox | Calendar | Contacts | Meeting Planner

**Unified Inbox:**
- AI-приоритизация: High (красный) / Medium (желтый) / Low (серый)
- Inline-действия: Записаться / Подтвердить / Отложить
- Группировка по типу и дате, полнотекстовый поиск

**AI Meeting Planner:**
- NL-интерфейс: "Plan 1-on-1 with manager next week"
- Распознавание: participants, time, meeting type
- Показ слота + AI-generated повестки перед подтверждением
- One-click: Confirm / Reschedule / Edit Agenda

**Contact Directory:** Поиск по имени/экспертизе/команде. Карточка: фото, роль, экспертиза, занятость, кнопки связи.

### 3.7 Экран аналитики

**Табы:** Overview | Learning | Engagement | Career | Compliance | Custom

**Компоненты:**

| # | Компонент | Тип |
|---|-----------|-----|
| 1 | KPI Cards | Summary: Total Employees, Avg Completion, Engagement Score + trend arrows |
| 2 | Learning Coverage | Grouped bar chart по ЦК: current vs target vs previous period |
| 3 | Completion Trend | Line chart 6-12 мес, множественные линии по ЦК/грейдам |
| 4 | Engagement Distribution | Donut: Highly Engaged (>75) / Engaged (50-75) / At Risk (25-50) / Disengaged (<25) |
| 5 | Churn Risk Table | Sortable table, Risk Score color-coded, AI-причины, кнопки actions |
| 6 | Skills Heatmap | Matrix: команды x навыки, интенсивность = средний уровень |

### 3.8 Мобильная версия

| Компонент | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Navigation | Sidebar (240px) | Collapsible sidebar | Bottom tab bar (5 tabs) |
| Dashboard | 3-column grid | 2-column grid | Single column stack |
| Course Cards | 4 per row | 2 per row | 1 per row |
| Chat | Side panel | Bottom sheet | Full screen |
| Analytics | Full charts | Simplified | Key metrics + drill-down |
| Career Path | Horizontal graph | Vertical scroll | Vertical simplified |

**Mobile features:** Push-уведомления, Offline mode, Voice input, Quick actions bottom sheet, Biometric auth (Face ID/Touch ID).

**Bottom tabs:** [Home] [Learn] [AI Chat] [Career] [Profile]



---

## 4. Модели данных

### 4.1 ER-диаграмма (основные сущности)

**Core Entities:**

```
employees (PK: id) ←→ teams (PK: id) ←→ departments (PK: id)
  ↑ 1:N                    ↑ 1:N
  │                        │
skill_records (FK: employee_id, skill_id) ←→ skills (PK: id)
enrollments (FK: employee_id, course_id) ←→ courses (PK: id)
idp_items (FK: employee_id) ←→ career_paths/steps
career_paths (PK: id) ←→ career_steps (FK: path_id)
onboarding_plans (FK: employee_id, template_id) ←→ onboarding_tasks (FK: plan_id)
```

**Analytics Entities:** event_log → engagement_scores → churn_risk_scores

**Gamification Entities:** points, badges, leaderboards

**Communication Entities:** notifications, messages, meetings

### 4.2 Описание ключевых таблиц

#### employees

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| id | UUID | PK | auto-generate |
| email | VARCHAR(255) | Корп. email | UNIQUE, NOT NULL |
| full_name | VARCHAR(255) | ФИО | NOT NULL |
| grade_id | UUID | FK → grades | INDEX |
| team_id | UUID | FK → teams | INDEX |
| manager_id | UUID | FK → employees (self-ref) | INDEX |
| hire_date | DATE | Дата выхода | NOT NULL |
| status | ENUM | active, onboarding, inactive, terminated | DEFAULT 'onboarding' |
| ad_login | VARCHAR(100) | Логин AD | UNIQUE |
| phone | VARCHAR(20) | Телефон | |
| city_id | UUID | FK → cities | INDEX |
| location_id | UUID | FK → locations | INDEX |
| created_at | TIMESTAMP | | auto |
| updated_at | TIMESTAMP | | auto |

**Индексы:** email, ad_login, team_id, manager_id, status, grade_id

#### courses

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| id | UUID | PK | auto-generate |
| title | VARCHAR(500) | Название | NOT NULL |
| description | TEXT | Описание | |
| content | TEXT | Полный контент (для RAG) | |
| duration_min | INT | Длительность, мин | NOT NULL |
| difficulty | ENUM | beginner, intermediate, advanced | NOT NULL |
| format | ENUM | video, interactive, text, webinar, simulation | NOT NULL |
| provider_id | UUID | FK → course_providers | INDEX |
| external_id | VARCHAR(255) | ID во внешней LMS | |
| status | ENUM | draft, published, archived | DEFAULT 'draft' |
| rating_avg | DECIMAL(3,2) | Средний рейтинг | DEFAULT 0 |
| rating_count | INT | Количество оценок | DEFAULT 0 |
| completion_count | INT | Количество завершений | DEFAULT 0 |
| created_at | TIMESTAMP | | auto |
| updated_at | TIMESTAMP | | auto |

**Индексы:** title (GIN trigram), difficulty, format, status, provider_id  
**Full-text:** title + description → Elasticsearch

#### enrollments

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| id | UUID | PK | auto-generate |
| employee_id | UUID | FK → employees | NOT NULL, INDEX |
| course_id | UUID | FK → courses | NOT NULL, INDEX |
| status | ENUM | enrolled, in_progress, completed, dropped | DEFAULT 'enrolled' |
| progress_pct | INT | Процент | DEFAULT 0, CHECK 0-100 |
| enrolled_at | TIMESTAMP | | auto |
| started_at | TIMESTAMP | | |
| completed_at | TIMESTAMP | | |
| dropped_at | TIMESTAMP | | |
| score | INT | Оценка 0-100 | |
| source | ENUM | manual, auto_assigned, ai_recommended, manager_assigned | |

**Индексы:** employee_id, course_id, status, (employee_id, status)  
**Constraints:** UNIQUE(employee_id, course_id, dropped_at IS NULL)

#### skill_records

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| id | UUID | PK | auto-generate |
| employee_id | UUID | FK → employees | NOT NULL, INDEX |
| skill_id | UUID | FK → skills | NOT NULL, INDEX |
| level | SMALLINT | 1-5 (novice→expert) | NOT NULL, CHECK 1-5 |
| assessed_at | TIMESTAMP | Дата оценки | NOT NULL |
| source | ENUM | self_assessment, manager_review, 360_review, test, certification | NOT NULL |
| assessment_id | UUID | FK → assessments | |
| confidence | DECIMAL(3,2) | Уверенность AI | DEFAULT 1.0 |

**Индексы:** (employee_id, skill_id), skill_id, level  
**Constraints:** UNIQUE(employee_id, skill_id)

#### career_paths

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| id | UUID | PK | auto-generate |
| name | VARCHAR(255) | Название трека | NOT NULL |
| description | TEXT | Описание | |
| category | ENUM | technical, management, hybrid | NOT NULL |
| center_of_competence_id | UUID | FK → centers_of_competence | INDEX |
| is_active | BOOLEAN | | DEFAULT true |

#### career_steps

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| id | UUID | PK | auto-generate |
| path_id | UUID | FK → career_paths | NOT NULL, INDEX |
| position_name | VARCHAR(255) | Название позиции | NOT NULL |
| grade_level | VARCHAR(50) | Уровень грейда | NOT NULL |
| sequence_num | SMALLINT | Порядковый номер | NOT NULL |
| skill_requirements | JSONB | {skill_id: min_level} | NOT NULL |
| avg_time_months | INT | Среднее время на позиции | |
| salary_range_min | INT | Мин ЗП | |
| salary_range_max | INT | Макс ЗП | |

#### onboarding_plans

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| id | UUID | PK | auto-generate |
| employee_id | UUID | FK → employees | NOT NULL, UNIQUE, INDEX |
| template_id | UUID | FK → onboarding_templates | INDEX |
| status | ENUM | not_started, active, completed, extended | DEFAULT 'not_started' |
| start_date | DATE | | NOT NULL |
| target_end_date | DATE | | NOT NULL |
| actual_end_date | DATE | | |
| progress_pct | INT | | DEFAULT 0 |
| ai_personalization | JSONB | Персонализация от AI | |

#### onboarding_tasks

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| id | UUID | PK | auto-generate |
| plan_id | UUID | FK → onboarding_plans | NOT NULL, INDEX |
| title | VARCHAR(255) | Название задачи | NOT NULL |
| description | TEXT | Описание | |
| category | ENUM | mandatory, optional, role_specific | NOT NULL |
| status | ENUM | not_started, in_progress, completed, skipped | DEFAULT 'not_started' |
| due_date | DATE | | |
| completed_at | TIMESTAMP | | |
| assigned_by | ENUM | system, manager, ai | DEFAULT 'system' |

#### event_log (ClickHouse)

| Поле | Тип | Описание |
|------|-----|----------|
| event_id | UUID | PK |
| event_time | DateTime64(3) | Время события |
| user_id | UUID | ID пользователя |
| session_id | UUID | ID сессии |
| event_type | LowCardinality(String) | page_view, course_start, course_complete, chat_message, search |
| entity_type | LowCardinality(String) | course, page, chat, meeting |
| entity_id | UUID | ID сущности |
| metadata | String (JSON) | Доп. данные |
| device_type | LowCardinality(String) | desktop, mobile, tablet |
| browser | LowCardinality(String) | |
| os | LowCardinality(String) | |

**Partitioning:** by toYYYYMM(event_time)  
**Ordering:** (event_time, user_id, event_type)  
**TTL:** 36 месяцев

#### Vector collections (Qdrant)

| Коллекция | Размер | Метрика | Описание |
|-----------|--------|---------|----------|
| course_embeddings | 1024 | Cosine | Курсы (title + description + content) |
| knowledge_base_docs | 1024 | Cosine | Документы базы знаний |
| skill_embeddings | 1024 | Cosine | Навыки |
| chat_memory | 1024 | Cosine | История чатов |



---

## 5. API Design

### 5.1 REST API Endpoints

#### User Service (`/api/v1/users`)

```
GET    /api/v1/users                      → Список (paginated, filterable)
GET    /api/v1/users/{id}                 → Профиль
GET    /api/v1/users/{id}/profile         → Расширенный профиль (+skills, team, manager)
GET    /api/v1/users/{id}/skills          → Навыки
POST   /api/v1/users/{id}/skills          → Добавить/обновить навык
GET    /api/v1/users/{id}/manager         → Руководитель
GET    /api/v1/users/{id}/team            → Члены команды
GET    /api/v1/users/{id}/subordinates    → Подчиненные
GET    /api/v1/users/me                   → Текущий пользователь
PATCH  /api/v1/users/{id}                 → Обновление профиля
GET    /api/v1/users/search?q=            → Поиск

POST   /api/v1/users/sync/ad              → Синхронизация с AD
POST   /api/v1/users/sync/hr              → Синхронизация с HR
```

**Response (GET /api/v1/users/{id}):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "ivan.ivanov@gazpromneft.ru",
  "full_name": "Иванов Иван Иванович",
  "first_name": "Иван",
  "last_name": "Иванов",
  "grade": {"id": "...", "name": "Middle", "level": 3},
  "team": {"id": "...", "name": "Platform Engineering", "department": "Infrastructure", "center_of_competence": "DevOps"},
  "manager": {"id": "...", "full_name": "Петров Алексей Сергеевич"},
  "hire_date": "2024-09-15",
  "status": "active",
  "city": {"id": "...", "name": "Санкт-Петербург"},
  "avatar_url": "https://...",
  "created_at": "2024-09-15T09:00:00Z",
  "updated_at": "2025-01-10T14:30:00Z"
}
```

#### Content Service (`/api/v1/courses`)

```
GET    /api/v1/courses                    → Каталог (paginated, filterable)
GET    /api/v1/courses/{id}               → Детали курса
POST   /api/v1/courses                    → Создание (admin)
PATCH  /api/v1/courses/{id}               → Обновление (admin)
DELETE /api/v1/courses/{id}               → Архивирование (admin)
GET    /api/v1/courses/search             → Полнотекстовый поиск
POST   /api/v1/courses/semantic-search    → Semantic search (AI)
GET    /api/v1/courses/recommended        → AI-рекомендации
GET    /api/v1/courses/{id}/similar       → Похожие курсы
POST   /api/v1/courses/{id}/rate          → Оценка
GET    /api/v1/courses/{id}/reviews       → Отзывы

GET    /api/v1/categories                 → Категории
GET    /api/v1/providers                  → Провайдеры
```

**Query params (GET /api/v1/courses):** `?page=1&limit=20&category_id=...&difficulty=intermediate&format=video&duration_min=30&duration_max=480&search=kubernetes&sort=rating&order=desc`

**Request (POST /api/v1/courses/semantic-search):**
```json
{
  "query": "как настроить CI/CD для Java микросервисов в Kubernetes",
  "filters": {"difficulty": ["intermediate", "advanced"], "format": ["video", "interactive"], "max_duration_min": 600},
  "top_k": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "course": { /* ... */ },
      "relevance_score": 0.92,
      "ai_explanation": "Курс напрямую покрывает CI/CD для Java в K8s",
      "matched_segments": [{"text": "Настройка GitLab CI для сборки Java-приложений", "score": 0.95}]
    }
  ],
  "total": 47,
  "query_embedding_time_ms": 45,
  "search_time_ms": 120
}
```

#### Learning Service (`/api/v1/enrollments`)

```
GET    /api/v1/enrollments                → Мои записи
POST   /api/v1/enrollments                → Записаться
GET    /api/v1/enrollments/{id}           → Детали
PATCH  /api/v1/enrollments/{id}           → Обновить прогресс
DELETE /api/v1/enrollments/{id}           → Отменить
POST   /api/v1/enrollments/batch          → Массовое назначение (admin)
GET    /api/v1/enrollments/progress       → Прогресс (dashboard)
GET    /api/v1/enrollments/statistics     → Статистика (manager)

GET    /api/v1/learning-paths             → Learning paths
GET    /api/v1/learning-paths/{id}        → Детали path
POST   /api/v1/learning-paths             → Создание (AI или вручную)
GET    /api/v1/learning-paths/recommended → AI-recommended path

GET    /api/v1/assessments                → Оценки/тесты
POST   /api/v1/assessments/{id}/submit    → Отправка
GET    /api/v1/assessments/{id}/result    → Результаты
```

#### Career Service (`/api/v1/career`)

```
GET    /api/v1/career/paths               → Карьерные треки
GET    /api/v1/career/paths/{id}          → Детали
GET    /api/v1/career/paths/{id}/steps    → Шаги
GET    /api/v1/career/my-path             → Мой трек

GET    /api/v1/career/skills-matrix       → Матрица навыков
GET    /api/v1/career/gap-analysis        → Анализ пробелов

GET    /api/v1/career/idp                 → Мой IDP
POST   /api/v1/career/idp                 → Создание IDP
PATCH  /api/v1/career/idp/{id}            → Обновление
POST   /api/v1/career/idp/{id}/approve    → Согласование

GET    /api/v1/career/succession          → Преемственность
GET    /api/v1/career/successors          → Потенциальные преемники
```

**Response (GET /api/v1/career/gap-analysis):**
```json
{
  "current_position": {"title": "Middle Software Engineer", "grade": "M2"},
  "target_position": {"title": "Senior Software Engineer", "grade": "S1"},
  "gaps": [
    {
      "skill": "System Design", "current_level": 2, "required_level": 4,
      "priority": "high", "estimated_time_months": 3,
      "recommended_courses": [{"id": "...", "title": "System Design Fundamentals", "relevance": 0.95}],
      "recommended_projects": ["Participate in architecture review"],
      "recommended_mentors": [{"id": "...", "name": "..."}]
    }
  ],
  "overall_readiness": 0.35,
  "estimated_time_to_promotion": "8-10 months",
  "ai_recommendations": "Сфокусируйтесь на System Design в Q1, затем пройдите mentoring программу"
}
```

#### Onboarding Service (`/api/v1/onboarding`)

```
GET    /api/v1/onboarding/my-plan         → Мой план
GET    /api/v1/onboarding/{id}            → Детали
POST   /api/v1/onboarding                 → Создание (admin)
GET    /api/v1/onboarding/{id}/tasks      → Задачи
PATCH  /api/v1/onboarding/tasks/{id}      → Обновить статус
GET    /api/v1/onboarding/{id}/progress   → Прогресс

GET    /api/v1/onboarding/templates       → Шаблоны
POST   /api/v1/onboarding/templates       → Создание шаблона
```

#### Communication Service (`/api/v1/comm`)

```
GET    /api/v1/comm/notifications         → Уведомления
PATCH  /api/v1/comm/notifications/{id}/read → Прочитать
POST   /api/v1/comm/notifications/batch-read → Массовое
GET    /api/v1/comm/notifications/unread-count → Счетчик

POST   /api/v1/comm/meetings              → Создать
GET    /api/v1/comm/meetings/{id}         → Детали
PATCH  /api/v1/comm/meetings/{id}         → Обновить
DELETE /api/v1/comm/meetings/{id}         → Отменить
POST   /api/v1/comm/meetings/ai-schedule  → AI-планирование

GET    /api/v1/comm/contacts              → Контакты
GET    /api/v1/comm/contacts/search       → Поиск
GET    /api/v1/comm/contacts/{id}/availability → Доступность
```

**Request (POST /api/v1/comm/meetings/ai-schedule):**
```json
{
  "participants": ["user-id-1", "user-id-2"],
  "meeting_type": "one_on_one",
  "duration_minutes": 30,
  "time_preference": "next_week",
  "title": "1-on-1 с руководителем",
  "generate_agenda": true,
  "context": "Еженедельный синхронизационный созвон"
}
```

**Response:**
```json
{
  "proposed_slot": {"start_time": "2025-02-05T11:00:00+03:00", "end_time": "2025-02-05T11:30:00+03:00", "timezone": "Europe/Moscow"},
  "alternatives": [
    {"start_time": "2025-02-05T14:00:00+03:00"},
    {"start_time": "2025-02-06T10:00:00+03:00"}
  ],
  "agenda": {
    "generated_by_ai": true,
    "items": [
      "Чек-ин: текущее состояние (5 мин)",
      "Прогресс по целям Q1 (10 мин)",
      "Обратная связь по проекту (10 мин)",
      "Обсуждение плана развития на Q2 (5 мин)"
    ]
  },
  "confidence": 0.95,
  "requires_confirmation": true
}
```

#### Analytics Service (`/api/v1/analytics`)

```
GET    /api/v1/analytics/dashboard        → Данные дашборда
GET    /api/v1/analytics/dashboard/hr     → HR дашборд
GET    /api/v1/analytics/dashboard/manager → Manager дашборд
GET    /api/v1/analytics/dashboard/me      → Personal дашборд

POST   /api/v1/analytics/reports          → Создать отчет
GET    /api/v1/analytics/reports/{id}     → Получить отчет
GET    /api/v1/analytics/reports/templates → Шаблоны

GET    /api/v1/analytics/churn-risk       → Прогноз оттока
GET    /api/v1/analytics/engagement       → Аналитика вовлеченности
POST   /api/v1/analytics/query            → Ad-hoc запрос

POST   /api/v1/analytics/events           → Запись события (batch)
```

#### Gamification Service (`/api/v1/gamification`)

```
GET    /api/v1/gamification/points        → Мои баллы
GET    /api/v1/gamification/points/history → История
GET    /api/v1/gamification/leaderboard   → Лидерборд
GET    /api/v1/gamification/badges        → Мои бейджи
GET    /api/v1/gamification/badges/all    → Все доступные
```

#### Admin Service (`/api/v1/admin`)

```
GET    /api/v1/admin/roles                → Роли
GET    /api/v1/admin/permissions          → Права
POST   /api/v1/admin/role-assignments     → Назначение ролей

GET    /api/v1/admin/audit-log            → Лог аудита
GET    /api/v1/admin/audit-log/export     → Экспорт

GET    /api/v1/admin/settings             → Настройки
PATCH  /api/v1/admin/settings             → Обновление

GET    /api/v1/admin/workflows            → Workflows
POST   /api/v1/admin/workflows            → Создание
```

### 5.2 WebSocket для Real-Time

#### Connections (`/ws/v1`)

| Endpoint | Назначение |
|----------|-----------|
| `/ws/v1/chat` | AI Chat (Tutor Agent) |
| `/ws/v1/notifications` | Push-уведомления |
| `/ws/v1/presence` | Статус присутствия |
| `/ws/v1/analytics` | Real-time аналитика |

**Chat WebSocket Protocol:**

```json
// Client → Server
{"type": "chat_message", "payload": {"session_id": "...", "message": "...", "context": {"current_page": "/learning"}}}

// Server → Client (typing indicator)
{"type": "typing_indicator", "payload": {"session_id": "...", "status": "typing", "estimated_time_ms": 2000}}

// Server → Client (response)
{"type": "chat_response", "payload": {"session_id": "...", "content": "...", "content_type": "markdown", "sources": [...], "quick_actions": [...], "confidence": 0.92}}

// Server → Client (streamed chunk)
{"type": "chat_stream_chunk", "payload": {"session_id": "...", "chunk": "...", "is_final": false}}
```

### 5.3 AI Agent API (`/api/v1/agents`)

```
POST   /api/v1/agents/tutor/chat          → Чат с Tutor Agent
POST   /api/v1/agents/tutor/ask           → Вопрос (sync)
POST   /api/v1/agents/recommender/recommend → Рекомендации
POST   /api/v1/agents/recommender/learning-path → Learning path
POST   /api/v1/agents/scheduler/schedule  → Запланировать встречу
POST   /api/v1/agents/scheduler/suggest-slots → Предложить слоты
POST   /api/v1/agents/analytics/report    → Сгенерировать отчет
POST   /api/v1/agents/analytics/insights  → Инсайты
POST   /api/v1/agents/admin/batch-assign  → Массовое назначение
GET    /api/v1/agents/status              → Статус всех агентов
GET    /api/v1/agents/{agent_id}/health   → Health check
```

**Request (POST /api/v1/agents/tutor/chat):**
```json
{
  "session_id": "optional-existing-session",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Привет! Я новый разработчик в команде Platform. Что мне нужно сделать в первую неделю?",
  "context": {"onboarding_stage": "first_week", "role": "Backend Developer", "grade": "Junior", "team": "Platform Engineering"},
  "history_limit": 10,
  "stream": true
}
```

**Agent Health Check:**
```json
{
  "agent_id": "tutor_agent",
  "status": "healthy",
  "version": "1.2.3",
  "llm": {"model": "GigaChat-Max", "status": "available", "avg_latency_ms": 850, "queue_depth": 3},
  "rag": {"status": "available", "documents_indexed": 15420, "last_index_update": "2025-01-15T06:00:00Z"},
  "active_sessions": 247,
  "requests_last_hour": 1847,
  "error_rate": 0.002
}
```

---

## 6. Безопасность

### 6.1 Модель угроз (STRIDE)

| Компонент | Угроза | Severity |
|-----------|--------|----------|
| Authentication | Spoofing (credential stuffing) | Critical |
| Authorization | Elevation of Privilege | Critical |
| Data Storage | Tampering (прогресс, оценки) | High |
| LLM/API | Prompt injection | Critical |
| Network | Information Disclosure (перехват) | Critical |
| Logs | Утечка ПД через логи | High |
| LLM Output | Утечка чувствительных данных | Critical |
| Availability | DoS / DDoS | High |

### 6.2 Механизмы защиты

#### Аутентификация и авторизация

**RBAC Роли:**

| Роль | Права |
|------|-------|
| `employee` | Свой профиль, курсы, IDP, чат |
| `manager` | Права employee + данные команды, назначение курсов, approve IDP |
| `hr_partner` | Права manager + все сотрудники ЦК, настройка онбординга, отчеты |
| `hr_director` | Права hr_partner + все данные, стратегические отчеты |
| `admin` | Полный доступ, настройки, пользователи |
| `content_manager` | Управление курсами, категориями |
| `auditor` | Только чтение всех данных, аудит-лог |

**ABAC Policy примеры:**
```yaml
# Менеджер видит только свою команду
view_team_data: subject.role=manager AND resource.team_id IN subject.managed_team_ids → allow read

# HR-партнер видит только свой ЦК
view_center: subject.role=hr_partner AND resource.center_of_competence_id IN subject.assigned_centers → allow read/write

# Сотрудник видит только свой IDP
idp_access: subject.role=employee AND resource.employee_id == subject.id → allow read/write
```

#### Защита LLM

| Layer | Метод | Описание |
|-------|-------|----------|
| Input PII Detection | Presidio | Сканирование запроса на ПД (ФИО, телефон, email, ИНН) |
| Prompt Injection Detection | Fine-tuned classifier | Определение попыток prompt injection |
| Topic Filter | Классификатор | Запросы вне T&D отклоняются |
| Rate Limiting | Redis | Лимиты: per user per minute |
| Output PII Filter | Presidio | Маскирование ПД в ответах |
| Content Filter | Классификатор | Проверка на неприемлемый контент |
| Hallucination Check | Citation required | Обязательные ссылки на источники |
| Audit Log | PostgreSQL | Все запросы/ответы логируются (без ПД) |

#### Шифрование

| Layer | Метод | Ключ | Ротация |
|-------|-------|------|---------|
| Data at rest (PostgreSQL) | AES-256-GCM | HashiCorp Vault | 90 дней |
| Data at rest (MinIO) | AES-256-SSE | Vault | 90 дней |
| Data in transit | TLS 1.3 | Корп. PKI | 365 дней |
| Service-to-service | mTLS (Istio) | Istio Citadel | 90 дней |
| Backups | AES-256-GCM | Отдельный ключ Vault | 90 дней |
| Secrets | Vault Transit | auto-unseal | 30 дней |

#### Аудит

```yaml
audit_log:
  fields: [timestamp, event_id, user_id, user_role, ip_address, user_agent,
           service, action, resource_type, resource_id, result, details, session_id, correlation_id]
  retention: 3 года
  storage: ClickHouse (hot, 1y) + S3 Glacier (cold, >1y)
  access: auditor role only, read-only
  immutability: append-only, WORM after 24h
```

### 6.3 Соответствие требованиям

#### 152-ФЗ

| Требование | Реализация |
|------------|------------|
| Обработка на территории РФ | On-premise / certified data center |
| Согласие на обработку | Электронное при онбординге |
| Право субъекта ПД | Self-service экспорт/удаление |
| Обезличивание | Автоматическое для аналитики |
| Ответственный (DPO) | Назначен, контакты указаны |
| Уничтожение ПД | Автоматическое при увольнении (90 дней) |

#### Внутренние требования Газпром Нефти

| Требование | Реализация |
|------------|------------|
| Корп. SSO | Keycloak + Active Directory |
| Газпром Нефть Cloud | Kubernetes on-prem |
| Сетевое экранирование | NetworkPolicy + корп. firewall |
| Антивирус | ClamAV для загружаемых файлов |
| SIEM | Экспорт аудит-логов в корп. SIEM |



---

## 7. План развертывания

### 7.1 Среды (dev, staging, prod)

| Параметр | DEV | STAGING | PROD |
|----------|-----|---------|------|
| Kubernetes nodes | 3 (shared) | 5 (dedicated) | 10+ (dedicated) |
| Namespaces | 1 | 1 | 3 (web, api, ai-gpu) |
| CPU cores | 16 | 64 | 256+ |
| RAM | 64 GB | 256 GB | 1 TB+ |
| GPU | None | 2x A10 | 8x A100 |
| Storage | 500 GB SSD | 2 TB SSD | 10 TB+ SSD/NVMe |
| PostgreSQL | Single | HA (2 nodes) | HA (3 nodes + replica) |
| Redis | Single | Sentinel (3) | Cluster (6) |
| Qdrant | Single | 1 node | 3 nodes |
| Kafka | Single | 3 brokers | 5 brokers |
| Backup | None | Daily | Continuous + daily + monthly |
| Deploy | Auto (feature/*) | Auto (develop) | Manual (main + tag) |
| Strategy | Recreate | Rolling | Blue-green |
| Data | Synthetic | Anonymized prod | Production |
| Auth | Local | Test AD | Prod AD |
| LLM | Local small | Test deployment | Prod cluster |
| SLA | Best effort | 99.5% | 99.9% |

### 7.2 CI/CD Pipeline

#### Git Branching Strategy

```
main (production) ←────────────────── v1.2.3 (tag)
  ↑                                    ↑
  └── develop ←──────── merge ────────┘
         ↑              /
         ├── feature/ON-123
         ├── feature/LD-456
         └── hotfix/SEC-789 ─────────→ main (fast-track)
```

#### Pipeline Stages

| # | Stage | Инструмент | Порог |
|---|-------|-----------|-------|
| 1 | Lint | ruff, eslint, prettier | 0 warnings |
| 2 | Unit Tests | pytest, jest | > 80% coverage, all pass |
| 3 | Type Check | mypy, TypeScript | 0 errors |
| 4 | Security Scan | bandit, trivy, safety | 0 critical/high |
| 5 | Build | Docker, kaniko | Successful |
| 6 | Integration Tests | pytest + TestContainers | All pass |
| 7 | E2E Tests | Playwright | All critical paths |
| 8 | Contract Tests | Pact | All contracts verified |
| 9 | Performance Tests | k6 | p95 latency < 2s |
| 10 | Deploy Staging | ArgoCD (GitOps) | Sync successful |
| 11 | Smoke Tests | Custom scripts | All health checks pass |
| 12 | Deploy Prod | ArgoCD | Manual approval required |

**GitOps (ArgoCD + Helm):**
- Конфигурация инфраструктуры в Git (IaC)
- Автоматическая синхронизация staging
- Manual sync для production (с approval)
- Blue-green deployment для zero-downtime
- Canary releases для AI-сервисов (10% → 50% → 100%)

### 7.3 Мониторинг и логирование

#### Метрики (Prometheus + Grafana)

**SLI/SLO:**

| SLI | SLO | Методика |
|-----|-----|----------|
| API Availability | 99.9% | Uptime за месяц |
| API Latency (p95) | < 2s | 28-дневное окно |
| AI Response Latency (p95) | < 5s | 28-дневное окно |
| Error Rate | < 0.1% | 5xx / total requests |
| Chat Availability | 99.5% | WebSocket uptime |

**Инфраструктурные алерты:**

| Алерт | Условие | Приоритет |
|-------|---------|-----------|
| container_cpu_usage | > 80% 5m | P2 |
| container_memory_usage | > 85% 5m | P2 |
| pod_restarts | > 3 за 10m | P2 |
| node_disk_usage | > 85% | P2 |
| network_errors | > 10 за 5m | P3 |

**Бизнес-метрики:**

| Метрика | Тип | Алерт |
|---------|-----|-------|
| active_users_daily | gauge | — |
| courses_completed_daily | counter | — |
| ai_response_latency_p95 | histogram | > 5s → P1 |
| ai_error_rate | gauge | > 1% → P1 |
| recommendation_ctr | gauge | < 10% → P3 |

#### Логирование (Grafana Loki)

```yaml
logging:
  levels: {ERROR: always+alert, WARN: always, INFO: prod:business/dev:all, DEBUG: dev only}
  format: structured JSON [timestamp, level, service, trace_id, span_id, user_id(hashed), message, context]
  retention: {hot(SSD): 7d, warm(HDD): 30d, cold(S3): 1y}
  alerts:
    - error_rate_spike: > 10 errors/min → P2
    - slow_queries: p95 > 1s → P2
    - security_events: unauthorized access → P1
    - ai_failures: LLM timeout/error > 5% → P1
```

#### Distributed Tracing (Jaeger / Tempo)

```yaml
tracing:
  instrumentation: OpenTelemetry
  sampling: 10% (prod), 100% (dev/staging)
  spans: [http_request, db_query, llm_call, rag_retrieval, external_api, cache_operation]
  alerts:
    - trace_latency: end-to-end > 5s → P2
    - error_spans: error tags → P2
    - dependency_failure: external service down → P1
```

#### Alerting Channels

| Priority | Channels | Response Time |
|----------|----------|--------------|
| P1 (Critical) | Phone call + SMS + Email + Slack | < 15 min |
| P2 (High) | SMS + Email + Slack | < 1 hour |
| P3 (Medium) | Email + Slack | < 4 hours |
| P4 (Low) | Daily email digest | < 24 hours |

#### Runbook — Key Scenarios

| Сценарий | Признаки | Действия | RTO |
|----------|----------|----------|-----|
| LLM недоступен | ai_error_rate=100% | 1. Check LLM pod 2. Restart gateway 3. Fallback to cached responses 4. Switch to backup model | < 5 min |
| PostgreSQL failover | DB connections failed | Patroni auto-failover → verify replica → update pool → investigate | < 2 min |
| High latency | p95 > 5s | Check slow query log → scale service → enable circuit breaker → check deps | < 10 min |
| Memory leak | Memory growing unbounded | Identify pod → rolling restart → heap dump → hotfix | < 15 min |
| Security incident | Unauthorized access | Isolate session → revoke tokens → analyze audit log → notify security → document | < 30 min |
| Data inconsistency | Wrong data displayed | Identify cache → flush keys → verify DB → restore if needed | < 20 min |

---

## 8. Приложения

### Приложение А: Словарь данных

| Сущность | Описание |
|----------|----------|
| Employee | Сотрудник ИТ-кластера (5000+) |
| Team | Команда разработки |
| Department | Департамент |
| Center of Competence | Центр компетенций (50 шт.) |
| Course | Учебный курс (библиотека) |
| Enrollment | Запись на курс |
| Skill | Навык/компетенция |
| Skill Record | Оценка навыка сотрудника |
| Career Path | Карьерный трек |
| Career Step | Шаг на карьерном треке |
| IDP | Individual Development Plan |
| IDP Item | Элемент плана развития |
| Onboarding Plan | План адаптации (90-180 дней) |
| Onboarding Task | Задача в плане адаптации |
| Event Log | Событие для аналитики |
| Notification | Уведомление |
| Meeting | Встреча (AI-planned) |
| Badge | Бейдж/достижение |
| Point | Балл геймификации |

### Приложение Б: Коды ошибок API

| Код | HTTP | Описание |
|-----|------|----------|
| E001 | 400 | Invalid request parameters |
| E002 | 401 | Unauthorized |
| E003 | 403 | Forbidden — insufficient permissions |
| E004 | 404 | Resource not found |
| E005 | 409 | Conflict — resource already exists |
| E006 | 422 | Validation error |
| E007 | 429 | Rate limit exceeded |
| E008 | 500 | Internal server error |
| E009 | 502 | LLM service unavailable |
| E010 | 503 | Service temporarily unavailable |
| E011 | 504 | LLM request timeout |

### Приложение В: Версионирование API

| Версия | Статус | Дата | Политика |
|--------|--------|------|----------|
| v1 | Current | 2025-01 | Initial release |
| v2 | Planned | 2025-07 | If breaking changes needed |

URL-based (`/api/v1/...`). Поддержка минимум 6 месяцев. Deprecation notice за 3 месяца.

---

## 9. Список участников проекта

| Роль | Ответственность |
|------|----------------|
| Product Owner | Продуктовая стратегия, приоритизация |
| Tech Lead | Архитектура, технические решения |
| ML Engineer | AI/ML модели, LLM, RAG |
| Backend Developers (3-4) | Микросервисы, API, интеграции |
| Frontend Developers (2-3) | Web UI, mobile, дизайн-система |
| DevOps Engineer | Инфраструктура, CI/CD, мониторинг |
| QA Engineer | Тестирование, автоматизация |
| Security Engineer | Безопасность, compliance |
| UX/UI Designer | Пользовательский опыт, интерфейс |
| Data Engineer | Данные, ETL, аналитика |
| DPO | Защита персональных данных |

---

**Документ подготовлен для передачи команде разработки.**

**Связанные документы:**
- Requirements Document (requirements.md)
- API Specification (Swagger/OpenAPI)
- Infrastructure as Code (Terraform/Helm)
- Security Policy (security.md)
- Runbook (runbook.md)
