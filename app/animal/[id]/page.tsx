"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Download, MapPin, Calendar, Shield, Share2, Heart, X } from "lucide-react";
import { animalProfile } from "@/lib/mockData";
import { toast } from "sonner";

function TimelineStep({
  step,
  index,
  total,
}: {
  step: { label: string; date?: string; status: "done" | "pending" };
  index: number;
  total: number;
}) {
  const isDone = step.status === "done";
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center">
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-paw-green shrink-0" />
        ) : (
          <Circle className="h-5 w-5 text-paw-muted/30 shrink-0" />
        )}
        {index < total - 1 && (
          <div
            className={`w-px flex-1 min-h-[24px] ${
              isDone ? "bg-paw-green/40" : "bg-paw-muted/15"
            }`}
          />
        )}
      </div>
      <div className="pb-4">
        <div
          className={`text-sm font-medium ${
            isDone ? "text-paw-text" : "text-paw-muted/50"
          }`}
        >
          {step.label}
        </div>
        {step.date && (
          <div className="text-xs text-paw-muted mt-0.5">{step.date}</div>
        )}
      </div>
    </motion.div>
  );
}

function AdoptionModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success("Adoption application submitted!", {
      description: `We'll contact you at ${phone} soon`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md rounded-xl border border-paw-orange/20 bg-paw-bg p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            Adopt <span className="text-paw-orange">{animalProfile.name}</span>
          </h3>
          <button onClick={onClose} className="text-paw-muted hover:text-paw-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-paw-muted mb-1 block">Your Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-paw-orange/20 bg-paw-card px-4 py-2.5 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="text-xs text-paw-muted mb-1 block">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-paw-orange/20 bg-paw-card px-4 py-2.5 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-xs text-paw-muted mb-1 block">Why do you want to adopt?</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full resize-none rounded-lg border border-paw-orange/20 bg-paw-card px-4 py-2.5 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none"
                  rows={3}
                  placeholder="Tell us about your home and experience with pets..."
                />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!name || !phone}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-paw-orange/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Heart className="h-4 w-4" />
              Submit Application
            </button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-3"
          >
            <CheckCircle2 className="h-12 w-12 text-paw-green mx-auto" />
            <div className="text-lg font-bold text-paw-green">Application Submitted!</div>
            <div className="text-sm text-paw-muted">The shelter will review your application and contact you within 48 hours.</div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function AnimalProfilePage() {
  const profile = animalProfile;
  const [showAdoptModal, setShowAdoptModal] = useState(false);

  const handleShare = () => {
    const url = `https://pawalert.in/animal/${profile.id}`;
    navigator.clipboard?.writeText(url);
    toast.success("Profile link copied!", { description: url });
  };

  return (
    <div className="min-h-screen bg-paw-bg px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-sm text-paw-muted mb-1">Animal Profile</div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                <span className="text-paw-orange">{profile.name}</span>{" "}
                <span className="text-paw-muted text-lg font-normal">#{profile.id}</span>
              </h1>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg border border-paw-orange/20 px-3 py-1.5 text-xs text-paw-muted hover:text-paw-text hover:border-paw-orange/40 transition-all"
            >
              <Share2 className="h-3 w-3" />
              Share
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — Photo + Status */}
            <div className="space-y-6">
              {/* Photo gallery - 3 placeholders */}
              <div className="grid grid-cols-3 gap-3">
                {["Rescue Site", "At Shelter", "Treatment"].map((label, i) => (
                  <div
                    key={label}
                    className={`relative aspect-square overflow-hidden rounded-xl border border-paw-orange/20 bg-paw-card ${i === 0 ? "col-span-3 aspect-video" : ""}`}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={`${i === 0 ? "w-32 h-32" : "w-16 h-16"} rounded-full bg-gradient-to-br from-paw-orange/20 to-paw-orange/5 flex items-center justify-center`}>
                        <span className={`${i === 0 ? "text-6xl" : "text-3xl"} opacity-60`}>🐕</span>
                      </div>
                      <span className="mt-2 text-xs text-paw-muted">{label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info card */}
              <div className="rounded-xl border border-paw-orange/20 bg-paw-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <span className="inline-flex items-center rounded-full bg-paw-blue/15 px-3 py-1 text-xs font-bold text-paw-blue">
                    {profile.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-paw-muted text-xs">Species</div>
                    <div className="font-medium">{profile.species}</div>
                  </div>
                  <div>
                    <div className="text-paw-muted text-xs">Breed</div>
                    <div className="font-medium">{profile.breed}</div>
                  </div>
                  <div>
                    <div className="text-paw-muted text-xs">Age</div>
                    <div className="font-medium">{profile.age}</div>
                  </div>
                  <div>
                    <div className="text-paw-muted text-xs">Gender</div>
                    <div className="font-medium">{profile.gender}</div>
                  </div>
                </div>

                <div className="border-t border-paw-orange/10 pt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-paw-muted">
                    <Calendar className="h-4 w-4" />
                    Rescued: {profile.rescueDate}
                  </div>
                  <div className="flex items-center gap-2 text-paw-muted">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                  <div className="flex items-center gap-2 text-paw-muted">
                    <Shield className="h-4 w-4" />
                    NGO: {profile.rescuedBy}
                  </div>
                  <div className="flex items-center gap-2 text-paw-muted">
                    <span className="ml-0.5">👤</span>
                    Reporter: {profile.reporter} (citizen)
                  </div>
                </div>
              </div>

              {/* Adopt CTA */}
              <button
                onClick={() => setShowAdoptModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-4 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-paw-orange/25 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Heart className="h-5 w-5" />
                Apply to Adopt {profile.name}
              </button>
            </div>

            {/* Right — Timeline + Medical */}
            <div className="space-y-6">
              <div className="rounded-xl border border-paw-orange/20 bg-paw-card p-6">
                <h3 className="text-lg font-bold mb-6">Medical Timeline</h3>
                <div>
                  {profile.timeline.map((step, i) => (
                    <TimelineStep
                      key={step.label}
                      step={step}
                      index={i}
                      total={profile.timeline.length}
                    />
                  ))}
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={() =>
                  toast.success("Vaccination certificate downloaded!", {
                    description: "PDF saved to your downloads folder",
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-paw-orange/30 bg-paw-card px-6 py-4 text-base font-semibold text-paw-orange transition-all hover:bg-paw-orange/10 hover:border-paw-orange/50"
              >
                <Download className="h-5 w-5" />
                Download Vaccination Certificate
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Adoption modal */}
      <AnimatePresence>
        {showAdoptModal && <AdoptionModal onClose={() => setShowAdoptModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
