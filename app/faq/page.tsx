"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  PhoneCall,
  Heart,
} from "lucide-react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "How does PawAlert's AI Vision triage work?",
    answer: "Our system uses the Google Gemini 1.5 Flash Vision API. When you upload an animal photo, the AI performs a veterinary-grade analysis, looking for clinical signs like alopecia, bone alignment, and visible wounds. It then assigns a severity score from 1 to 10 to help NGOs prioritize rescues.",
  },
  {
    question: "Is the real-time tracking accurate?",
    answer: "Yes! We use MapmyIndia (Mappls) for road-aware navigation. Once an NGO dispatches a van, you receive a unique tracking link where you can see the van's live movements along actual roads until the rescue is complete.",
  },
  {
    question: "How can my NGO join the platform?",
    answer: "Currently, we are in an invite-only phase for NGOs. If you're representative of a registered animal welfare organization, please contact us via the Contact page with your details, and we'll reach out for verification.",
  },
  {
    question: "What should I do after reporting an animal?",
    answer: "Wait at the location if possible! This helps the rescue team find the animal faster. You can keep an eye on your unique tracking page for live status updates from the NGO.",
  },
  {
    question: "Are my personal details shared with NGOs?",
    answer: "Your safety is our priority. We only share the location of the incident and any notes you provide. Your phone number is only used for critical rescue coordination and is never made public.",
  },
  {
    question: "Is PawAlert free for citizens?",
    answer: "Absolutely. PawAlert is a community-driven initiative for animal welfare. Reporting an animal is completely free.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-paw-bg px-6 py-20 lg:py-32 selection:bg-paw-orange/20">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-paw-blue/10 px-4 py-1 text-sm font-bold text-paw-blue tracking-widest uppercase"
          >
            <HelpCircle className="h-4 w-4" />
            Common Questions
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight text-white lg:text-7xl mb-6">
            Everything you need to <span className="text-paw-orange underline decoration-paw-orange/30">know.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-paw-muted">
            Can't find the answer you're looking for? Reach out to our dedicated support team via the contact form.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-3xl border border-white/5 bg-paw-card transition-all ${
                  isOpen ? "border-paw-orange/20 shadow-xl" : "hover:border-white/10"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span className={`text-lg font-bold transition-colors ${isOpen ? "text-paw-orange" : "text-white"}`}>
                    {item.question}
                  </span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                    isOpen ? "bg-paw-orange text-white rotate-0" : "bg-white/5 text-paw-muted"
                  }`}>
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 text-paw-muted leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-24 rounded-3xl bg-gradient-to-br from-paw-orange to-red-500 p-1 lg:p-1.5"
        >
          <div className="rounded-[calc(1.5rem-2px)] bg-paw-card p-10 text-center space-y-8">
            <h3 className="text-3xl font-black text-white">Still have questions?</h3>
            <p className="text-paw-muted max-w-md mx-auto">
              Our support team is active 24/7 to help you save lives. Reach out today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 rounded-2xl bg-paw-orange px-8 py-4 font-bold text-white shadow-xl shadow-paw-orange/25 transition-all hover:scale-105 active:scale-95"
              >
                Contact Support <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                onClick={() => window.open('tel:+919110000000')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition-all hover:bg-white/10"
              >
                <PhoneCall className="h-5 w-5" /> Call Ethics Commitee
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
