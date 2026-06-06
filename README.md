# 🤖 AI T&D Ecosystem — Gazprom Neft IT Cluster

> **An AI-powered Training & Development platform** with a personal AI mentor for every employee — covering onboarding, learning, career planning, and analytics across 5,000+ engineers in 47 cities.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start (GitHub Codespaces)](#-quick-start-github-codespaces)
- [Local Setup](#-local-setup)
- [Project Structure](#-project-structure)
- [Demo Users](#-demo-users)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Requirements & Design Docs](#-requirements--design-docs)

---

## 🌟 Overview

This is an **MVP of a corporate AI-first T&D (Training & Development) ecosystem** built for the IT cluster of Gazprom Neft. The platform provides every employee with a **personal AI mentor** that accompanies them through the entire employee lifecycle — from day one to career growth and succession planning.

**Scale:** 5,000+ IT employees · 47 cities · 240+ locations · 50 competency centers

---

## ✨ Features

### 🎓 AI Onboarding
- Personalized adaptation plans auto-generated from role templates
- AI mentor chat available 24/7 with full employee context
- Interactive timeline with progress tracking and checklists
- Automatic course assignment based on role competency matrices
- Proactive reminders and check-ins from the AI

### 📚 Learning & Development
- Unified course catalog with **semantic AI search** (natural language queries)
- Personalized recommendations based on skills, KPIs, and grade
- AI-generated Individual Development Plans (IDP) with approval workflow
- Gamification: badges, leaderboards, learning challenges
- Microlearning format (5–15 minute modules)

### 🚀 Career Tracks
- Interactive visualization of vertical and horizontal career paths
- AI gap-analysis between current competencies and target role
- AI-built development roadmaps with timelines
- Integration with 360° assessments, KPIs, and grading system
- Succession planning with readiness matrices

### 💬 Communication Hub
- Unified inbox aggregating all platform notifications
- AI-powered meeting scheduler (finds optimal slots across time zones)
- AI-generated meeting agendas, summaries, and action items
- Integration with Outlook / Google Calendar
- Colleague availability and expertise search

### 📊 Analytics & Insights
- Dashboards for HR, team leads, and individual employees
- Training progress tracking by team, competency center, and grade
- Engagement analytics and NPS measurement
- **AI-powered churn prediction** with early warning signals and retention recommendations

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 · TypeScript · Tailwind CSS · Recharts |
| **Backend** | FastAPI · SQLAlchemy · Python 3.11+ |
| **Database** | PostgreSQL 16 |
| **Containerization** | Docker · Docker Compose |
| **AI (MVP)** | Hardcoded AI mentor with markdown-based dialogues |

### Production Architecture (Full Scale)
| Layer | Technology |
|---|---|
| **LLM** | GigaChat MAX / Saiga / Llama 3 (self-hosted) |
| **AI Orchestration** | LangGraph / LangChain |
| **RAG** | LangChain + Qdrant / Milvus |
| **Recommendations** | LightFM / Two-Tower model |
| **Infrastructure** | Kubernetes · Istio · GitLab CI/CD · ArgoCD |
| **Observability** | Prometheus · Grafana · Jaeger |
| **Security** | Keycloak SSO · Vault · WAF |

---

## 🚀 Quick Start (GitHub Codespaces)

The fastest way to run this project — no local setup needed.

1. Click the green **`<> Code`** button → **Codespaces** tab → **Create codespace on main**
2. Wait for the environment to load (~2 minutes)
3. In the terminal, run:

```bash
docker compose up -d
```

4. Open the **PORTS** tab (bottom-left in VS Code)
5. Find port **3000** → click the 🌐 globe icon → copy the public URL
6. Open the URL in your browser — you're live!

---

## 💻 Local Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Git

### Steps

```bash
# Clone the repository
git clone https://github.com/Thedilate/case.git
cd case

# Start all services
docker compose up -d
```

### Available Services

| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost:3000 | Main web application |
| **Backend API** | http://localhost:8000 | REST API server |
| **API Docs** | http://localhost:8000/docs | Swagger UI (auto-generated) |
| **API Redoc** | http://localhost:8000/redoc | Alternative API documentation |

### Stopping Services

```bash
docker compose down

# Remove volumes (reset database)
docker compose down -v
```

---

## 📁 Project Structure

```
case/
├── frontend/               # Next.js 14 application
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Reusable UI components
│   │   └── styles/         # Tailwind CSS configuration
│   └── Dockerfile
│
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── models/         # SQLAlchemy models
│   │   └── services/       # Business logic
│   └── Dockerfile
│
├── .devcontainer/          # GitHub Codespaces configuration
├── docker-compose.yml      # Service orchestration
├── init.sql                # Database initialization script
├── requirements.md         # Full functional & technical requirements
└── design.md               # System architecture & design decisions
```

---

## 👥 Demo Users

The database is pre-seeded with demo employees. You can log in as any of them, or continue as a **guest**.

| Name | Email | Role |
|---|---|---|
| Ivan Ivanov | ivan.ivanov@gazpromneft.ru | DevOps Engineer |
| Elena Petrova | elena.petrova@gazpromneft.ru | ML Engineer |
| Alexey Smirnov | alexey.smirnov@gazpromneft.ru | Junior Backend |
| Maria Kuznetsova | maria.kuznetsova@gazpromneft.ru | Data Engineering Lead |
| Dmitry Volkov | dmitry.volkov@gazpromneft.ru | Platform Engineering Manager |

> Guest login is also available on the main page.

---

## 📖 API Documentation

Once the backend is running, interactive API documentation is auto-generated by FastAPI:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🏗 Architecture

The MVP follows a clean **monorepo** structure with separated frontend and backend services, connected via REST API and orchestrated with Docker Compose.

```
┌─────────────────────────────────────┐
│           Browser / Client          │
└──────────────┬──────────────────────┘
               │ HTTP
┌──────────────▼──────────────────────┐
│    Frontend (Next.js 14, :3000)     │
│  TypeScript · Tailwind · Recharts   │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────▼──────────────────────┐
│     Backend (FastAPI, :8000)        │
│    SQLAlchemy · Python 3.11+        │
└──────────────┬──────────────────────┘
               │ SQL
┌──────────────▼──────────────────────┐
│      PostgreSQL Database            │
│   (seeded via init.sql)             │
└─────────────────────────────────────┘
```

### AI Agents (Planned for Production)

Five specialized autonomous AI agents are designed for the full platform:

| Agent | Responsibility |
|---|---|
| **Tutor Agent** | 24/7 Q&A, course recommendations, knowledge checks |
| **Recommendation Agent** | Personalized content, learning paths, career advice |
| **Scheduling Agent** | Meeting scheduling, agenda generation, follow-ups |
| **Analytics Agent** | Reports, churn prediction, anomaly detection |
| **Admin Agent** | Course assignments, access management, workflow automation |

---

## 📄 Requirements & Design Docs

Detailed project documentation is included in the repository:

- **[`requirements.md`](./requirements.md)** — Full functional requirements (564 lines): all modules, acceptance criteria, NFRs, integrations, and technology stack decisions
- **[`design.md`](./design.md)** — System design and architecture document

### Key Modules Covered

| Module | Description |
|---|---|
| AI Onboarding | Personalized adaptation for new hires |
| Learning & Development | Course catalog, IDP, gamification |
| Career Tracks | Career path visualization, gap analysis |
| Communication | Unified inbox, meeting assistant |
| Analytics | Dashboards, engagement metrics, churn prediction |

---

## 🔒 Security & Compliance

The production system is designed with enterprise-grade security:

- **Data residency:** All personal data processed within Russia (152-ФЗ compliance)
- **Encryption:** AES-256 at rest · TLS 1.3 in transit
- **Access control:** RBAC + ABAC with 5+ roles
- **Auth:** Corporate SSO via Active Directory / Keycloak with MFA
- **LLM Security:** Input/output filtering, PII detection, prompt injection protection
- **Audit:** Full action logging retained for 3+ years

---

## 📈 Performance Targets (Production)

| Metric | Target |
|---|---|
| UI response time | < 1 sec (p95) |
| AI agent response | < 2 sec (p95) |
| Concurrent users | 5,000+ |
| API throughput | 1,000+ RPS |
| Uptime SLA | 99.9% |

---

*Built as an MVP for the Gazprom Neft IT Cluster T&D Ecosystem.*
