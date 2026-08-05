-- Seed data for Master Question Bank (question_bank)
-- Run this in Supabase SQL Editor or via migrate.sh to populate sample datasets across different roles.

INSERT INTO question_bank (target_role, category, difficulty, question_text, expected_points, sample_star_answer, is_active)
VALUES
-- === FRONTEND DEVELOPER ===
(
    'Frontend Developer',
    'Technical',
    'easy',
    'Apa perbedaan antara State dan Props dalam React, dan kapan Anda menggunakan masing-masing?',
    ARRAY['Penjelasan State (mutable lokal)', 'Penjelasan Props (immutable dari parent)', 'Immutability principle', 'Unidirectional data flow'],
    'Situation: Anggota tim pemula kebingungan mengelola data komponen. Task: Menjelaskan best practice data flow. Action: Mengedukasi bahwa Props bersifat read-only dari parent dan State adalah mutable lokal. Result: Struktur komponen tim menjadi lebih teratur dan bebas bug re-render.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'medium',
    'Bagaimana Anda mengoptimalkan performa aplikasi React yang mengalami re-render berlebihan?',
    ARRAY['React.memo & PureComponent', 'useCallback & useMemo hooks', 'Code splitting & React.lazy', 'Virtualization (react-window/virtualized)'],
    'Situation: Halaman dashboard terasa lambat saat scroll data 5000+ item. Task: Mengurangi re-render tak perlu. Action: Menggunakan React.memo pada item list, virtualization untuk DOM, dan useMemo untuk kalkulasi berat. Result: Frame rate naik dari 30 FPS ke 60 FPS stabil.',
    true
),
(
    'Frontend Developer',
    'System Design',
    'hard',
    'Bagaimana Anda merancang arsitektur Micro-Frontend untuk aplikasi web skala besar?',
    ARRAY['Module Federation (Webpack 5 / Vite)', 'Single-spa / Shell app pattern', 'Shared state & Event Bus', 'CSS Isolation (CSS Modules/Tailwind)', 'Independent Deployment Pipeline'],
    'Situation: 5 tim frontend saling bertabrakan rilis karena monolit web app. Task: Memisah aplikasi menjadi modul independen. Action: Menggunakan Webpack Module Federation dengan shell app dan shared design system. Result: Tim dapat deploy modul secara independen tanpa bug regresi.',
    true
),

-- === BACKEND DEVELOPER ===
(
    'Backend Developer',
    'Technical',
    'hard',
    'Bagaimana Anda menangani race condition saat dua request bersamaan memperbarui saldo pengguna?',
    ARRAY['Pessimistic vs Optimistic Locking', 'Database Transactions & Isolation Levels', 'Idempotency Key pada API', 'Redis Distributed Lock (Redlock)'],
    'Situation: Sistem e-wallet mengalami kerugian karena race condition saldo. Task: Mencegah double spending. Action: Menerapkan SELECT FOR UPDATE pada PostgreSQL transaction dan Idempotency Key pada endpoint top-up. Result: Transaksi 100% konsisten tanpa race condition.',
    true
),
(
    'Backend Developer',
    'System Design',
    'medium',
    'Bagaimana Anda merancang sistem caching menggunakan Redis untuk meng-handle traffic spike?',
    ARRAY['Cache-Aside / Write-Through pattern', 'Cache Eviction Policies (LRU/LFU)', 'Cache Stampede prevention', 'TTL Strategy'],
    'Situation: Database crash saat event flash sale 11.11. Task: Menahan beban 50,000 RPS. Action: Menerapkan Redis cluster dengan Cache-Aside pattern dan TTL jitter untuk mencegah stampede. Result: DB load berkurang 85% dan ketersediaan 99.99%.',
    true
),
(
    'Backend Developer',
    'Behavioral',
    'medium',
    'Ceritakan pengalaman Anda saat terjadi insiden production outage dan langkah mitigasi yang diambil.',
    ARRAY['Incident response & triage', 'Monitoring & Alerting thresholds', 'Root Cause Analysis (RCA)', 'Blameless Post-mortem'],
    'Situation: Server API outage jam 2 pagi karena OOM (Out Of Memory). Task: Restorasi service secepatnya. Action: Immediately rollback ke commit sebelumnya, ambil heap dump untuk analisis, dan perbaiki memory leak pada DB connection pool. Result: Service pulih dalam 15 menit.',
    true
),

-- === PRODUCT MANAGER ===
(
    'Product Manager',
    'Behavioral',
    'medium',
    'Bagaimana Anda memprioritaskan fitur ketika ada konflik keinginan antara tim Engineering dan Stakeholder Bisnis?',
    ARRAY['Framework Prioritisasi (RICE / Kano Model)', 'Analisis dampak bisnis vs effort teknis', 'Alokasi Tech Debt Budget', 'Komunikasi & Stakeholder Alignment'],
    'Situation: Stakeholder minta fitur baru secepatnya, sementara eng team minta refactoring tech debt. Task: Mengambil keputusan yang seimbang. Action: Menggunakan RICE score dan mengalokasikan 20% kapasitas sprint khusus tech debt. Result: Rilis fitur tetap tepat waktu dan stabilitas sistem terjaga.',
    true
),
(
    'Product Manager',
    'Product Sense',
    'hard',
    'Jika engagement pengguna pada fitur utama turun 20% minggu ini, bagaimana langkah analisis Anda?',
    ARRAY['Funnel Analytics Breakdown', 'Segmentasi User (Cohort analysis)', 'Kualitatif feedback & Bug check', 'A/B Testing validation'],
    'Situation: Daily Active Users (DAU) turun 20% secara tiba-tiba. Task: Memfind out root cause dan solusi secepatnya. Action: Memeriksa funnel telemetry per OS & App version, menemukan bug pada tombol checkout di iOS v2.1. Result: Push hotfix dalam 4 jam dan DAU kembali normal.',
    true
),

-- === DATA ENGINEER ===
(
    'Data Engineer',
    'Technical',
    'hard',
    'Bagaimana Anda merancang pipeline ETL/ELT skala besar untuk streaming data terdistribusi?',
    ARRAY['Apache Kafka / Redpanda messaging', 'Batch vs Streaming processing (Spark/Flink)', 'Data Warehousing (Snowflake/BigQuery)', 'Data Quality Validation & Schema Registry'],
    'Situation: Data analytics terlambat 24 jam karena legacy batch script. Task: Merubah menjadi near real-time streaming pipeline. Action: Membangun Kafka stream ingestion yang terhubung ke Apache Flink dan BigQuery. Result: Latency data berkurang dari 24 jam menjadi < 5 detik.',
    true
),

-- === GENERAL / BEHAVIORAL ===
(
    'General',
    'Behavioral',
    'easy',
    'Ceritakan tentang diri Anda dan mengapa Anda tertarik melamar posisi ini.',
    ARRAY['Elevator pitch (Latar belakang profesional)', 'Pencapaian utama yang relevan', 'Alasan spesifik tertarik pada perusahaan', 'Relevansi keahlian dengan kualifikasi peran'],
    'Situation: Pembuka wawancara kerja. Task: Memberikan gambaran kualifikasi dalam 2 menit. Action: Menjelaskan 3 tahun pengalaman di software engineering, fokus pada produk ber-traffic tinggi, dan antusiasme pada AI innovation perusahaan. Result: Pewawancara terkesan dan mendalami diskusi proyek teknis.',
    true
);
