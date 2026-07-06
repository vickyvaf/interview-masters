import * as React from 'react';
import { FloatingIconsHero } from '@/components/ui/floating-icons-hero-section';

// Array of local company logo paths from the public/company folder (now contains all 20 logos)
const demoIcons = [
  { id: 1, src: '/company/astra.png' },
  { id: 2, src: '/company/bca.jpg' },
  { id: 3, src: '/company/bri.jpg' },
  { id: 4, src: '/company/bytedance.png' },
  { id: 5, src: '/company/deloitte.webp' },
  { id: 6, src: '/company/erajaya.jpeg' },
  { id: 7, src: '/company/ey.webp' },
  { id: 8, src: '/company/indomaret.jpg' },
  { id: 9, src: '/company/indosat.png' },
  { id: 10, src: '/company/kai.jpg' },
  { id: 11, src: '/company/mandiri.jpeg' },
  { id: 13, src: '/company/prudential.png' },
  { id: 14, src: '/company/pwc.jpeg' },
  { id: 15, src: '/company/ruangguru.jpg' },
  { id: 16, src: '/company/sampoerna.png' },
  { id: 17, src: '/company/shopee.jpeg' },
  { id: 18, src: '/company/sinarmas.png' },
  { id: 19, src: '/company/telkom.jpg' },
  { id: 20, src: '/company/tokopedia.jpeg' },
];

export default function HeroSection() {
  return (
    <FloatingIconsHero
      title={['Ace Your Interview', 'Land the Job']}
      subtitle="Get your highest salary potential with realistic preparation and instant feedback."
      ctaText="Start Practicing"
      ctaHref={`${import.meta.env.PUBLIC_DASHBOARD_URL || 'http://localhost:5173'}/register`}
      icons={demoIcons}
    />
  );
}
