# Product Requirement Document (PRD): Interview Masters

## 1. Vision & Founder "Why" (Stage 1 · Build - Q1)

### Problem (Human-Centric)
Interviews are high-pressure, unfair gatekeepers of opportunity. Many capable candidates fail to showcase their true potential not because they lack ability, but because they lack structured practice, immediate feedback, and confidence under pressure.

### Core Belief
Many individuals are fully qualified and capable but fail to perform effectively under traditional interview conditions.

### Why Now?
AI technology enables realistic, personalized, and highly scalable mock interview practice with instant feedback, which was previously either too expensive or inaccessible.

### Mission
To help candidates transform their actual ability into real career opportunities by making interview preparation accessible, measurable, and outcome-driven.

---

## 2. Target Customer & User Persona (Q2)

### Target Segment
- **Primary Persona**: 24-year-old recent college graduate applying for their first serious full-time professional role.
- **Key Characteristics**:
  - Strong academic background (good GPA).
  - Has relevant project portfolios and internship experience.
  - Lacks experience with live, high-pressure professional interviews.

### Core Pain Points
- **Unstructured Preparation**: Relies on scrolling passive resources (YouTube videos, static question lists) that do not build real-time communication skills.
- **Delivery & Formatting**: Struggles with rambling, structuring answers (e.g., using STAR method), and connecting past achievements directly to job requirements.
- **Feedback Deficit**: No access to professional career coaches; peers/friends can only offer brief, subjective, or infrequent mock sessions.
- **Anxiety & Lack of Confidence**: Walks into live Zoom/in-person interviews feeling unprepared and exits with a vague sense of underperformance but no actionable path to fix it.

---

## 3. MVP Hypothesis & Prototype (Q3)

### MVP Hypothesis
If we provide candidates with a realistic, interactive, and repeatable mock interview environment powered by role-specific AI, they will build structured communication habits and increase their self-confidence, leading to higher interview pass rates.

### First Prototype Target
- **Platform URL**: https:// (Placeholder / To Be Determined)
- **Tech Stack**:
  - **Frontend**: Astro (Landing Page), React / Vite (Dashboard)
  - **Backend**: Hono (Node.js/TypeScript)
  - **Database**: Supabase (PostgreSQL)
- **Core Functionality**:
  - Role-specific interactive question generation.
  - Voice-only mock response capture (with settings-based defaults).
  - Actionable feedback highlighting structural improvements, clarity, and relevance.

---

## 4. Key MVP Features (Proposed Scope)

### A. Role Selection & Interview Context Setup
- Users can select or write their target role.
- Users can upload/paste the job description to personalize questions.

### B. Interactive Mock Interview Session
- AI generates questions sequentially based on the role and job description.
- Candidates respond via voice only (text-chat mode removed for strict voice focus).
- Realistic pacing simulating a real interview flow.

### C. Instant AI Feedback Engine
- Analyzes candidate answers for structure (STAR method), relevance, and brevity.
- Highlights ramblings or areas lacking specific evidence.
- Provides a revised version ("What you could have said") to guide improvement.

### D. Voice-Enabled Backend Services & APIs (Hono / Node.js)
- **Architecture**: TypeScript codebase powered by Hono for HTTP API routing and Node's native websocket capabilities for real-time streams.
- **Core AI Voice Flow**: User voice input transcribed to text at frontend → Sent over WebSocket to backend → LLM/Chat Engine generates response → Sent back to frontend → Read aloud via text-to-speech.
- **REST HTTP Endpoints**:
  - `GET /health` - Health check endpoint.
  - `POST /payments/create-checkout` - Generates a secure checkout payment link using Mayar API based on target plan (Pro or Starter Pass).
  - `POST /webhook/mayar` - Receives payment status updates from Mayar, validates transaction signatures, updates user tiers, and syncs history.
- **WebSocket Endpoint**:
  - `WS /ws/voice` - Real-time interview session using WebSocket connection handling events like `session.started`, `user.transcript`, `assistant.text`, and `error`.

---

## 5. Success Metrics

- **Completion Rate**: Percentage of users who finish a started mock interview.
- **Repeat Engagement**: Number of mock interviews practiced per user.
- **Performance Progression**: Average improvement score in answers over multiple sessions.
- **Confidence Rating**: Self-reported confidence score before and after a practice session.

---

## 6. Monetization & Payment System

### Pricing Tiers

| Tier | Price | Quota | Target User |
|---|---|---|---|
| **Free** | Rp 0 / month | 1 mock interview, basic feedback | First-time users, perkenalan awal |
| **Starter Pass** *(Pay-per-use)* | Rp 9.000 / package | 3 mock interviews (masa aktif 1 bulan), umpan balik instan & terstruktur | Candidate kepepet interview & anti-berlangganan (sekali bayar) |
| **Pro** *(Most Popular)* | Rp 29.000 / month | Unlimited sessions, advanced AI feedback, progress analytics, role deep-dive | Active job seekers (latihan rutin sepuasnya) |
| **Team / B2B** *(Link Hidden for MVP)* | Custom | Bulk licenses, HR dashboard, candidate tracking, white-label | Bootcamps, universities, enterprise HR |

### Payment Flow
1. User selects a plan (Free → Pro upgrade or 14-Day Sprint package).
2. User is directed to checkout via **Mayar** (using sandbox `api.mayar.club` in local dev and production `api.mayar.id` in live deployment).
3. Payment gateway processes the transaction and returns a webhook confirmation.
4. Backend activates the respective tier and status on the user account, and logs the transactions inside `subscriptions` and `payments` tables immediately.
5. Monthly subscription billing or package purchase is recorded and managed via Mayar portal.

### Payment Gateway
- **Primary Subscription Billing**: Mayar — supports local Indonesian payment methods (QRIS, VA, credit cards, e-wallets) with native integration.

### Refund & Cancellation Policy
- Pro users can cancel anytime; access remains until end of billing cycle.
- Refund available within 3 days of first charge if no sessions were consumed.
