"use client";

import { useState, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mail,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  MapPin,
  Phone,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import Link from "next/link";

export default function ContactPage() {
  const form = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.current) return;

    // EmailJS Credentials provided by user
    const serviceId = "service_ygru9zb";
    const publicKey = "FTd4B4Zsgv0v72seh";
    const templateId = "template_id"; // USER: Update this with your actual Template ID if you have one!

    emailjs
      .sendForm(serviceId, templateId, form.current, publicKey)
      .then(
        () => {
          setIsSent(true);
          toast.success("Message En Route!", {
            description: "We'll get back to you shortly.",
          });
        },
        (error) => {
          console.error("EmailJS Error:", error);
          toast.error("Message Failed to Fly", {
            description: "Please check your Template ID or try again later.",
          });
        }
      )
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-paw-bg px-6 py-20 lg:py-32 overflow-hidden selection:bg-paw-orange/20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Left Side: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-paw-orange/10 px-4 py-1 text-sm font-bold text-paw-orange tracking-widest uppercase"
              >
                <Sparkles className="h-4 w-4" />
                Get in Touch
              </motion.div>
              <h1 className="text-5xl font-black tracking-tight text-white lg:text-7xl">
                Ready to make a <span className="text-paw-orange">difference?</span>
              </h1>
              <p className="mt-8 text-lg text-paw-muted leading-relaxed">
                Whether you're an NGO looking to partner, a citizen with a specific inquiry, or just want to say hi — our team is here to listen.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paw-blue/10 text-paw-blue transition-all group-hover:scale-110">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-paw-muted">Email Us</div>
                  <div className="text-lg font-semibold text-white">hello@pawalert.india</div>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paw-green/10 text-paw-green transition-all group-hover:scale-110">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-paw-muted">Call Rescue Ops</div>
                  <div className="text-lg font-semibold text-white">+91 911 000 0000</div>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paw-red/10 text-paw-red transition-all group-hover:scale-110">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-paw-muted">HQ</div>
                  <div className="text-lg font-semibold text-white">New Delhi, India</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-paw-orange/20 to-paw-blue/20 blur-3xl opacity-30" />

            <div className="relative rounded-3xl border border-white/10 bg-paw-card p-8 shadow-2xl backdrop-blur-xl lg:p-10">
              <AnimatePresence mode="wait">
                {!isSent ? (
                  <motion.form
                    key="form"
                    ref={form}
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-paw-muted transition-colors group-focus-within:text-paw-orange" />
                        <input
                          required
                          type="text"
                          name="from_name"
                          placeholder="Your Name"
                          className="w-full rounded-2xl border border-white/5 bg-paw-bg/50 py-4 pl-12 pr-4 outline-none transition-all placeholder:text-paw-muted/50 focus:border-paw-orange/50 focus:ring-1 focus:ring-paw-orange/20"
                        />
                      </div>

                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-paw-muted transition-colors group-focus-within:text-paw-orange" />
                        <input
                          required
                          type="email"
                          name="user_email"
                          placeholder="Email Address"
                          className="w-full rounded-2xl border border-white/5 bg-paw-bg/50 py-4 pl-12 pr-4 outline-none transition-all placeholder:text-paw-muted/50 focus:border-paw-orange/50 focus:ring-1 focus:ring-paw-orange/20"
                        />
                      </div>

                      <div className="relative group">
                        <MessageSquare className="absolute left-4 top-5 h-5 w-5 text-paw-muted transition-colors group-focus-within:text-paw-orange" />
                        <textarea
                          required
                          name="message"
                          rows={5}
                          placeholder="How can we help?"
                          className="w-full resize-none rounded-2xl border border-white/5 bg-paw-bg/50 py-4 pl-12 pr-4 outline-none transition-all placeholder:text-paw-muted/50 focus:border-paw-orange/50 focus:ring-1 focus:ring-paw-orange/20"
                        />
                      </div>
                    </div>

                    <button
                      disabled={loading}
                      type="submit"
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-paw-orange py-5 text-lg font-bold text-white shadow-xl shadow-paw-orange/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          Send Message
                          <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-paw-green/20 text-paw-green">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-paw-muted mb-8 max-w-xs">
                      Thanks for reaching out. We've received your inquiry and will be in touch soon.
                    </p>
                    <button
                      onClick={() => setIsSent(false)}
                      className="text-paw-orange font-bold hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
