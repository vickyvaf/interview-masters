import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface IconProps {
  id: number;
  src: string;
}

export interface FloatingIconsHeroProps {
  title: string[];
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  icons: IconProps[];
}

interface ActiveIcon {
  id: number;
  style: React.CSSProperties;
  sizeClass: string;
  src: string;
}

const Icon = ({
  style,
  sizeClass,
  src,
  index,
}: {
  style: React.CSSProperties;
  sizeClass: string;
  src: string;
  index: number;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      style={style}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="absolute hover:z-30"
    >
      <motion.div
        className={cn(
          "flex items-center justify-center bg-card border border-border/50 overflow-hidden blur-sm hover:blur-none transition-all duration-300 cursor-pointer",
          sizeClass
        )}
        animate={{ y: [0, -8, 0, 8, 0], x: [0, 6, 0, -6, 0], rotate: [0, 5, 0, -5, 0] }}
        transition={{
          duration: 5 + Math.random() * 5,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      >
        <img src={src} alt="" className="w-full h-full object-cover" />
      </motion.div>
    </motion.div>
  );
};

const FloatingIconsHero = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & FloatingIconsHeroProps
>(({ className, title, subtitle, ctaText, ctaHref, icons, ...props }, ref) => {
  const [activeIcons, setActiveIcons] = React.useState<ActiveIcon[]>([]);

  React.useEffect(() => {
    // Select 12 random icons
    const shuffled = [...icons].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 12);

    // Medium sizes: scale from ~56px to ~88px
    const sizes = [
      'w-14 h-14 md:w-16 md:h-16 rounded-2xl',
      'w-16 h-16 md:w-20 md:h-20 rounded-3xl',
      'w-20 h-20 md:w-22 md:h-22 rounded-[28px]',
    ];

    // Define 22 staggered anchor points to provide a randomized layout on every mount
    const anchorPoints = [
      // Left Column Area
      { top: 10, left: 6 },
      { top: 22, left: 14 },
      { top: 34, left: 8 },
      { top: 46, left: 18 },
      { top: 58, left: 10 },
      { top: 70, left: 20 },
      { top: 80, left: 8 },
      { top: 88, left: 16 },

      // Right Column Area
      { top: 12, left: 92 },
      { top: 24, left: 82 },
      { top: 36, left: 88 },
      { top: 48, left: 78 },
      { top: 60, left: 90 },
      { top: 72, left: 80 },
      { top: 82, left: 92 },
      { top: 90, left: 84 },

      // Top & Bottom Center Areas
      { top: 7, left: 32 },
      { top: 9, left: 68 },
      { top: 84, left: 30 },
      { top: 91, left: 64 },
    ];

    // Shuffle and pick 12 random coordinates from the pool
    const selectedPoints = [...anchorPoints]
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);

    const instances = selected.map((icon, idx) => {
      const anchor = selectedPoints[idx] || { top: 50, left: 50 };
      
      // Add a small jitter (+/- 2%) to keep a random feel without overlapping
      const jitterTop = (Math.random() - 0.5) * 4; // range [-2, 2]
      const jitterLeft = (Math.random() - 0.5) * 4; // range [-2, 2]

      const top = Math.max(5, Math.min(95, anchor.top + jitterTop));
      const left = Math.max(5, Math.min(95, anchor.left + jitterLeft));

      const sizeClass = sizes[Math.floor(Math.random() * sizes.length)];
      return {
        id: icon.id,
        style: {
          top: `${top}%`,
          left: `${left}%`,
        } as React.CSSProperties,
        sizeClass,
        src: icon.src,
      };
    });

    setActiveIcons(instances);
  }, [icons]);

  return (
    <section
      ref={ref}
      className={cn(
        'relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-background',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 w-full h-full z-0">
        {activeIcons.map((activeIcon, index) => (
          <Icon
            key={activeIcon.id}
            style={activeIcon.style}
            sizeClass={activeIcon.sizeClass}
            src={activeIcon.src}
            index={index}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 text-center px-4 flex flex-col items-center"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.03, // Small delay between each child (letters first, then block elements)
              delayChildren: 0.1,
            },
          },
        }}
      >
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground flex flex-col items-center gap-0 leading-none">
          {title.map((line, idx) => (
            <span key={idx} className="block overflow-hidden h-[1.12em] relative flex items-center justify-center">
              {line.split('').map((char, charIdx) => (
                <motion.span
                  key={charIdx}
                  className="inline-block"
                  variants={{
                    hidden: { y: '110%', opacity: 0 },
                    visible: {
                      y: 0,
                      opacity: 1,
                      transition: {
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    },
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>
        <motion.div
          className="flex flex-wrap justify-center max-w-xl mx-auto mt-4 md:mt-6 text-sm sm:text-base md:text-lg text-muted-foreground text-center leading-snug"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.01, // Speed up subtitle letter entry
              },
            },
          }}
        >
          {subtitle.split(' ').map((word, wordIdx) => (
            <span key={wordIdx} className="inline-block whitespace-nowrap overflow-hidden mr-1.5">
              {word.split('').map((char, charIdx) => (
                <motion.span
                  key={charIdx}
                  className="inline-block"
                  variants={{
                    hidden: { y: '110%', opacity: 0 },
                    visible: {
                      y: 0,
                      opacity: 1,
                      transition: {
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    },
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.div>
        <div className="overflow-hidden w-full mt-8 md:mt-10 flex justify-center px-6">
          <motion.div
            className="w-full sm:w-auto"
            variants={{
              hidden: { y: '100%', opacity: 0 },
              visible: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
          >
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto px-6 py-4 md:px-8 md:py-6 text-sm md:text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            >
              <a href={ctaHref}>{ctaText}</a>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
});

FloatingIconsHero.displayName = 'FloatingIconsHero';

export { FloatingIconsHero };
