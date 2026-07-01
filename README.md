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
  - **Backend**: Node.js
  - **Database**: Supabase (PostgreSQL)
- **Core Functionality**:
  - Role-specific interactive question generation
  - Text or voice-based mock response capture
  - Actionable feedback on structure, clarity, and relevance

---

## 4. Key MVP Features

### A. Role Selection & Interview Context Setup
- Select target role (e.g., Software Engineer, Product Manager, Marketing Associate).
- Upload or paste the job description to personalize the question set.

### B. Interactive Mock Interview Session
- AI generates questions sequentially based on role and JD.
- Candidates respond via text or voice (speech-to-text).
- Realistic pacing that simulates a real interview flow.

### C. Instant AI Feedback Engine
- Analyzes answers for structure (STAR method), relevance, and brevity.
- Highlights rambling or points lacking specific evidence.
- Provides a revised version — *"What you could have said"* — to guide improvement.

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
    M2 -- Team / B2B --> M5[Bulk Licenses\nHR Dashboard\nCandidate Tracking\nWhite-label Option]

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
| **Team / B2B** | Custom | Bulk licenses, HR dashboard, candidate tracking, white-label | Bootcamps, universities, enterprise HR |

### Payment System Flow

```mermaid
flowchart TD
    P1([Candidate]) --> P2{Choose Plan}
    P2 -- Free --> P3[Create Account\nFree Tier Activated\n3 sessions/month]
    P2 -- Pro --> P4[Checkout Page\nRp 99.000/month]
    P2 -- B2B --> P5[Contact Sales\nCustom Quote & Invoice]

    P4 --> P6{Payment Method}
    P6 -- GoPay / OVO / QRIS --> P7[Midtrans Gateway]
    P6 -- VA / Bank Transfer --> P7
    P6 -- Credit Card --> P8{Region}
    P8 -- Indonesia --> P7
    P8 -- International --> P9[Stripe Gateway]

    P7 --> P10{Payment Status}
    P9 --> P10
    P10 -- Success --> P11[Webhook: Payment Confirmed]
    P10 -- Failed --> P12[Retry / Change Method]
    P12 --> P6

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
- 🇮🇩 **Indonesia (primary)**: Midtrans — GoPay, OVO, QRIS, Virtual Account, credit card.
- 🌍 **International (future)**: Stripe — credit/debit card and regional payment methods.

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
