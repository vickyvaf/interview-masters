# 🎯 Interview Masters

> **AI-powered mock interview practice** — turning every candidate's real ability into real career opportunities.

---

## Table of Contents

1. [Vision & Founder Why](#1-vision--founder-why)
2. [Target Customer & User Persona](#2-target-customer--user-persona)
3. [MVP Hypothesis & Prototype](#3-mvp-hypothesis--prototype)
4. [Key MVP Features](#4-key-mvp-features)
5. [System Architecture](#5-system-architecture)
6. [Business Flow Diagrams](#6-business-flow-diagrams)
7. [Monetization & Payment System](#7-monetization--payment-system)
8. [Success Metrics](#8-success-metrics)
9. [Documentation](#9-documentation)

---

## 1. Vision & Founder Why

### 🔴 Problem
Interviews are high-pressure, unfair gatekeepers of opportunity. Many capable candidates fail to showcase their true potential — not because they lack ability, but because they lack **structured practice**, **immediate feedback**, and **confidence under pressure**. Today, interview coaching is either too expensive, too generic, or unavailable when people need it most.

### 💡 Core Belief
Many individuals are fully qualified and capable but fail to perform effectively under traditional interview conditions.

### ⚡ Why Now?
AI technology enables realistic, personalized, and highly scalable mock interview practice with instant feedback — which was previously either too expensive or inaccessible.

### 🚀 Mission
To help candidates transform their actual ability into real career opportunities by making interview preparation **accessible**, **measurable**, and **outcome-driven**.

---

## 2. Target Customer & User Persona

### Primary Persona
A **24-year-old recent college graduate** applying for their first serious full-time professional role.

| Attribute | Detail |
|---|---|
| Background | Strong GPA, relevant projects & internship experience |
| Interview Experience | Low — lacks exposure to high-pressure live professional interviews |
| Preparation Method | YouTube videos, static question lists (passive, unstructured) |
| Feedback Access | No coach; friends can only help occasionally |
| Core Feeling | "I could have done better, but I don't know exactly how" |

### Core Pain Points

- **Unstructured Preparation** — Passive resources (YouTube, question lists) don't build real-time communication skills.
- **Delivery & Formatting** — Struggles with rambling, structuring answers (STAR method), and connecting experience to the role.
- **Feedback Deficit** — No access to professional career coaches; peer feedback is brief and subjective.
- **Anxiety & Lack of Confidence** — Exits interviews with a vague sense of underperformance and no actionable path to improve.

---

## 3. MVP Hypothesis & Prototype

### Hypothesis
> If we provide candidates with a **realistic, interactive, and repeatable mock interview environment** powered by role-specific AI, they will build structured communication habits and increase their self-confidence — leading to higher interview pass rates.

### First Prototype
- **Platform URL**: https:// *(To Be Determined)*
- **Tech Stack**:
  - **Frontend**: Astro (Landing Page), React / Vite (Dashboard)
  - **Backend**: Hono (Node.js/TypeScript)
  - **Database**: Supabase (PostgreSQL)
- **Core Functionality**:
  - Role-specific interactive question generation
  - Voice-only mock response capture
  - Actionable feedback on structure, clarity, and relevance

---

## 4. Key MVP Features

### A. Role Selection & Interview Context Setup
- Select target role (e.g., Software Engineer, Product Manager, Marketing Associate).
- Upload or paste the job description to personalize the question set.

### B. Interactive Mock Interview Session
- AI generates questions sequentially based on role and JD.
- Candidates respond via voice only (text-chat mode removed for strict voice focus).
- Realistic pacing that simulates a real interview flow.

### C. Instant AI Feedback Engine
- Analyzes answers for structure (STAR method), relevance, and brevity.
- Highlights rambling or points lacking specific evidence.
- Provides a revised version — *"What you could have said"* — to guide improvement.

### D. Voice-Enabled Backend Services & APIs (Hono / Node.js)
- **Architecture**: TypeScript codebase powered by Hono for HTTP API routing and Node's native websocket capabilities for real-time streams.
- **Core AI Voice Flow**: User voice input transcribed to text at frontend → Sent over WebSocket to backend → LLM/Chat Engine generates response → Sent back to frontend → Read aloud via text-to-speech.
- REST HTTP Endpoints:
  - `GET /health` - Health check endpoint.
  - `POST /payments/create-checkout` - Generates a secure checkout payment link using Mayar API based on target plan (Pro or 14-Day Sprint).
  - `POST /webhook/mayar` - Receives payment status updates from Mayar, validates transaction signatures, updates user tiers, and syncs history.
- **WebSocket Endpoint**:
  - `WS /ws/voice` - Real-time interview session using WebSocket connection handling events like `session.started`, `user.transcript`, `assistant.text`, and `error`.

---

## 5. System Architecture

```mermaid
flowchart LR
    subgraph User["👤 Candidate (Browser / App)"]
        U1[Role Selection]
        U2[JD Input]
        U3[Answer Input\nText / Voice]
    end

    subgraph Backend["⚙️ Backend"]
        B1[Session Manager]
        B2[Question Generator]
        B3[Answer Analyzer]
        B4[Progress Tracker]
    end

    subgraph AI["🤖 AI Engine"]
        A1[Role-Specific\nQuestion Model]
        A2[Answer Evaluation\nSTAR · Clarity · Relevance]
        A3[Feedback & Suggestion\nGenerator]
    end

    subgraph Storage["🗄️ Database (Supabase)"]
        S1[User Profiles]
        S2[Session History]
        S3[Score & Progress]
    end

    U1 & U2 --> B1
    B1 --> B2
    B2 --> A1
    A1 --> U3
    U3 --> B3
    B3 --> A2
    A2 --> A3
    A3 --> B4
    B4 --> S2 & S3
    B4 --> User
```

### Database Schema (ERD)

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string full_name
        string role "e.g., student, job_seeker, admin"
        string tier "e.g., free, pro, b2b"
        string subscription_status "e.g., active, inactive, canceled"
        string target_role "e.g., software_engineer"
        text job_description "Default job description template"
        timestamp created_at
        timestamp updated_at
    }

    organizations {
        uuid id PK
        string name
        string subscription_tier "e.g., b2b"
        integer max_members
        timestamp created_at
        timestamp updated_at
    }

    organization_members {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string role "e.g., admin, member"
        timestamp created_at
    }

    subscriptions {
        uuid id PK
        uuid user_id FK "Nullable (for B2B/Team)"
        uuid organization_id FK "Nullable (for individual Pro)"
        string tier "e.g., pro, b2b"
        string status "e.g., active, past_due, canceled, unpaid"
        decimal price
        string billing_cycle "e.g., monthly, yearly"
        timestamp current_period_start
        timestamp current_period_end
        boolean cancel_at_period_end
        timestamp created_at
        timestamp updated_at
    }

    payments {
        uuid id PK
        uuid subscription_id FK
        uuid user_id FK
        string invoice_id
        string payment_gateway "e.g., mayar"
        string transaction_id
        decimal amount
        string status "e.g., pending, settlement, capture, expire, refund"
        string payment_method "e.g., gopay, qris, credit_card, va"
        timestamp paid_at
        timestamp created_at
    }

    mock_interviews {
        uuid id PK
        uuid user_id FK
        string target_role
        text job_description "Nullable"
        string status "e.g., started, completed, abandoned"
        integer pre_confidence_score "1-5"
        integer post_confidence_score "1-5"
        integer overall_score "0-100"
        timestamp created_at
        timestamp completed_at
    }

    interview_questions {
        uuid id PK
        uuid mock_interview_id FK
        text question_text
        integer sequence_number
        timestamp created_at
    }

    interview_answers {
        uuid id PK
        uuid interview_question_id FK
        text answer_text
        string response_mode "e.g., text, voice"
        integer voice_duration_seconds "Nullable"
        timestamp created_at
    }

    ai_feedbacks {
        uuid id PK
        uuid interview_answer_id FK
        integer structure_score "0-100"
        integer relevance_score "0-100"
        integer brevity_score "0-100"
        integer overall_score "0-100"
        text feedback_text
        text highlights_rambling
        text what_you_could_have_said
        timestamp created_at
    }

    users ||--o{ organization_members : "belongs to"
    organizations ||--o{ organization_members : "contains"
    users ||--o{ subscriptions : "owns"
    organizations ||--o{ subscriptions : "owns"
    subscriptions ||--o{ payments : "has"
    users ||--o{ payments : "makes"
    users ||--o{ mock_interviews : "takes"
    mock_interviews ||--o{ interview_questions : "contains"
    interview_questions ||--o| interview_answers : "has"
    interview_answers ||--o| ai_feedbacks : "receives"
```

---

## 6. Business Flow Diagrams

### User Journey

```mermaid
flowchart TD
    A([Candidate]) --> B[Discover Interview Masters]
    B --> C{Has Account?}
    C -- No --> D[Sign Up]
    C -- Yes --> E[Log In]
    D --> E
    E --> F[Dashboard]
    F --> G[Setup Interview Session]
    G --> H[Select Target Role]
    H --> I[Paste / Upload Job Description]
    I --> J[Start Mock Interview]
    J --> K[AI Generates Question]
    K --> L[Candidate Answers\ntext or voice]
    L --> M{More Questions?}
    M -- Yes --> K
    M -- No --> N[AI Evaluates All Answers]
    N --> O[Feedback Report\nstructure · clarity · relevance]
    O --> P{Satisfied?}
    P -- No / Want More Practice --> G
    P -- Yes --> Q[Track Progress & Score History]
    Q --> R([Ready for Real Interview])
```

### Feedback Loop & Improvement Cycle

```mermaid
flowchart TD
    P1([Practice Session]) --> P2[AI Feedback Report]
    P2 --> P3{Identify Weak Areas}
    P3 --> P4[Targeted Re-practice\non weak topics]
    P4 --> P1
    P2 --> P5[Score & Progress Log]
    P5 --> P6[Progress Dashboard]
    P6 --> P7([Interview Readiness Score])
```

### Business Model

```mermaid
flowchart TD
    M1([Candidate]) --> M2{Tier}
    M2 -- Free --> M3[3 Mock Interviews / Month\nBasic Feedback]
    M2 -- Pro --> M4[Unlimited Sessions\nAdvanced Feedback\nRole-Specific Deep Dive\nProgress Analytics]
    M2 -- Team / B2B --> M5[Bulk Licenses\nHR Dashboard\nCandidate Tracking\nWhite-label Option\n*Link Hidden for MVP*]

    M3 --> M6{Upgrade?}
    M6 -- Yes --> M4
    M4 --> M7[Revenue: Subscription]
    M5 --> M8[Revenue: B2B Contract]
```

---

## 7. Monetization & Payment System

### Pricing Tiers

| Tier | Price | Quota | Target User |
|---|---|---|---|
| **Free** | Rp 0 / month | 3 mock interviews/month, basic feedback | First-time users, students |
| **Pro** | Rp 99.000 / month | Unlimited sessions, advanced AI feedback, progress analytics, role deep-dive | Active job seekers |
| **14-Day Sprint** | Rp 390.000 / package | Masa aktif program 14 hari, umpan balik instan & terstruktur, posisi spesifik & kustom | Job seekers dengan jadwal wawancara ketat |
| **Team / B2B** *(Link Hidden for MVP)* | Custom | Bulk licenses, HR dashboard, candidate tracking, white-label | Bootcamps, universities, enterprise HR |

### Payment System Flow

```mermaid
flowchart TD
    P1([Candidate]) --> P2{Choose Plan}
    P2 -- Free --> P3[Create Account\nFree Tier Activated\n3 sessions/month]
    P2 -- Pro --> P4[Checkout Page\nRp 99.000/month]
    P2 -- B2B --> P5[Contact Sales\nCustom Quote & Invoice]

    P4 --> P7[Mayar Gateway]

    P7 --> P10{Payment Status}
    P10 -- Success --> P11[Webhook: Payment Confirmed]
    P10 -- Failed --> P12[Retry / Change Method]
    P12 --> P4

    P11 --> P13[Backend: Activate Pro Entitlement]
    P13 --> P14[User Dashboard\nPro Features Unlocked]

    P5 --> P15[Invoice Sent]
    P15 --> P16[Bank Transfer / Corp Card]
    P16 --> P17[Manual Verification\nby Finance Team]
    P17 --> P13
```

### Subscription Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Free: Sign Up
    Free --> Checkout: Upgrade to Pro
    Checkout --> Pro: Payment Success
    Checkout --> Free: Payment Failed
    Pro --> Renewing: Monthly Auto-Renewal
    Renewing --> Pro: Renewal Success
    Renewing --> Cancelled: Renewal Failed / User Cancels
    Cancelled --> Free: Downgrade to Free Tier
    Free --> [*]: Account Deleted
    Pro --> [*]: Account Deleted
```

### Payment Gateways
- 🇮🇩 **Primary Subscription Billing**: Mayar — supports local Indonesian payment methods (QRIS, VA, credit cards, e-wallets) with native integration.

### Refund & Cancellation Policy
- Pro users can cancel anytime; access remains until end of the billing cycle.
- Refund available within **3 days** of first charge if no sessions were consumed.

---

## 8. Success Metrics

| Metric | Description |
|---|---|
| **Completion Rate** | % of users who finish a started mock interview |
| **Repeat Engagement** | Number of mock interviews practiced per user |
| **Performance Progression** | Average improvement score across multiple sessions |
| **Confidence Rating** | Self-reported confidence score before vs. after practice |

---

## 9. Documentation

| File | Description |
|---|---|
| [docs/PRD.md](./docs/PRD.md) | Full Product Requirements Document |
| [docs/DIAGRAM.md](./docs/DIAGRAM.md) | All business flow diagrams |
| [docs/ERD.md](./docs/ERD.md) | Database Entity Relationship Diagram (ERD) |
