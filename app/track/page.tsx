"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Star, CheckCircle2, Circle, Truck, MapPin, Share2 } from "lucide-react";
import { trackingSteps as initialSteps, driverInfo, rescueId } from "@/lib/mockData";
import { toast } from "sonner";

function StatusIcon({ status }: { status: "done" | "current" | "pending" }) {
  if (status === "done")
    return <CheckCircle2 className="h-5 w-5 text-paw-green" />;
  if (status === "current")
    return (
      <div className="relative">
        <Circle className="h-5 w-5 text-paw-blue fill-paw-blue" />
        <div className="absolute inset-0 animate-ping rounded-full bg-paw-blue/40" />
      </div>
    );
  return <Circle className="h-5 w-5 text-paw-muted/40" />;
}

export default function TrackPage() {
  const [vanPosition, setVanPosition] = useState({ x: 20, y: 60 });
  const [steps, setSteps] = useState(initialSteps);

  // Compute progress
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progressPercent = Math.round(((doneCount + 0.5) / steps.length) * 100);

  // Auto-advance timeline every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.status === "current");
        if (idx === -1 || idx >= prev.length - 1) return prev;

        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

        return prev.map((s, i) => {
          if (i === idx) return { ...s, status: "done" as const, time: s.time || timeStr };
          if (i === idx + 1) return { ...s, status: "current" as const, time: timeStr };
          return s;
        });
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Simulate van movement
  useEffect(() => {
    const interval = setInterval(() => {
      setVanPosition((prev) => ({
        x: Math.min(prev.x + (Math.random() * 3 - 0.5), 75),
        y: prev.y + (Math.random() * 2 - 1),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleShareTracking = () => {
    const url = `https://pawalert.in/track/${rescueId.replace("#", "")}`;
    navigator.clipboard?.writeText(url);
    toast.success("Tracking link copied!", { description: url });
  };

  return (
    <div className="min-h-screen bg-paw-bg">
      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Map area */}
        <div className="relative flex-1 bg-paw-card overflow-hidden">
          <div className="absolute inset-0">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(228,127,66,0.06)" strokeWidth="1" />
                </pattern>
                <pattern id="gridSmall" width="15" height="15" patternUnits="userSpaceOnUse">
                  <path d="M 15 0 L 0 0 0 15" fill="none" stroke="rgba(228,127,66,0.03)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridSmall)" />
              <rect width="100%" height="100%" fill="url(#grid)" />
              <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="rgba(228,127,66,0.15)" strokeWidth="3" strokeDasharray="15,5" />
              <line x1="30%" y1="20%" x2="30%" y2="80%" stroke="rgba(228,127,66,0.1)" strokeWidth="2" strokeDasharray="10,5" />
              <line x1="60%" y1="10%" x2="60%" y2="90%" stroke="rgba(228,127,66,0.1)" strokeWidth="2" strokeDasharray="10,5" />
              <line x1="15%" y1="30%" x2="85%" y2="70%" stroke="rgba(228,127,66,0.08)" strokeWidth="2" strokeDasharray="8,4" />
            </svg>

            {/* Incident marker */}
            <div className="absolute z-20" style={{ left: "75%", top: "55%", transform: "translate(-50%, -50%)" }}>
              <div className="relative">
                <div className="absolute -inset-4 animate-ping rounded-full bg-paw-red/20" />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paw-red shadow-lg shadow-paw-red/40">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-paw-red/20 px-2 py-0.5 text-xs text-paw-red font-medium">
                  Incident
                </div>
              </div>
            </div>

            {/* Van marker */}
            <motion.div
              className="absolute z-20"
              animate={{ left: `${vanPosition.x}%`, top: `${vanPosition.y}%` }}
              transition={{ duration: 2, ease: "easeInOut" }}
              style={{ transform: "translate(-50%, -50%)" }}
            >
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paw-green shadow-lg shadow-paw-green/40">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-paw-green/20 px-2 py-0.5 text-xs text-paw-green font-medium">
                  Rescue Van
                </div>
              </div>
            </motion.div>

            <svg className="absolute inset-0 w-full h-full z-10">
              <line x1={`${vanPosition.x}%`} y1={`${vanPosition.y}%`} x2="75%" y2="55%" stroke="rgba(79,201,126,0.4)" strokeWidth="2" strokeDasharray="8,4" />
            </svg>

            <div className="absolute bottom-4 right-4 rounded-lg bg-paw-bg/80 px-3 py-2 text-xs text-paw-muted backdrop-blur-sm border border-paw-orange/20">
              📍 New Delhi, India · Live View
            </div>
          </div>
        </div>

        {/* Left panel overlay */}
        <div className="w-full lg:w-96 lg:absolute lg:left-4 lg:top-4 lg:bottom-4 z-30 overflow-y-auto">
          <motion.div
            className="rounded-xl border border-paw-orange/20 bg-paw-bg/95 backdrop-blur-xl p-6 space-y-6 lg:max-h-full"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-paw-muted mb-1">Tracking</div>
                <h2 className="text-xl font-bold text-paw-orange">{rescueId}</h2>
              </div>
              <button
                onClick={handleShareTracking}
                className="flex items-center gap-1.5 rounded-lg border border-paw-orange/20 px-3 py-1.5 text-xs text-paw-muted transition-all hover:text-paw-text hover:border-paw-orange/40"
              >
                <Share2 className="h-3 w-3" />
                Share
              </button>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-paw-muted">Progress</span>
                <span className="font-bold text-paw-orange">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-paw-card">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-paw-orange to-paw-green"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Status timeline */}
            <div className="space-y-0">
              {steps.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <StatusIcon status={s.status} />
                    {i < steps.length - 1 && (
                      <div className={`w-px flex-1 min-h-[28px] ${s.status === "done" ? "bg-paw-green/40" : "bg-paw-muted/15"}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className={`text-sm font-medium ${s.status === "current" ? "text-paw-blue" : s.status === "done" ? "text-paw-text" : "text-paw-muted/50"}`}>
                      {s.label}
                      {s.status === "current" && <span className="ml-2 text-xs text-paw-blue animate-pulse">← current</span>}
                    </div>
                    {s.time && <div className="text-xs text-paw-muted">{s.time}</div>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Driver card */}
            <div className="rounded-lg border border-paw-orange/20 bg-paw-card p-4">
              <div className="text-xs text-paw-muted mb-2">Driver Details</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{driverInfo.name}</div>
                  <div className="text-xs text-paw-muted">{driverInfo.plate}</div>
                </div>
                <div className="flex items-center gap-1 text-paw-gold">
                  <Star className="h-4 w-4 fill-paw-gold" />
                  <span className="text-sm font-medium">{driverInfo.rating}</span>
                </div>
              </div>
            </div>

            {/* ETA */}
            <div className="rounded-lg bg-paw-blue/10 border border-paw-blue/20 p-4 text-center">
              <div className="text-xs text-paw-blue mb-1">Estimated Arrival</div>
              <div className="text-2xl font-bold text-paw-blue">{driverInfo.eta}</div>
            </div>

            {/* Call button */}
            <button
              onClick={() => toast("Calling driver...", { description: "Connecting you to Ravi Kumar" })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-paw-orange/25 animate-pulse-glow"
            >
              <Phone className="h-5 w-5" />
              Call Driver
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
