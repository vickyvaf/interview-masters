# Interview Masters — Business Flow Diagrams

## 1. High-Level User Journey

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

---

## 2. System Architecture Flow

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

## 3. Feedback Loop & Improvement Cycle

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

---

## 4. Business Model Flow

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

## 5. Payment System Flow

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

---

## 6. Subscription Lifecycle

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
