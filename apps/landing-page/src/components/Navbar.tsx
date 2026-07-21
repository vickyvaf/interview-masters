import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SupabaseSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      avatar_url?: string;
      full_name?: string;
      name?: string;
    };
  };
}

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [session, setSession] = React.useState<SupabaseSession | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dashboardUrl = import.meta.env.PUBLIC_DASHBOARD_URL || 'http://localhost:5173';

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    try {
      // 1. Try reading the local cookie first for instant render
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('im_session='));
      if (sessionCookie) {
        const rawValue = decodeURIComponent(sessionCookie.split('=')[1]);
        const parsed = JSON.parse(rawValue) as SupabaseSession;
        if (parsed?.user) {
          setSession(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Error reading local cookie', e);
    }
  }, []);



  React.useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [dropdownOpen]);

  const handleLogout = () => {
    // Clear cookie
    document.cookie = 'im_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    // Clear localStorage
    localStorage.removeItem('sb-dcouzpirkktfxklgqqwv-auth-token');
    setSession(null);
    window.location.reload();
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Why Us', href: '#why-us' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-[99] transition-all duration-300 ${scrolled
        ? 'bg-background/80 backdrop-blur-md py-3 md:py-4 shadow-sm'
        : 'bg-transparent py-4 md:py-6'
        }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between relative">
        {/* Brand/Logo */}
        <a href="#" className="flex items-center group z-10">
          <img src="/logo-new.png" alt="Interview Masters Logo" className="h-8 object-contain" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* CTA Buttons / Profile dropdown */}
        <div className="hidden md:flex items-center gap-4 z-10">
          {session ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="flex items-center gap-2 focus:outline-none cursor-pointer"
              >
                <img
                  src={session.user.user_metadata.avatar_url || '/default-avatar.png'}
                  alt="User profile"
                  className="w-8 h-8 rounded-full border border-border/80 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.user_metadata.full_name || 'User'}`;
                  }}
                />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border/60 rounded-xl shadow-lg py-1 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-2 border-b border-border/30">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {session.user.user_metadata.full_name || 'User'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <a
                      href={dashboardUrl}
                      className="block px-4 py-2 text-xs text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      Dashboard
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-xs text-destructive hover:bg-secondary/60 transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <a href={`${dashboardUrl}/login`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                Sign In
              </a>
              <Button
                asChild
                size="sm"
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <a href={`${dashboardUrl}/register`}>Start Free</a>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-foreground hover:text-muted-foreground focus:outline-none z-10"
          aria-label="Toggle Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background border-b border-border/40 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {link.name}
                </a>
              ))}
              <hr className="border-border/40" />
              {session ? (
                <div className="flex flex-col gap-3 pb-2">
                  <div className="flex items-center gap-3 py-1">
                    <img
                      src={session.user.user_metadata.avatar_url || '/default-avatar.png'}
                      alt="Profile"
                      className="w-9 h-9 rounded-full border border-border/80 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.user_metadata.full_name || 'User'}`;
                      }}
                    />
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {session.user.user_metadata.full_name || 'User'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <a
                    href={dashboardUrl}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Dashboard
                  </a>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors py-1 text-left cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-2">
                  <a
                    href={`${dashboardUrl}/login`}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
                  >
                    Sign In
                  </a>
                  <Button
                    asChild
                    className="w-full rounded-xl py-2.5 text-sm font-semibold bg-primary text-primary-foreground text-center"
                  >
                    <a href={`${dashboardUrl}/register`} onClick={() => setIsOpen(false)}>Start Free</a>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
