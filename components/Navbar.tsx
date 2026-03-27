"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawPrint, Menu, X, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/report", label: "Report" },
  { href: "/track", label: "Track" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const notifications = [
  { id: 1, text: "New report #PAW-2024-0848 submitted", time: "Just now", color: "#E47F42", unread: true },
  { id: 2, text: "NGO Friendicoes accepted rescue #PAW-2024-0844", time: "2 min ago", color: "#4FC97E", unread: true },
  { id: 3, text: "Bruno's vaccination complete", time: "15 min ago", color: "#3B9EFF", unread: true },
  { id: 4, text: "Driver Ravi completed 4 rescues today", time: "1 hr ago", color: "#FFE00F", unread: false },
  { id: 5, text: "New NGO application: Animal Aid Unlimited", time: "2 hr ago", color: "#E47F42", unread: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const isDashboard = pathname.startsWith("/ngo") || pathname.startsWith("/admin") || pathname.startsWith("/driver");
  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-paw-orange/20 bg-paw-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-paw-orange/10 transition-colors group-hover:bg-paw-orange/20">
            <PawPrint className="h-5 w-5 text-paw-orange" />
          </div>
          <span className="text-xl font-bold text-paw-orange">
            Paw<span className="text-paw-text">Alert</span>
          </span>
        </Link>

        {/* Center links — desktop */}
        {!isDashboard && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-paw-orange/10 text-paw-orange"
                    : "text-paw-muted hover:text-paw-text hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side: notification bell + CTA + Mobile toggle */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative flex items-center justify-center h-9 w-9 rounded-lg text-paw-muted hover:text-paw-text hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-paw-red text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 rounded-xl border border-paw-orange/20 bg-paw-bg/98 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-paw-orange/10 flex items-center justify-between">
                    <span className="text-sm font-semibold">Notifications</span>
                    <span className="rounded-full bg-paw-red/15 px-2 py-0.5 text-xs font-bold text-paw-red">{unreadCount} new</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-paw-orange/5 transition-colors hover:bg-white/[0.02] ${n.unread ? "" : "opacity-60"}`}
                      >
                        <div className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
                        <div>
                          <div className="text-sm text-paw-text">{n.text}</div>
                          <div className="text-xs text-paw-muted mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 text-center border-t border-paw-orange/10">
                    <button className="text-xs text-paw-orange hover:underline">Mark all as read</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/report"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-paw-orange px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-paw-orange/90 hover:shadow-lg hover:shadow-paw-orange/25"
          >
            Report an Animal
          </Link>
          <button
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-paw-muted hover:text-paw-text hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-paw-orange/20 bg-paw-bg/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === link.href
                      ? "bg-paw-orange/10 text-paw-orange"
                      : "text-paw-muted hover:text-paw-text hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/report"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center justify-center rounded-full bg-paw-orange px-5 py-3 text-sm font-semibold text-white"
              >
                Report an Animal
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
