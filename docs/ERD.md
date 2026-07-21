# Entity Relationship Diagram (ERD) - Interview Masters

Based on the [Product Requirement Document (PRD)](file:///Users/vickyadifirmansyah/Documents/Projects/interview-masters/docs/PRD.md), this document details the database design for **Interview Masters** using Supabase (PostgreSQL).

## Database Schema (Mermaid ERD)

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
        string payment_gateway "e.g., doku"
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

## Entity Descriptions

### 1. User & Organization Management
- **`users`**: Represents individuals using the platform. Tiers are defined here to quickly identify accessibility (Free, Pro, B2B).
- **`organizations`**: Necessary for B2B/Team licenses. Groups users under a unified billing quota.
- **`organization_members`**: Junction table mapping users to their respective B2B organizations.

### 2. Billing & Payments
- **`subscriptions`**: Tracks the subscription status (active, canceled, past_due) and the renewal dates for both users (Pro) and organizations (B2B).
- **`payments`**: Records transactional logs coming from DOKU webhooks. Essential for refund processing and tracking monetization.

### 3. Interview Sessions & Analytics
- **`mock_interviews`**: Represents a single mock interview practice session. Contains user feedback like pre- and post-confidence scores to track self-reported progression.
- **`interview_questions`**: Questions generated sequentially for a specific interview session.
- **`interview_answers`**: Candidate responses, supporting both text and speech-to-text inputs.
- **`ai_feedbacks`**: The resulting analysis showing ratings on the STAR method structure, brevity, and relevance, along with suggestions.
