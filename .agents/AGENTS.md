# AGENTS.md — Project Rules & Context Guidelines

## 🤖 General Agent Philosophy (Ponytail / Lazy Senior Dev Mode)

You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

Before writing any code, stop at the first rung that holds:
1. **YAGNI**: Does this need to be built at all?
2. **Codebase Reuse**: Reuse existing helpers, utilities, and components before creating new ones.
3. **Standard Library**: Use standard language features where possible.
4. **Native Platform**: Leverage native browser/platform capabilities.
5. **Existing Dependencies**: Utilize already-installed packages.
6. **Simplicity**: Write the shortest working solution.
7. **Minimum Code**: Write only what is necessary to meet requirements.

### Key Operating Rules
- **Shortest working diff wins**: Deletion over addition. Clean, simple, to the point. No unnecessary abstractions or boilerplate.
- **Immediate Atomic Commits**: After completing changes, stage (`git add`) and commit them immediately using clear atomic commit messages.
- **No browser SpeechSynthesis fallback**: Always use the Supertonic server for TTS synthesis.

---

## 📚 Core Project Documentation Reference
- **[README.md](file:///Users/vickyadifirmansyah/Documents/Projects/interview-masters/README.md)**: Main project overview, system architecture, and setup instructions.
- **[docs/PRD.md](file:///Users/vickyadifirmansyah/Documents/Projects/interview-masters/docs/PRD.md)**: Product Requirement Document detailing vision, personas, features, tech stack, and monetization.
- **[docs/ERD.md](file:///Users/vickyadifirmansyah/Documents/Projects/interview-masters/docs/ERD.md)**: Database schema & Mermaid ERD diagram.
- **[apps/remotion/STORYBOARD.md](file:///Users/vickyadifirmansyah/Documents/Projects/interview-masters/apps/remotion/STORYBOARD.md)**: Remotion motion graphics storyboard & video script breakdown.

---

## 🏗️ Architecture & Component Layout

This is a `pnpm` monorepo containing 5 specialized workspace applications:

### 1. 🌐 Landing Page (`apps/landing-page`)
- **Tech Stack**: Astro static site generator with Vanilla CSS & HTML5 semantics.
- **Guidelines**: High visual aesthetics, smooth dark mode, glassmorphism, SEO & GEO optimized, fast page load.

### 2. 💻 Candidate Dashboard (`apps/dashboard`)
- **Tech Stack**: React + Vite, Radix UI Themes, TanStack React Query, Supabase client.
- **Practice Flow (`Practice.tsx`)**:
  - Speech Recognition (STT) with phonetic normalization and technical vocabulary refiner (`refineSTTTranscriptClient`).
  - Pre-fetches TTS audio before session start via `supertonic.preload(text)` for 0-latency playback.
  - Frequency audio wave analyzers for candidate mic and hiring manager audio pulses.

### 3. ⚙️ Backend REST API (`apps/backend`)
- **Tech Stack**: Hono framework running on Node.js (TypeScript).
- **Core Endpoints**:
  - `POST /api/interview/start`: Initializes mock interview session and returns initial seed question.
  - `POST /api/interview/answer`: Evaluates candidate answer (STAR methodology) and returns next question.
  - `POST /api/interview/finish`: Finalizes mock interview scores and metrics.
  - `POST /payments/create-checkout`: Generates Mayar payment links for Pro & Starter Pass plans.
  - `POST /webhook/mayar`: Validates transaction signatures and activates user subscriptions.

### 4. 🎙️ TTS Engine Microservice (`apps/supertonic`)
- **Tech Stack**: Python Supertonic 3 ONNX TTS running `supertonic serve` on port `7788` (proxied via `/api-tts` in Vite dev server).
- **Endpoint**: `POST /v1/audio/speech` (OpenAI-compatible request body: `model`, `input`, `voice`, `language`, `speed`).
- **Voice Presets (`SupertonicVoice`)**:
  - Female: `Lily` (`'F1'`), `Sarah` (`'F2'`), `Jessica` (`'F3'`), `Olivia` (`'F4'`), `Emily` (`'F5'`).
  - Male: `Alex` (`'M1'`), `James` (`'M2'`), `Robert` (`'M3'`), `Sam` (`'M4'`), `Daniel` (`'M5'`).

### 5. 🎬 Motion Graphics Video Producer (`apps/remotion`)
- **Tech Stack**: Remotion motion graphics engine.
- **Storyboard (`STORYBOARD.md`)**: 25-second promo video composition (5 scenes x 5 seconds, 750 frames @ 30fps) inspired by Apple & Jitter design aesthetics.

---

## 🗄️ Database Context (`supabase`)

PostgreSQL database managed via Supabase:
- **`users`**: Candidate profiles, subscription status, target role, and interview preferences.
- **`question_bank`**: Master repository of role-specific interview questions, indexed by `target_role`, `category`, and `difficulty` (`is_active = true`), containing expected STAR points and sample answers.
- **`mock_interviews`**: Candidate practice sessions, pre/post-confidence scores, and overall metrics.
- **`interview_questions` & `interview_answers`**: Sequential questions and candidate responses.
- **`ai_feedbacks`**: Detailed feedback on STAR structure, brevity, relevance, and "what you could have said".
- **`subscriptions` & `payments`**: Mayar gateway billing logs and active user entitlement tracking.

---

## 💳 Monetization & Payment System (Mayar)

- **Payment Gateway**: Mayar (Sandbox `api.mayar.club` / Production `api.mayar.id`).
- **Pricing Tiers**:
  - **Free**: 3 mock interviews per month.
  - **Starter Pass**: Rp 9.000 / package (3 sessions, pay-per-use).
  - **Pro**: Rp 29.000 / month (Unlimited sessions, advanced analytics & deep-dive feedback).
