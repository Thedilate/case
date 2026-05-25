-- =============================================
-- init.sql — инициализация БД + seed-данные
-- =============================================

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Таблицы
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    level INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE centers_of_competence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    center_of_competence_id UUID REFERENCES centers_of_competence(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    grade_id UUID REFERENCES grades(id),
    team_id UUID REFERENCES teams(id),
    manager_id UUID REFERENCES employees(id),
    position VARCHAR(100),
    hire_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','onboarding','inactive','terminated')),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    duration_min INT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
    format VARCHAR(20) NOT NULL CHECK (format IN ('video','interactive','text','webinar','simulation')),
    category_id UUID REFERENCES course_categories(id),
    provider_id UUID REFERENCES course_providers(id),
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
    rating_avg DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    completion_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled','in_progress','completed','dropped')),
    progress_pct INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    enrolled_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    dropped_at TIMESTAMP,
    score INT,
    source VARCHAR(30) DEFAULT 'manual'
);

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES course_categories(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skill_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    skill_id UUID NOT NULL REFERENCES skills(id),
    level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
    assessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    source VARCHAR(30) NOT NULL DEFAULT 'self_assessment',
    confidence DECIMAL(3,2) DEFAULT 1.0,
    UNIQUE(employee_id, skill_id)
);

CREATE TABLE career_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('technical','management','hybrid')),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE career_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path_id UUID NOT NULL REFERENCES career_paths(id),
    position_name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    sequence_num SMALLINT NOT NULL,
    skill_requirements JSONB DEFAULT '{}',
    avg_time_months INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE idp_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
    quarter VARCHAR(10) NOT NULL,
    deadline DATE,
    progress_pct INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES employees(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE onboarding_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id),
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started','active','completed','extended')),
    start_date DATE NOT NULL,
    target_end_date DATE NOT NULL,
    actual_end_date DATE,
    progress_pct INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES onboarding_plans(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('mandatory','optional','role_specific')),
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','skipped')),
    due_date DATE,
    completed_at TIMESTAMP,
    assigned_by VARCHAR(20) DEFAULT 'system'
);

