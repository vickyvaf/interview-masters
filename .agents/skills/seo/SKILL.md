---
name: seo-and-geo-optimization
description: Apply this skill when editing frontend pages, landing pages, or metadata to ensure maximum visibility on traditional search engines (SEO) and AI-driven search engines (GEO/LLM Search).
---

# SEO & GEO Optimization Guidelines

Use this skill whenever you are modifying, creating, or auditing public-facing pages (especially in `apps/landing-page`) to optimize them for Google search (SEO) and AI search engines like Gemini, ChatGPT, Perplexity (GEO - Generative Engine Optimization).

## Core Principles

1. **AI-Search Friendly (GEO - Generative Engine Optimization)**:
   * **Explicit Entity Definitions**: State clearly what the product is, who it is for, and its unique value proposition (USP) in plain, unambiguous text. AI crawlers rely on explicit statements rather than implicit marketing jargon.
   * **Structured Data (JSON-LD)**: Always include Schema.org JSON-LD microdata (e.g., `Product`, `SoftwareApplication`, `Organization`, `FAQPage`) to help LLMs parse structured relationships and features.
   * **Citation-Friendly Formats**: Structure text using bullet points, tables, and bold key phrases. AI search engines prefer extracting structured lists and highlighted conclusions.

2. **Traditional SEO (Search Engine Optimization)**:
   * **Semantic HTML**: Use proper HTML5 tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`). Ensure only one `<h1>` per page.
   * **Metadata & Open Graph**: Provide complete meta titles (under 60 characters), descriptions (under 160 characters), and Open Graph (OG) tags for social preview.
   * **Fast Loading & Assets**: Optimize images (use modern formats like WebP/AVIF), avoid heavy client-side scripts where static HTML suffices, and implement responsive designs.

## Implementation Checklist

### 1. Metadata Configuration (Astro / HTML)
Ensure every public page includes:
```html
<title>Interview Masters - Simulasi Wawancara Kerja AI Interaktif</title>
<meta name="description" content="Persiapkan diri Anda menghadapi wawancara kerja dengan simulasi berbasis AI interaktif. Dapatkan feedback instan mengenai struktur jawaban, relevansi, dan artikulasi Anda." />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Interview Masters - Simulasi Wawancara Kerja AI" />
<meta property="og:description" content="Simulasi wawancara kerja interaktif dengan AI. Latihan tanpa batas dan dapatkan feedback instan." />
<meta property="og:image" content="/og-image.png" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:title" content="Interview Masters - Simulasi Wawancara Kerja AI" />
<meta property="twitter:description" content="Simulasi wawancara kerja interaktif dengan AI. Latihan tanpa batas." />
<meta property="twitter:image" content="/og-image.png" />
```

### 2. JSON-LD Schema (Place inside `<head>`)
For the main landing page, include a `SoftwareApplication` and `FAQPage` schema:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Interview Masters",
  "operatingSystem": "All",
  "applicationCategory": "EducationalApplication",
  "offers": {
    "@type": "Offer",
    "price": "99000",
    "priceCurrency": "IDR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "120"
  }
}
</script>
```

### 3. Google Sitelinks Optimization Checklist
Sitelinks (seperti tampilan menu navigasi tambahan di hasil pencarian Google) dihasilkan secara otomatis oleh algoritma Google. Untuk memaksimalkan peluang mendapatkannya:
* **Struktur Navigasi Jelas**: Pastikan header menu menggunakan tag HTML semantik `<nav>` dengan link (`<a>`) yang memiliki teks deskriptif (misal: "Fitur Utama", "Paket Harga", "Pertanyaan Umum", "Masuk Akun"). Hindari teks link yang terlalu pendek atau ambigu.
* **Terapkan Sitemap XML**: Selalu daftarkan `sitemap.xml` di Google Search Console yang mendata seluruh rute penting (misal: `/`, `/sync-session`).
* **Sitelinks Search Box Schema**: Gunakan skema `WebSite` dengan properti `potentialAction` untuk mengizinkan search box langsung di hasil Google.
* **SiteNavigationElement Schema**: Definisikan item menu utama menggunakan skema `SiteNavigationElement` agar Google mudah mengurai link-link penting.

```html
<!-- Sitelinks & Search Box Schema (JSON-LD) -->
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Interview Masters",
    "url": "https://interviewmasters.id",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://interviewmasters.id/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "@id": "#header-navigation",
    "name": [
      "Fitur Utama",
      "Paket & Harga",
      "Mulai Gratis",
      "Masuk Akun"
    ],
    "url": [
      "https://interviewmasters.id/#features",
      "https://interviewmasters.id/#pricing",
      "https://dashboard-interviewmasters.netlify.app/register",
      "https://dashboard-interviewmasters.netlify.app/login"
    ]
  }
]
</script>
```

### 4. AI-Scraper Optimization (`robots.txt`)
Ensure AI crawlers are explicitly allowed to index the public landing pages:
```txt
User-agent: Google-Extended
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /
```
