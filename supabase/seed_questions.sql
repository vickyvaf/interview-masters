-- Master Question Bank Seed Script
-- Auto-generated seed data for question_bank table

INSERT INTO question_bank (target_role, category, difficulty, question_text, expected_points, sample_star_answer, is_active)
VALUES
(
    'Frontend Developer',
    'General',
    'easy',
    'Ceritakan tentang pengalaman Anda membangun aplikasi Frontend dan stack teknologi yang paling sering Anda gunakan.',
    ARRAY['Latar belakang pengalaman Frontend', 'Framework utama (React/Next.js/Vue)', 'State management & Styling kit', 'Pencapaian proyek utama'],
    'Situation: Memulai karir 3 tahun sebagai Frontend Engineer. Task: Mengembangkan aplikasi web interaktif skala sedang-besar. Action: Memanfaatkan React, TypeScript, TailwindCSS, dan Zustand untuk arsitektur clean. Result: Berhasil merilis 4 aplikasi web dengan performa tinggi dan kepuasan pengguna 95%.',
    true
),
(
    'Frontend Developer',
    'General',
    'easy',
    'Bagaimana cara Anda tetap up-to-date dengan perkembangan ekosistem Frontend yang berubah sangat cepat?',
    ARRAY['Membaca dokumentasi resmi & changelog', 'Mengikuti newsletter/blog seperti React Status & Vercel', 'Eksperimen side-project', 'Komunitas lokal/global'],
    'Situation: Ekosistem Frontend berinovasi sangat cepat seperti Server Actions dan Compiler baru. Task: Menjaga keahlian tetap relevan. Action: Membaca RFC resmi, mencoba fitur baru di side-project akhir pekan, dan mendiskusikan temuan di tech-sharing mingguan tim. Result: Tim dapat mengadopsi optimasi build terbaru lebih cepat.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'easy',
    'Apa perbedaan antara State dan Props dalam React, dan kapan Anda menggunakan masing-masing?',
    ARRAY['Penjelasan State (mutable lokal)', 'Penjelasan Props (immutable dari parent)', 'Data flow top-down', 'Kapan menggunakan masing-masing'],
    'Situation: Anggota tim pemula kebingungan mengelola data komponen. Task: Menjelaskan best practice data flow. Action: Mengedukasi bahwa Props bersifat read-only dari parent dan State adalah mutable lokal. Result: Struktur komponen tim menjadi lebih teratur dan bebas bug re-render.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'easy',
    'Jelaskan bagaimana Event Delegation bekerja pada JavaScript dan mengapa hal ini penting untuk efisiensi DOM?',
    ARRAY['Event Bubbling & Capturing', 'Single Event Listener pada parent', 'Penghematan memori', 'Penanganan elemen dinamis'],
    'Situation: List produk dengan 1000+ item memiliki event listener terpasang pada tiap item, membuat memori melonjak. Task: Memperbaiki efisiensi memori DOM. Action: Menerapkan Event Delegation dengan memasang 1 listener di elemen parent <ul> dan menggunakan e.target. Result: Penggunaan memori DOM berkurang 70%.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'easy',
    'Apa perbedaan utama antara CSS Flexbox dan CSS Grid, serta kapan waktu terbaik menggunakan masing-masing?',
    ARRAY['Flexbox untuk 1 dimensi (row/column)', 'CSS Grid untuk 2 dimensi (row & column)', 'Use case spesifik masing-masing', 'Alignment & distribution'],
    'Situation: Layout dashboard kompleks bertabrakan di tampilan mobile. Task: Merapikan tata letak komponen. Action: Menggunakan CSS Grid untuk struktur utama dashboard (2D) dan Flexbox untuk aligment navbar & tombol (1D). Result: Tampilan fully responsive di semua ukuran layar.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'medium',
    'Bagaimana cara kerja useEffect Hook dan bagaimana Anda mencegah timbulnya infinite re-render atau memory leak?',
    ARRAY['Dependency Array (empty', 'populated', 'missing)', 'Cleanup function (unsubscribe/abort)', 'Stale closure problem', 'Strict Mode double-invoke'],
    'Situation: Fitur live notification mengalami memory leak dan request berulang ke API. Task: Memperbaiki lifecycle effect. Action: Mengisi dependency array dengan tepat dan menambahkan cleanup function return () => socket.disconnect(). Result: Kebocoran memori teratasi dan konsumsi CPU stabil.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'medium',
    'Kapan Anda memilih menggunakan Local State (useState), Context API, atau Global State Manager seperti Zustand/Redux?',
    ARRAY['Local State untuk komponen terisolasi', 'Context API untuk low-velocity global data (theme/auth)', 'Zustand/Redux untuk high-velocity & complex state', 'Avoid prop drilling'],
    'Situation: Aplikasi mengalami prop drilling hingga 5 level komponen untuk data keranjang belanja. Task: Memilih state architecture yang scalable. Action: Menggunakan Zustand untuk keranjang belanja agar komponen hanya re-render pada selector yang berubah. Result: Kode bersih dan render terpangkas 50%.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'medium',
    'Bagaimana TypeScript membantu Anda mencegah runtime error di Frontend, dan apa bedanya Type vs Interface?',
    ARRAY['Static type checking', 'Autocomplete & DX', 'Interface declaration merging', 'Type alias union/intersection'],
    'Situation: Sering terjadi TypeError: Cannot read property of undefined saat konsumsi API backend. Task: Mengurangi bug runtime. Action: Mengadopsi TypeScript secara ketat dengan interface kontrak DTO API. Result: Bug runtime di production berkurang hingga 80%.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'medium',
    'Bagaimana Anda menangani race condition pada API request yang dipanggil berturut-turut saat user mengetik di search bar?',
    ARRAY['Debouncing / Throttling', 'AbortController (cancelling stale request)', 'Race condition identification', 'UX loading state'],
    'Situation: Hasil pencarian di UI menampilkan data yang salah jika request lambat selesai belakangan. Task: Menjamin data pencarian selalu sesuai ketikan terakhir. Action: Mengombinasikan Debounce 300ms dengan AbortController.abort() pada request sebelumnya. Result: Hasil pencarian 100% konsisten.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'medium',
    'Jelaskan perbedaan antara Client-Side Rendering (CSR), Server-Side Rendering (SSR), dan Static Site Generation (SSG).',
    ARRAY['CSR (SPA/React)', 'SSR (Next.js server render per request)', 'SSG (Pre-rendered build time)', 'Impact pada SEO & Time to First Byte (TTFB)'],
    'Situation: Landing page produk memiliki skor SEO buruk di Google Search. Task: Meningkatkan keterbacaan bot SEO. Action: Memindahkan landing page dari CSR ke SSG/SSR menggunakan Next.js. Result: Skor Lighthouse SEO naik dari 45 ke 98 dan indexing Google lebih cepat.',
    true
),
(
    'Frontend Developer',
    'Technical',
    'hard',
    'Apa yang dimaksud dengan Mismatch Hydration pada SSR (Next.js/Astro) dan bagaimana cara mendiagnosis serta memperbaikinya?',
    ARRAY['Penyebab: Perbedaan HTML Server vs DOM Client', 'Server-side vs Client-side evaluation (window/localStorage/Date)', 'SuppressHydrationWarning vs useEffect mounting', 'Debugging console error'],
    'Situation: Console prod dipenuhi error Hydration failed because initial UI does not match. Task: Menghilangkan error hydration. Action: Memindahkan akses localStorage dan Date.now() ke dalam useEffect setelah komponen dipastikan mounted di client. Result: Error hydration bersih total.',
    true
),
(
    'Frontend Developer',
    'Performance',
    'medium',
    'Bagaimana langkah-langkah Anda mengoptimalkan performa aplikasi React yang mengalami re-render berlebihan dan bundle size membengkak?',
    ARRAY['React Profiler analysis', 'React.memo & useCallback/useMemo', 'Tree shaking & dynamic import', 'Bundle analyzer'],
    'Situation: Ukuran JS bundle utama mencapai 4.5 MB. Task: Mengurangi bundle size & TTI. Action: Menganalisis via Bundle Analyzer, mengganti moment.js dengan dayjs, dan menerapkan code-splitting per route. Result: Ukuran bundle turun ke 800 KB dan TTI membaik 60%.',
    true
),
(
    'Frontend Developer',
    'Performance',
    'hard',
    'Bagaimana Anda meningkatkan nilai Core Web Vitals (LCP, INP, CLS) pada website e-commerce yang memiliki banyak gambar dan skrip pihak ketiga?',
    ARRAY['LCP: Next/Image optimization & fetchpriority', 'INP: Yielding to main thread (requestIdleCallback/setTimeout)', 'CLS: Reserved dimension ratios (width/height)', 'Third-party script deferring'],
    'Situation: Nilai Core Web Vitals merah di Search Console karena gambar banner besar dan script analytics. Task: Mencapai status Green Vitals. Action: Menggunakan format WebP/AVIF dengan srcset, menset fetchpriority=high untuk hero image, dan defer analytics script. Result: LCP turun dari 4.2s ke 1.8s dan INP < 150ms.',
    true
),
(
    'Frontend Developer',
    'Performance',
    'medium',
    'Bagaimana Anda mengimplementasikan strategi Lazy Loading dan Dynamic Import untuk rute dan komponen berat?',
    ARRAY['React.lazy & Suspense', 'Dynamic import import()', 'Fallback skeleton loader', 'Intersection Observer untuk image/section'],
    'Situation: Halaman Checkout mendownload modal heavy chart padahal jarang dibuka. Task: Memuat komponen hanya saat dibutuhkan. Action: Membungkus komponen Chart dengan React.lazy() dan Suspense fallback. Result: Initial page load berkurang 350 KB.',
    true
),
(
    'Frontend Developer',
    'System Design',
    'hard',
    'Bagaimana Anda merancang arsitektur Micro-Frontend untuk aplikasi skala besar yang dikerjakan oleh beberapa tim terpisah?',
    ARRAY['Module Federation (Webpack 5 / Vite)', 'Single-spa / Shell app pattern', 'Shared state & Event Bus', 'CSS Isolation', 'Independent Deployment Pipeline'],
    'Situation: 5 tim frontend saling bertabrakan rilis karena monolit web app. Task: Memisah aplikasi menjadi modul independen. Action: Menggunakan Webpack Module Federation dengan shell app dan shared design system. Result: Tim dapat deploy modul secara independen tanpa bug regresi.',
    true
),
(
    'Frontend Developer',
    'System Design',
    'hard',
    'Bagaimana Anda merancang Design System dan Component Library yang terisolasi, re-usable, dan teruji untuk digunakan di seluruh tim organisasi?',
    ARRAY['Atomic Design Methodology', 'Storybook for documentation', 'Tailwind / CSS Variables design tokens', 'Radix / Headless UI for accessibility', 'NPM Private Package / Monorepo release'],
    'Situation: Setiap aplikasi internal perusahaan memiliki tampilan tombol dan modal yang konsisten. Task: Mengstandardisasi UI komponen. Action: Membangun Design System berbasis Tailwind & Radix UI di Monorepo dengan Storybook. Result: Kecepatan pengembangan UI baru meningkat 40%.',
    true
),
(
    'Frontend Developer',
    'System Design',
    'hard',
    'Bagaimana Anda merancang arsitektur web app Offline-First menggunakan Service Workers dan IndexedDB?',
    ARRAY['Service Worker Caching (Stale-While-Revalidate/Cache First)', 'IndexedDB storage via Dexie.js', 'Background Sync API', 'Conflict resolution on reconnect'],
    'Situation: Aplikasi inspeksi lapangan sering digunakan di daerah tanpa sinyal internet. Task: Mendukung akses offline penuh. Action: Menerapkan Workbox Service Worker dan IndexedDB untuk menyimpan draf formulir lokal dengan sync otomatis saat online. Result: Pengguna dapat bekerja tanpa hambatan koneksi.',
    true
),
(
    'Frontend Developer',
    'Security',
    'medium',
    'Bagaimana Anda mencegah serangan XSS (Cross-Site Scripting) dan CSRF pada aplikasi Web Single Page Application (SPA)?',
    ARRAY['Sanitasi HTML (DOMPurify)', 'Hindari dangerouslySetInnerHTML', 'Content Security Policy (CSP) headers', 'SameSite Cookies vs Anti-CSRF Tokens'],
    'Situation: Fitur komentar pengguna rentan disisipi skrip jahat. Task: Mengamankan UI dari XSS. Action: Menggunakan DOMPurify untuk mensanitasi input kaya teks dan memasang strict CSP header pada web server. Result: Aplikasi aman dari eksekusi script injeksi.',
    true
),
(
    'Frontend Developer',
    'Security',
    'medium',
    'Di mana lokasi terbaik menyimpan Access Token dan Refresh Token di Frontend dari sudut pandang keamanan?',
    ARRAY['HttpOnly SameSite Cookie (Paling aman)', 'In-Memory (JS variable) untuk Access Token', 'Bahaya localStorage/sessionStorage terhadap XSS', 'Silent refresh pattern'],
    'Situation: Token JWT disimpan di localStorage sehingga rentan dibaca oleh script terinjeksi XSS. Task: Mengamankan mekanisme autentikasi. Action: Mengubah simpanan Refresh Token ke HttpOnly SameSite Cookie dan Access Token di in-memory state. Result: Kredensial pengguna terlindungi dari pencurian token.',
    true
),
(
    'Frontend Developer',
    'Accessibility',
    'easy',
    'Mengapa Accessibility (a11y) penting dan bagaimana Anda memastikan komponen web dapat diakses navigasi keyboard dan Screen Reader?',
    ARRAY['Semantic HTML elements', 'ARIA attributes (aria-label', 'aria-expanded)', 'Focus management & Focus rings', 'Screen reader testing (NVDA/VoiceOver)'],
    'Situation: Modal custom tidak bisa ditutup dengan tombol ESC dan fokus keyboard jebol ke latar belakang. Task: Memperbaiki aksesibilitas modal. Action: Menerapkan Focus Trap dan mendengarkan event keydown ESC serta menambahkan aria-modal=true. Result: Modal lolos pengujian audit WCAG AA.',
    true
),
(
    'Frontend Developer',
    'Behavioral',
    'medium',
    'Ceritakan pengalaman saat Anda berbeda pendapat dengan UI/UX Designer mengenai fungsionalitas komponen yang sulit diimplementasikan.',
    ARRAY['Empati terhadap pengguna & desainer', 'Analisis kepraktisan & trade-off teknis', 'Kompromi & alternatif prototype', 'Pengambilan keputusan berbasis data'],
    'Situation: Desainer membuat efek animasi 3D kompleks di halaman checkout yang berisiko menurunkan performa HP low-end. Task: Mencapai kesepakatan terbaik. Action: Membuat 2 prototype cepat (efek 3D vs CSS micro-animation) dan menunjukkan dampak latency-nya. Result: Tim sepakat memakai micro-animation yang ringan dan estetik.',
    true
),
(
    'Frontend Developer',
    'Behavioral',
    'medium',
    'Ceritakan insiden bug kritis yang terjadi di production Frontend dan bagaimana langkah penanganan Anda dari rilis hotfix hingga post-mortem.',
    ARRAY['Triage & isolasi masalah', 'Rollback vs Hotfix cepat', 'Komunikasi dengan tim & stakeholder', 'Post-mortem & penambahan regression test'],
    'Situation: Tombol bayar tidak bisa diklik pada browser Safari setelah rilis malam. Task: Mengatasi bug kritis secepatnya. Action: Mengidentifikasi polyfill CSS gap pada Safari, merilis hotfix dalam 20 menit, dan menambahkan E2E test Playwright untuk Safari di CI/CD. Result: Kerugian transaksi berhasil diminimalisir.',
    true
),
(
    'Frontend Developer',
    'Behavioral',
    'medium',
    'Bagaimana Anda meyakinkan Product Manager untuk memberikan alokasi waktu refactoring legacy frontend code yang sudah berantakan?',
    ARRAY['Menerjemahkan tech debt menjadi dampak bisnis (kecepatan rilis/bug rate)', 'Menyajikan data metrics (Lighthouse/Build time)', 'Refactoring bertahap (boy scout rule)', 'Bukan rewrite total'],
    'Situation: Kode codebase lama membuat waktu pengembangan fitur baru melambat 2 kali lipat. Task: Mendapatkan approval refactoring dari PM. Action: Menyajikan data bahwa 60% waktu sprint habis untuk bug-fixing akibat tech debt dan mengusulkan refactoring bertahap di tiap sprint (20%). Result: PM setuju dan kecepatan rilis meningkat 35%.',
    true
),
(
    'Frontend Developer',
    'Behavioral',
    'easy',
    'Ceritakan pengalaman Anda membantu atau mentoring junior developer dalam memahami best practice modern Frontend.',
    ARRAY['Code Review bertahap dengan penjelasan alasan (the why)', 'Pair programming', 'Dokumentasi & Guideline', 'Mendukung rasa percaya diri'],
    'Situation: Junior dev sering mengalami kendala pemahaman async JavaScript dan state management. Task: Membantu meningkatkan keahlian junior dev. Action: Mengadakan sesi pair programming mingguan dan memberikan feedback code review yang konstruktif beserta link referensi. Result: Junior dev mampu menyelesaikan tugas mandiri tanpa blocker.',
    true
),
(
    'Frontend Developer',
    'Behavioral',
    'medium',
    'Bagaimana Anda mengelola kualitas kode dan testing ketika dihadapkan pada tenggat waktu rilis fitur yang sangat ketat?',
    ARRAY['Fokus pada Critical Path testing (Unit test core logic & E2E checkout)', 'Pragmatic trade-off (manual QA vs automated test)', 'Linter & Automated formatting (ESLint/Prettier)', 'Dokumentasi sisa debt'],
    'Situation: Fitur promo baru harus rilis dalam 2 hari untuk campaign marketing. Task: Memastikan fitur rilis tepat waktu tanpa merusak fungsi kritis. Action: Menulis Unit Test khusus untuk kalkulasi diskon dan E2E test untuk alur checkout, sementara komponen UI dites manual. Result: Fitur rilis tepat waktu zero-critical bug.',
    true
),
(
    'Backend Developer',
    'Technical',
    'hard',
    'Bagaimana Anda menangani race condition saat dua request bersamaan memperbarui saldo pengguna?',
    ARRAY['Database locking (Pessimistic/Optimistic)', 'Atomic transactions', 'Idempotency key'],
    'Situation: Sistem e-wallet mengalami kerugian karena race condition. Task: Mencegah double spending. Action: Menerapkan SELECT FOR UPDATE pada PostgreSQL transaction dan Idempotency Key pada API. Result: Transaksi 100% konsisten.',
    true
),
(
    'Backend Developer',
    'System Design',
    'medium',
    'Bagaimana Anda merancang sistem caching menggunakan Redis untuk meng-handle traffic spike?',
    ARRAY['Cache eviction policy', 'Cache stampede prevention', 'TTL', 'Write-through/Write-back'],
    'Situation: Database down saat flash sale. Task: Menahan beban 50k RPS. Action: Menerapkan Redis cluster dengan Cache Aside Pattern dan TTL dinamis. Result: Load database berkurang 85%.',
    true
),
(
    'Backend Developer',
    'Behavioral',
    'medium',
    'Ceritakan pengalaman Anda saat terjadi insiden outage di production dan bagaimana Anda menyelesaikannya.',
    ARRAY['Post-mortem', 'Incident response', 'Root cause analysis', 'Monitoring/Alerting'],
    'Situation: Server API mati karena memory leak jam 2 pagi. Task: Restorasi service secepatnya. Action: Rollback ke commit stabil terakhir, analisis heap dump, dan pasang alert memory threshold. Result: Service pulih dalam 15 menit.',
    true
),
(
    'Product Manager',
    'Behavioral',
    'medium',
    'Bagaimana Anda memprioritaskan fitur ketika ada konflik keinginan antara tim Engineering dan Stakeholder Bisnis?',
    ARRAY['Framework prioritisasi (RICE/Kano)', 'Analisis dampak bisnis', 'Kapasitas teknik', 'Komunikasi kompromi'],
    'Situation: Stakeholder minta fitur A cepat, Dev tim minta refactoring teknis. Task: Mengambil keputusan seimbang. Action: Menggunakan RICE score dan mengalokasikan 20% sprint budget untuk tech debt. Result: Rilis fitur tepat waktu dan stabilitas sistem terjaga.',
    true
),
(
    'Product Manager',
    'Product Sense',
    'hard',
    'Jika engagement pengguna pada fitur utama turun 20% minggu ini, bagaimana langkah analisis Anda?',
    ARRAY['Breakdown data kualitatif/kuantitatif', 'Funnel analysis', 'User feedback', 'AB testing/Bug check'],
    'Situation: Daily Active Users turun tiba-tiba. Task: Mengidentifikasi masalah utama. Action: Memeriksa funnel analytics per versi app dan menemukan bug pada tombol checkout iOS. Result: Bug diperbaiki dan DAU kembali normal.',
    true
),
(
    'General',
    'Behavioral',
    'easy',
    'Ceritakan tentang diri Anda dan mengapa Anda tertarik dengan posisi ini.',
    ARRAY['Latar belakang singkat', 'Pencapaian utama', 'Alasan tertarik pada perusahaan', 'Relevansi keahlian'],
    'Situation: Pembuka wawancara kerja. Task: Memberikan impresi awal yang kuat dalam 2 menit. Action: Menjelaskan background 3 tahun di software dev dan passion pada AI products. Result: Pewawancara tertarik mendalami pengalaman proyek AI saya.',
    true
);