-- Индексы
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_team ON employees(team_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_enrollments_employee ON enrollments(employee_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_skill_records_employee ON skill_records(employee_id);
CREATE INDEX idx_skill_records_skill ON skill_records(skill_id);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_title_trgm ON courses USING gin(title gin_trgm_ops);

-- =============================================
-- Seed-данные
-- =============================================

-- Грейды
INSERT INTO grades (id, name, level) VALUES
('11111111-1111-1111-1111-111111111111', 'Junior', 1),
('22222222-2222-2222-2222-222222222222', 'Middle', 2),
('33333333-3333-3333-3333-333333333333', 'Senior', 3),
('44444444-4444-4444-4444-444444444444', 'Lead', 4),
('55555555-5555-5555-5555-555555555555', 'Principal', 5);

-- Департаменты
INSERT INTO departments (id, name) VALUES
('d1111111-1111-1111-1111-111111111111', 'Infrastructure'),
('d2222222-2222-2222-2222-222222222222', 'Product & Engineering'),
('d3333333-3333-3333-3333-333333333333', 'Data & AI');

-- Центры компетенций
INSERT INTO centers_of_competence (id, name) VALUES
('cc111111-1111-1111-1111-111111111111', 'DevOps'),
('cc222222-2222-2222-2222-222222222222', 'Backend Development'),
('cc333333-3333-3333-3333-333333333333', 'Data Engineering'),
('cc444444-4444-4444-4444-444444444444', 'ML/AI');

-- Команды
INSERT INTO teams (id, name, department_id, center_of_competence_id) VALUES
('a1111111-1111-1111-1111-111111111111', 'Platform Engineering', 'd1111111-1111-1111-1111-111111111111', 'cc111111-1111-1111-1111-111111111111'),
('a2222222-2222-2222-2222-222222222222', 'Core Services', 'd2222222-2222-2222-2222-222222222222', 'cc222222-2222-2222-2222-222222222222'),
('a3333333-3333-3333-3333-333333333333', 'Data Platform', 'd3333333-3333-3333-3333-333333333333', 'cc333333-3333-3333-3333-333333333333');

-- Сотрудники
INSERT INTO employees (id, email, full_name, first_name, last_name, grade_id, team_id, position, hire_date, status, avatar_url) VALUES
('e0000000-0000-0000-0000-000000000001', 'ivan.ivanov@gazpromneft.ru', 'Иванов Иван Иванович', 'Иван', 'Иванов', '22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'DevOps Engineer', '2023-06-15', 'active', null),
('e0000000-0000-0000-0000-000000000002', 'elena.petrova@gazpromneft.ru', 'Петрова Елена Сергеевна', 'Елена', 'Петрова', '33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'ML Engineer', '2021-03-10', 'active', null),
('e0000000-0000-0000-0000-000000000003', 'alexey.smirnov@gazpromneft.ru', 'Смирнов Алексей Дмитриевич', 'Алексей', 'Смирнов', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Junior Backend Developer', '2024-09-01', 'onboarding', null),
('e0000000-0000-0000-0000-000000000004', 'maria.kuznetsova@gazpromneft.ru', 'Кузнецова Мария Андреевна', 'Мария', 'Кузнецова', '44444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 'Data Engineering Lead', '2020-01-20', 'active', null),
('e0000000-0000-0000-0000-000000000005', 'dmitry.volkov@gazpromneft.ru', 'Волков Дмитрий Павлович', 'Дмитрий', 'Волков', '55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'Platform Engineering Manager', '2019-05-12', 'active', null);

-- Обновить менеджеров
UPDATE employees SET manager_id = 'e0000000-0000-0000-0000-000000000005' WHERE id IN ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002');
UPDATE employees SET manager_id = 'e0000000-0000-0000-0000-000000000004' WHERE id = 'e0000000-0000-0000-0000-000000000003';

-- Категории курсов
INSERT INTO course_categories (id, name) VALUES
('ca111111-1111-1111-1111-111111111111', 'DevOps'),
('ca222222-2222-2222-2222-222222222222', 'Backend Development'),
('ca333333-3333-3333-3333-333333333333', 'Data Engineering'),
('ca444444-4444-4444-4444-444444444444', 'ML/AI'),
('ca555555-5555-5555-5555-555555555555', 'Frontend Development'),
('ca666666-6666-6666-6666-666666666666', 'Cybersecurity');

-- Провайдеры
INSERT INTO course_providers (id, name) VALUES
('e1111111-1111-1111-1111-111111111111', 'Internal Academy'),
('e2222222-2222-2222-2222-222222222222', 'Stepik'),
('e3333333-3333-3333-3333-333333333333', 'Coursera');

-- Курсы
INSERT INTO courses (id, title, description, duration_min, difficulty, format, category_id, provider_id, rating_avg, rating_count, completion_count) VALUES
('c0000000-0000-0000-0000-000000000001', 'Kubernetes Basics', 'Введение в оркестрацию контейнеров с Kubernetes. Установка, базовые объекты, деплоймент приложений.', 180, 'beginner', 'video', 'ca111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 4.50, 120, 89),
('c0000000-0000-0000-0000-000000000002', 'Advanced CI/CD with GitLab', 'Настройка CI/CD pipelines для Java и Python проектов. GitLab CI, Docker, Helm.', 240, 'intermediate', 'interactive', 'ca111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 4.70, 85, 62),
('c0000000-0000-0000-0000-000000000003', 'Terraform for Cloud Infrastructure', 'Инфраструктура как код. Terraform modules, state management, best practices.', 300, 'intermediate', 'video', 'ca111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 4.30, 56, 40),
('c0000000-0000-0000-0000-000000000004', 'System Design Fundamentals', 'Проектирование распределённых систем. Масштабируемость, отказоустойчивость, консистентность.', 360, 'advanced', 'webinar', 'ca222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 4.80, 200, 150),
('c0000000-0000-0000-0000-000000000005', 'Java Microservices with Spring Boot', 'Создание микросервисов на Java. Spring Cloud, API Gateway, Service Discovery.', 420, 'intermediate', 'video', 'ca222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 4.60, 140, 110),
('c0000000-0000-0000-0000-000000000006', 'Go for Backend Developers', 'Основы Go для бэкенд-разработки. Goroutines, Channels, REST API.', 300, 'beginner', 'interactive', 'ca222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 4.40, 95, 70),
('c0000000-0000-0000-0000-000000000007', 'Apache Spark for Data Engineering', 'Обработка больших данных с Apache Spark. RDD, DataFrames, Spark SQL.', 360, 'intermediate', 'video', 'ca333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 4.50, 78, 55),
('c0000000-0000-0000-0000-000000000008', 'Airflow Orchestration', 'Управление data pipelines с Apache Airflow. DAGs, operators, sensors.', 240, 'intermediate', 'interactive', 'ca333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 4.20, 45, 32),
('c0000000-0000-0000-0000-000000000009', 'Machine Learning with PyTorch', 'Глубокое обучение на PyTorch. CNN, RNN, Transformer модели.', 480, 'advanced', 'video', 'ca444444-4444-4444-4444-444444444444', 'e3333333-3333-3333-3333-333333333333', 4.70, 110, 80),
('c0000000-0000-0000-0000-000000000010', 'MLOps: Model Deployment', 'Развёртывание ML-моделей в production. Docker, Kubernetes, monitoring.', 300, 'intermediate', 'webinar', 'ca444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 4.40, 65, 48),
('c0000000-0000-0000-0000-000000000011', 'React Advanced Patterns', 'Продвинутые паттерны React. Hooks, Context, Performance optimization.', 240, 'intermediate', 'video', 'ca555555-5555-5555-5555-555555555555', 'e1111111-1111-1111-1111-111111111111', 4.60, 130, 98),
('c0000000-0000-0000-0000-000000000012', 'TypeScript Deep Dive', 'Продвинутый TypeScript. Generics, Type guards, Mapped types.', 180, 'intermediate', 'interactive', 'ca555555-5555-5555-5555-555555555555', 'e2222222-2222-2222-2222-222222222222', 4.50, 88, 65),
('c0000000-0000-0000-0000-000000000013', 'Corporate Security Basics', 'Основы информационной безопасности. Политики, инциденты, compliance.', 120, 'beginner', 'text', 'ca666666-6666-6666-6666-666666666666', 'e1111111-1111-1111-1111-111111111111', 4.10, 250, 200),
('c0000000-0000-0000-0000-000000000014', 'Penetration Testing 101', 'Введение в пентест. Reconnaissance, scanning, exploitation.', 300, 'intermediate', 'simulation', 'ca666666-6666-6666-6666-666666666666', 'e2222222-2222-2222-2222-222222222222', 4.60, 40, 28),
('c0000000-0000-0000-0000-000000000015', 'Docker & Containers', 'Контейнеризация приложений. Dockerfiles, Compose, Registry.', 180, 'beginner', 'video', 'ca111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 4.55, 150, 120);

-- Записи на курсы
INSERT INTO enrollments (id, employee_id, course_id, status, progress_pct, enrolled_at, started_at, source) VALUES
-- Иванов (DevOps Engineer): DevOps + System Design
('f1111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'in_progress', 45, NOW(), NOW(), 'ai_recommended'),
('f2222222-2222-2222-2222-222222222222', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'enrolled', 0, NOW(), null, 'ai_recommended'),
('f3333333-3333-3333-3333-333333333333', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'completed', 100, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', 'auto_assigned'),
('f3a33333-3333-3333-3333-333333333333', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'in_progress', 30, NOW(), NOW(), 'manual'),
('f3b33333-3333-3333-3333-333333333333', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000015', 'completed', 100, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', 'auto_assigned'),

-- Петрова (ML Engineer): ML/AI + Data Engineering
('f6666666-6666-6666-6666-666666666666', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000009', 'completed', 100, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', 'manual'),
('f7777777-7777-7777-7777-777777777777', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010', 'in_progress', 60, NOW(), NOW(), 'ai_recommended'),
('f7a77777-7777-7777-7777-777777777777', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'completed', 100, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', 'manual'),
('f7b77777-7777-7777-7777-777777777777', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 'in_progress', 35, NOW(), NOW(), 'ai_recommended'),
('f7c77777-7777-7777-7777-777777777777', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000012', 'enrolled', 0, NOW(), null, 'manual'),

-- Смирнов (Junior Backend): Backend + Security
('f4444444-4444-4444-4444-444444444444', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'in_progress', 20, NOW(), NOW(), 'auto_assigned'),
('f5555555-5555-5555-5555-555555555555', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000013', 'completed', 100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'auto_assigned'),
('f5a55555-5555-5555-5555-555555555555', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'in_progress', 15, NOW(), NOW(), 'auto_assigned'),
('f5b55555-5555-5555-5555-555555555555', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'enrolled', 0, NOW(), null, 'ai_recommended'),
('f5c55555-5555-5555-5555-555555555555', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000015', 'in_progress', 40, NOW(), NOW(), 'auto_assigned');

-- Навыки
INSERT INTO skills (id, name, category_id) VALUES
('b1111111-1111-1111-1111-111111111111', 'Kubernetes', 'ca111111-1111-1111-1111-111111111111'),
('b2222222-2222-2222-2222-222222222222', 'Docker', 'ca111111-1111-1111-1111-111111111111'),
('b3333333-3333-3333-3333-333333333333', 'CI/CD', 'ca111111-1111-1111-1111-111111111111'),
('b4444444-4444-4444-4444-444444444444', 'System Design', 'ca222222-2222-2222-2222-222222222222'),
('b5555555-5555-5555-5555-555555555555', 'Java', 'ca222222-2222-2222-2222-222222222222'),
('b6666666-6666-6666-6666-666666666666', 'Go', 'ca222222-2222-2222-2222-222222222222'),
('b7777777-7777-7777-7777-777777777777', 'Spark', 'ca333333-3333-3333-3333-333333333333'),
('b8888888-8888-8888-8888-888888888888', 'PyTorch', 'ca444444-4444-4444-4444-444444444444'),
('b9999999-9999-9999-9999-999999999999', 'React', 'ca555555-5555-5555-5555-555555555555'),
('b0000000-0000-0000-0000-000000000000', 'TypeScript', 'ca555555-5555-5555-5555-555555555555');

-- Навыки сотрудников
INSERT INTO skill_records (employee_id, skill_id, level, source) VALUES
-- Иванов (DevOps)
('e0000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 3, 'manager_review'),
('e0000000-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 4, 'manager_review'),
('e0000000-0000-0000-0000-000000000001', 'b3333333-3333-3333-3333-333333333333', 3, 'self_assessment'),
('e0000000-0000-0000-0000-000000000001', 'b4444444-4444-4444-4444-444444444444', 2, 'test'),
('e0000000-0000-0000-0000-000000000001', 'b6666666-6666-6666-6666-666666666666', 1, 'test'),

-- Петрова (ML Engineer)
('e0000000-0000-0000-0000-000000000002', 'b8888888-8888-8888-8888-888888888888', 5, 'certification'),
('e0000000-0000-0000-0000-000000000002', 'b7777777-7777-7777-7777-777777777777', 4, 'manager_review'),
('e0000000-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111', 2, 'self_assessment'),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000000', 3, 'test'),

-- Смирнов (Junior Backend)
('e0000000-0000-0000-0000-000000000003', 'b5555555-5555-5555-5555-555555555555', 2, 'self_assessment'),
('e0000000-0000-0000-0000-000000000003', 'b4444444-4444-4444-4444-444444444444', 1, 'test'),
('e0000000-0000-0000-0000-000000000003', 'b2222222-2222-2222-2222-222222222222', 2, 'manager_review'),
('e0000000-0000-0000-0000-000000000003', 'b3333333-3333-3333-3333-333333333333', 1, 'self_assessment');

-- Карьерные пути
INSERT INTO career_paths (id, name, description, category) VALUES
('c1111111-1111-1111-1111-111111111111', 'Backend Engineer', 'Технический трек бэкенд-разработки', 'technical'),
('c2222222-2222-2222-2222-222222222222', 'DevOps Engineer', 'Технический трек DevOps/SRE', 'technical'),
('c3333333-3333-3333-3333-333333333333', 'Engineering Manager', 'Менеджерский трек', 'management');

-- Шаги карьерных путей
INSERT INTO career_steps (id, path_id, position_name, grade_level, sequence_num, skill_requirements, avg_time_months) VALUES
('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Junior Backend Developer', 'J1', 1, '{"s5555555-5555-5555-5555-555555555555": 2}', 12),
('d2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Middle Backend Developer', 'M2', 2, '{"s5555555-5555-5555-5555-555555555555": 3, "s4444444-4444-4444-4444-444444444444": 2}', 24),
('d3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'Senior Backend Developer', 'S1', 3, '{"s5555555-5555-5555-5555-555555555555": 4, "s4444444-4444-4444-4444-444444444444": 4, "s6666666-6666-6666-6666-666666666666": 3}', 36),
('d4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'Lead Backend Developer', 'L1', 4, '{"s5555555-5555-5555-5555-555555555555": 5, "s4444444-4444-4444-4444-444444444444": 5, "s6666666-6666-6666-6666-666666666666": 4}', 48);

-- IDP
INSERT INTO idp_items (id, employee_id, title, description, quarter, deadline, progress_pct) VALUES
('e1111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000001', 'Освоить System Design', 'Пройти курс System Design Fundamentals и выполнить практический проект', 'Q2 2025', '2025-06-30', 30),
('e2222222-2222-2222-2222-222222222222', 'e0000000-0000-0000-0000-000000000001', 'Углубить знания CI/CD', 'Изучить GitLab CI и настроить pipeline для своего сервиса', 'Q2 2025', '2025-05-15', 45),
('e3333333-3333-3333-3333-333333333333', 'e0000000-0000-0000-0000-000000000003', 'Базовое обучение Kubernetes', 'Пройти Kubernetes Basics и Docker & Containers', 'Q1 2025', '2025-03-31', 20);

-- Онбординг
INSERT INTO onboarding_plans (id, employee_id, status, start_date, target_end_date, progress_pct) VALUES
('f1111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000003', 'active', '2024-09-01', '2024-11-30', 35);

INSERT INTO onboarding_tasks (id, plan_id, title, description, category, status, due_date) VALUES
('f2222222-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'Пройти вводный курс по безопасности', 'Корпоративная безопасность и политики', 'mandatory', 'completed', '2024-09-05'),
('f3333333-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', 'Настроить рабочее окружение', 'Установка ПО, доступы, VPN', 'mandatory', 'completed', '2024-09-03'),
('f4444444-3333-3333-3333-333333333333', 'f1111111-1111-1111-1111-111111111111', 'Встреча с buddy', 'Знакомство с наставником', 'mandatory', 'completed', '2024-09-05'),
('f5555555-4444-4444-4444-444444444444', 'f1111111-1111-1111-1111-111111111111', 'Пройти Kubernetes Basics', 'Базовый курс по Kubernetes', 'role_specific', 'in_progress', '2024-09-20'),
('f6666666-5555-5555-5555-555555555555', 'f1111111-1111-1111-1111-111111111111', 'Ознакомиться с архитектурой сервиса', 'Документация, codebase overview', 'role_specific', 'not_started', '2024-09-25'),
('f7777777-6666-6666-6666-666666666666', 'f1111111-1111-1111-1111-111111111111', 'Первый code review', 'Участие в review команды', 'role_specific', 'not_started', '2024-09-30');

-- Уведомления
INSERT INTO notifications (id, user_id, type, title, message, is_read) VALUES
('f8888888-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000001', 'course_reminder', 'Продолжите обучение', 'Вы на 45% в курсе Advanced CI/CD with GitLab. Рекомендуем продолжить.', false),
('f9999999-2222-2222-2222-222222222222', 'e0000000-0000-0000-0000-000000000001', 'idp_reminder', 'IDP: дедлайн приближается', 'Дедлайн по цели "Углубить знания CI/CD" — 15 мая.', false),
('f0000000-3333-3333-3333-333333333333', 'e0000000-0000-0000-0000-000000000003', 'onboarding_task', 'Новая задача онбординга', 'Ознакомьтесь с архитектурой сервиса до 25 сентября.', false);

-- Чат-сессия
INSERT INTO chat_sessions (id, user_id) VALUES
('c1111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000001');

INSERT INTO chat_messages (id, session_id, role, content) VALUES
('c2222222-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'user', 'Привет! Какие курсы мне стоит пройти для роста до Senior?'),
('c3333333-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'assistant', 'Привет! Я проанализировал твой профиль. Для перехода на уровень Senior тебе стоит сфокусироваться на:\n\n1. **System Design Fundamentals** — у тебя уровень 2, а требуется 4.\n2. **Go for Backend Developers** — расширит твой стек.\n3. **MLOps: Model Deployment** — полезно для платформенной команды.\n\nЯ могу добавить эти курсы в твой IDP. Хочешь?');
