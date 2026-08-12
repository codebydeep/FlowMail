# FlowMail — AI-Powered Email + Calendar Workspace

> "Stop managing emails and meetings separately. Turn conversations into actions."

## What is FlowMail?

FlowMail is an AI-powered unified workspace that bridges Gmail and Google Calendar.
Instead of switching between apps, FlowMail understands your emails and turns them
into actionable workflows — scheduling meetings, detecting follow-ups, and letting
you talk to an AI agent that handles Gmail + Calendar for you.

---

## Architecture Overview

```
React (Vite + Zustand + Axios)
        │
        ▼
Spring Cloud Gateway (API Gateway)
        │
  ┌─────┼────────────────────────────┐
  ▼     ▼        ▼       ▼          ▼
Auth  Email  Calendar   AI    Integration
Svc   Svc      Svc     Svc       Svc
  │     │        │       │          │
MySQL MySQL    MySQL   MySQL     Corsair
                                 │    │
                               Gmail  Calendar
        │
      Kafka (Event Bus)
        │
   Notification Svc
        │
      Redis (Cache / Sessions / Rate Limit)
```

---

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | React 18, Vite, TypeScript, Tailwind  |
| State       | Zustand                               |
| HTTP Client | Axios                                 |
| Routing     | React Router DOM v6                   |
| Backend     | Java 21, Spring Boot 3.x              |
| Services    | Spring Cloud Gateway, Eureka          |
| Database    | MySQL 8                               |
| Cache       | Redis 7                               |
| Messaging   | Apache Kafka                          |
| AI          | OpenAI / Gemini API                   |
| Integration | Corsair (Gmail + Google Calendar)     |
| Auth        | JWT + OAuth 2.0                       |

---

## Microservices

| Service              | Port  | Responsibility                        |
|----------------------|-------|---------------------------------------|
| api-gateway          | 8080  | Routing, JWT validation, CORS         |
| auth-service         | 8081  | Login, register, JWT, OAuth           |
| email-service        | 8082  | Inbox, threads, send, reply, labels   |
| calendar-service     | 8083  | Events, availability, invites         |
| ai-service           | 8084  | Classification, intent, agent chat    |
| integration-service  | 8085  | Corsair OAuth, webhook ingestion      |
| notification-service | 8086  | WebSocket, real-time push             |

---

## Key Features

1. **AI Priority Inbox** — Emails classified as Action Required / Follow-up / FYI
2. **Email → Calendar** — Detect meeting intent and create event in one click
3. **Follow-up Radar** — Track unanswered emails and suggest follow-ups
4. **AI Agent Chat** — Natural language: "Schedule meeting with Rahul Thursday 9 AM"
5. **Command Palette** — Cmd+K keyboard-first navigation
6. **Natural Language Search** — "Find emails about the pricing problem"
7. **Real-time Inbox** — Corsair webhooks → Kafka → WebSocket → React

---

## Getting Started

See individual service READMEs in `/backend/*-service/` and `/frontend/`.

```
flowmail/
├── frontend/          # React + Vite
├── backend/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── email-service/
│   ├── calendar-service/
│   ├── ai-service/
│   ├── integration-service/
│   └── notification-service/
├── docs/
│   ├── architecture/
│   ├── api/
│   └── database/
└── docker-compose.yml
```
