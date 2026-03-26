"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PawPrint } from "lucide-react";
import { stats, howItWorks, features } from "@/lib/mockData";
import { useEffect, useRef } from "react";

// Particle background component
function ParticleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; opacity: number; size: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        size: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(228, 127, 66, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(228, 127, 66, ${0.06 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paw-bg">
      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <ParticleGrid />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-paw-orange/30 bg-paw-orange/10 px-4 py-2 text-sm text-paw-orange">
              <PawPrint className="h-4 w-4" />
              AI-Powered Rescue Platform
            </div>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl">
              <span className="text-paw-orange">PawAlert</span> — The 911
              <br />
              for India&apos;s Strays
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-paw-muted sm:text-xl">
              AI-powered rescue coordination. Report an injured animal in 60
              seconds.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/report"
                className="group inline-flex items-center gap-2 rounded-full bg-paw-orange px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-paw-orange/25 transition-all duration-300 hover:shadow-xl hover:shadow-paw-orange/30 hover:scale-105"
              >
                Report an Animal
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/ngo"
                className="inline-flex items-center gap-2 rounded-full border-2 border-paw-orange/60 px-8 py-4 text-lg font-semibold text-paw-orange transition-all duration-300 hover:bg-paw-orange/10 hover:scale-105"
              >
                I&apos;m an NGO →
              </Link>
            </div>
          </motion.div>
        </div>
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-paw-bg to-transparent" />
      </section>

      {/* STATS BAR */}
      <section className="relative z-10 -mt-16 px-4">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                className="rounded-xl border border-paw-orange/20 bg-paw-card p-6 text-center backdrop-blur-sm"
              >
                <div className="mb-2 text-3xl">{stat.icon}</div>
                <div className="text-3xl font-bold text-paw-orange sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-paw-muted">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            className="mb-4 text-center text-3xl font-bold sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="mb-14 text-center text-paw-muted"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            From report to rescue in 5 simple steps
          </motion.p>
          <motion.div
            className="flex flex-col items-start gap-6 sm:flex-row sm:items-stretch sm:gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                custom={i}
                variants={fadeUp}
                className="group relative flex-1 rounded-xl border border-paw-orange/15 bg-paw-card p-6 transition-all duration-300 hover:border-paw-orange/40 hover:shadow-lg hover:shadow-paw-orange/10"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-paw-orange/10 text-lg font-bold text-paw-orange">
                  {step.step}
                </div>
                <div className="mb-1 text-2xl">{step.icon}</div>
                <h3 className="mb-1 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-paw-muted">{step.description}</p>
                {/* Arrow connector */}
                {i < howItWorks.length - 1 && (
                  <div className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 text-paw-orange/40 sm:block">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            className="mb-4 text-center text-3xl font-bold sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Built for Impact
          </motion.h2>
          <motion.p
            className="mb-14 text-center text-paw-muted"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Technology that saves lives
          </motion.p>
          <motion.div
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                variants={fadeUp}
                className="group rounded-xl border border-paw-orange/15 bg-paw-card p-8 transition-all duration-300 hover:border-paw-orange/30 hover:shadow-lg hover:shadow-paw-orange/10"
                style={{ borderLeftColor: feat.color, borderLeftWidth: "3px" }}
              >
                <div className="mb-4 text-4xl">{feat.icon}</div>
                <h3 className="mb-3 text-xl font-bold">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-paw-muted">
                  {feat.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-paw-orange/15 px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-paw-orange" />
            <span className="text-lg font-bold text-paw-orange">
              Paw<span className="text-paw-text">Alert</span>
            </span>
          </div>
          <p className="text-sm text-paw-muted">
            The 911 for India&apos;s strays — hackathon prototype
          </p>
        </div>
      </footer>
    </div>
  );
}
