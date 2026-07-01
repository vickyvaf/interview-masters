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
  - **Backend**: Node.js
  - **Database**: Supabase (PostgreSQL)
- **Core Functionality**:
  - Role-specific interactive question generation.
  - Audio/text-based mock response capture.
  - Actionable feedback highlighting structural improvements, clarity, and relevance.

---

## 4. Key MVP Features (Proposed Scope)

### A. Role Selection & Interview Context Setup
- Users can select their target role (e.g., Software Engineer, Product Manager, Marketing Associate).
- Users can upload/paste the job description to personalize questions.

### B. Interactive Mock Interview Session
- AI generates questions sequentially based on the role and job description.
- Candidates can respond via text (or voice input using speech-to-text).
- Realistic pacing simulating a real interview flow.

### C. Instant AI Feedback Engine
- Analyzes candidate answers for structure (STAR method), relevance, and brevity.
- Highlights ramblings or areas lacking specific evidence.
- Provides a revised version ("What you could have said") to guide improvement.

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
| **Free** | Rp 0 / month | 3 mock interviews/month, basic feedback | First-time users, students |
| **Pro** | Rp 99.000 / month | Unlimited sessions, advanced AI feedback, progress analytics, role deep-dive | Active job seekers |
| **Team / B2B** | Custom | Bulk licenses, HR dashboard, candidate tracking, white-label | Bootcamps, universities, enterprise HR |

### Payment Flow
1. User selects a plan (Free → Pro upgrade, or B2B inquiry).
2. For **Pro**: user is directed to checkout (Stripe / Midtrans).
3. Payment gateway processes the transaction and returns a webhook confirmation.
4. Backend activates Pro entitlement on the user account immediately.
5. Monthly auto-renewal via saved card; cancellation allowed anytime (no lock-in).
6. For **B2B**: custom quote → invoice → bank transfer or corporate card.

### Payment Gateway
- **Indonesia (primary)**: Midtrans — supports GoPay, OVO, QRIS, VA, credit card.
- **International (future)**: Stripe — supports credit/debit card and regional methods.

### Refund & Cancellation Policy
- Pro users can cancel anytime; access remains until end of billing cycle.
- Refund available within 3 days of first charge if no sessions were consumed.
