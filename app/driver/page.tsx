"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  MessageCircle,
  Camera,
  MapPin,
  Navigation,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Truck,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

const missionStages = [
  { id: "en_route", label: "En Route to Location", icon: Navigation },
  { id: "arrived", label: "Arrived at Location", icon: MapPin },
  { id: "secured", label: "Animal Secured", icon: CheckCircle2 },
  { id: "heading_shelter", label: "Heading to Shelter", icon: Truck },
  { id: "delivered", label: "Delivered to Shelter", icon: Building2 },
] as const;



const missionData = {
  rescueId: "#PAW-2024-0844",
  animal: { type: "Dog", emoji: "🐕", severity: 9, severityLabel: "CRITICAL", color: "#FF4F4F" },
  reporter: { name: "Priya Sharma", phone: "+91 98765 43210" },
  pickup: { address: "Near Gate 3, Lajpat Nagar Central Market, New Delhi — 110024", landmark: "Opposite Haldiram's" },
  shelter: { name: "Friendicoes SECA", address: "271, Defence Colony Flyover Market, Jangpura, New Delhi" },
  emergencyVet: { name: "Dr. Anil Mehta", phone: "+91 98111 22334" },
  distance: 3.2,
  eta: 12,
};

export default function DriverPage() {
  const [currentStage, setCurrentStage] = useState(0);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [notes, setNotes] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [driverPos, setDriverPos] = useState(0);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate driver movement along route
  useEffect(() => {
    if (currentStage >= 4) return;
    const interval = setInterval(() => {
      setDriverPos((p) => Math.min(p + Math.random() * 2 + 0.5, 100));
    }, 1500);
    return () => clearInterval(interval);
  }, [currentStage]);

  const advanceStage = () => {
    if (currentStage < missionStages.length - 1) {
      setCurrentStage((s) => s + 1);
      const nextStage = missionStages[currentStage + 1];
      toast.success(`Status updated: ${nextStage.label}`, {
        description: "NGO and reporter have been notified",
      });
      if (currentStage + 1 === 2) {
        // Animal secured - reset driver pos for shelter trip
        setDriverPos(0);
      }
    } else {
      toast.success("🎉 Mission Complete!", {
        description: "Animal safely delivered to shelter. Great job!",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const stageComplete = currentStage >= missionStages.length - 1;
  const nextStageIndex = currentStage + 1 < missionStages.length ? currentStage + 1 : currentStage;
  const NextIcon = missionStages[nextStageIndex].icon;

  return (
    <div className="min-h-screen bg-paw-bg">
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* Mission header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-paw-orange/20 bg-paw-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-paw-red/15">
                <AlertTriangle className="h-4 w-4 text-paw-red" />
              </div>
              <div>
                <div className="text-xs text-paw-muted">Active Rescue</div>
                <div className="font-bold text-paw-orange">{missionData.rescueId}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-paw-bg px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-paw-muted" />
              <span className="font-mono text-sm font-medium text-paw-text">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Animal info bar */}
          <div className="flex items-center gap-3 rounded-lg bg-paw-bg/50 p-3">
            <span className="text-3xl">{missionData.animal.emoji}</span>
            <div className="flex-1">
              <div className="font-medium">{missionData.animal.type} — Rescue</div>
              <div className="text-xs text-paw-muted">{missionData.pickup.address}</div>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ backgroundColor: `${missionData.animal.color}20`, color: missionData.animal.color }}
            >
              {missionData.animal.severity}/10
            </span>
          </div>
        </motion.div>

        {/* Navigation map simulation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl border border-paw-orange/20 bg-paw-card"
        >
          <div className="relative h-48">
            {/* Map grid */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="driverGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(228,127,66,0.05)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#driverGrid)" />

              {/* Route line */}
              <path
                d="M 30 140 Q 80 130 120 100 Q 160 70 200 80 Q 260 90 300 60 Q 340 40 380 50"
                fill="none"
                stroke="rgba(228,127,66,0.3)"
                strokeWidth="3"
                strokeDasharray="8,4"
              />

              {/* Active route (driven portion) */}
              <path
                d="M 30 140 Q 80 130 120 100 Q 160 70 200 80 Q 260 90 300 60 Q 340 40 380 50"
                fill="none"
                stroke="#E47F42"
                strokeWidth="3"
                strokeDasharray={`${driverPos * 4},9999`}
              />
            </svg>

            {/* Start label */}
            <div className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-paw-green/20 px-2.5 py-1 text-xs text-paw-green">
              <div className="h-2 w-2 rounded-full bg-paw-green" />
              {currentStage < 2 ? "You" : "Pickup"}
            </div>

            {/* End label */}
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-paw-orange/20 px-2.5 py-1 text-xs text-paw-orange">
              <MapPin className="h-3 w-3" />
              {currentStage < 2 ? "Pickup" : "Shelter"}
            </div>

            {/* Driver dot */}
            <motion.div
              className="absolute z-10"
              animate={{
                left: `${Math.min(5 + driverPos * 0.85, 90)}%`,
                top: `${70 - driverPos * 0.35}%`,
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <div className="relative">
                <div className="absolute -inset-2 animate-ping rounded-full bg-paw-green/30" />
                <div className="h-4 w-4 rounded-full bg-paw-green border-2 border-white shadow-lg" />
              </div>
            </motion.div>
          </div>

          {/* ETA bar */}
          <div className="flex items-center justify-between border-t border-paw-orange/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <Navigation className="h-4 w-4 text-paw-blue" />
              <span className="text-sm font-medium">{(missionData.distance * (1 - driverPos / 100)).toFixed(1)} km away</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-paw-muted" />
              <span className="text-paw-muted">ETA:</span>
              <span className="font-bold text-paw-orange">{Math.max(1, Math.round(missionData.eta * (1 - driverPos / 100)))} min</span>
            </div>
          </div>
        </motion.div>

        {/* Stage progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-paw-orange/20 bg-paw-card p-4"
        >
          <div className="text-xs text-paw-muted mb-3">Mission Progress</div>
          <div className="space-y-0">
            {missionStages.map((stage, i) => {
              const Icon = stage.icon;
              const isDone = i < currentStage;
              const isCurrent = i === currentStage;

              return (
                <div key={stage.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                        isDone
                          ? "bg-paw-green/20"
                          : isCurrent
                          ? "bg-paw-orange/20 animate-pulse-glow"
                          : "bg-paw-muted/10"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-paw-green" />
                      ) : isCurrent ? (
                        <Icon className="h-4 w-4 text-paw-orange" />
                      ) : (
                        <Circle className="h-4 w-4 text-paw-muted/30" />
                      )}
                    </div>
                    {i < missionStages.length - 1 && (
                      <div className={`w-px h-5 ${isDone ? "bg-paw-green/40" : "bg-paw-muted/15"}`} />
                    )}
                  </div>
                  <div className={`pb-3 text-sm ${isDone ? "text-paw-green" : isCurrent ? "text-paw-text font-medium" : "text-paw-muted/40"}`}>
                    {stage.label}
                    {isCurrent && <span className="ml-2 text-xs text-paw-orange animate-pulse">← current</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Advance button */}
          <button
            onClick={advanceStage}
            disabled={stageComplete}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold transition-all ${
              stageComplete
                ? "bg-paw-green/20 text-paw-green cursor-default"
                : "bg-paw-orange text-white hover:shadow-lg hover:shadow-paw-orange/25 active:scale-[0.98]"
            }`}
          >
            {stageComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Mission Complete
              </>
            ) : (
              <>
                <NextIcon className="h-5 w-5" />
                {currentStage + 1 < missionStages.length
                  ? `Update: ${missionStages[currentStage + 1].label}`
                  : "Complete Mission"}
              </>
            )}
          </button>
        </motion.div>

        {/* Quick contacts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => toast("Calling reporter...", { description: missionData.reporter.name })}
            className="flex items-center gap-2 rounded-xl border border-paw-blue/20 bg-paw-card p-3 text-sm font-medium text-paw-blue transition-all hover:bg-paw-blue/5 active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" />
            Call Reporter
          </button>
          <button
            onClick={() => toast("Opening WhatsApp...", { description: "Sending location to reporter" })}
            className="flex items-center gap-2 rounded-xl border border-paw-green/20 bg-paw-card p-3 text-sm font-medium text-paw-green transition-all hover:bg-paw-green/5 active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={() => toast("Calling vet...", { description: `${missionData.emergencyVet.name}` })}
            className="flex items-center gap-2 rounded-xl border border-paw-red/20 bg-paw-card p-3 text-sm font-medium text-paw-red transition-all hover:bg-paw-red/5 active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" />
            Emergency Vet
          </button>
          <button
            onClick={() => toast("Opening navigation...", { description: "Google Maps route loaded" })}
            className="flex items-center gap-2 rounded-xl border border-paw-orange/20 bg-paw-card p-3 text-sm font-medium text-paw-orange transition-all hover:bg-paw-orange/5 active:scale-[0.98]"
          >
            <Navigation className="h-4 w-4" />
            Open Maps
          </button>
        </motion.div>

        {/* Pickup confirmation (shown when arrived or later) */}
        <AnimatePresence>
          {currentStage >= 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-paw-orange/20 bg-paw-card p-4 space-y-4">
                <div className="text-sm font-medium">Pickup Confirmation</div>

                {/* Photo upload */}
                <div
                  onClick={() => {
                    setPhotoUploaded(true);
                    toast.success("Photo captured!", { description: "Pickup photo saved to report" });
                  }}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-all ${
                    photoUploaded
                      ? "border-paw-green/40 bg-paw-green/5"
                      : "border-paw-orange/30 hover:border-paw-orange"
                  }`}
                >
                  <Camera className={`h-6 w-6 ${photoUploaded ? "text-paw-green" : "text-paw-orange"}`} />
                  <div>
                    <div className={`text-sm font-medium ${photoUploaded ? "text-paw-green" : ""}`}>
                      {photoUploaded ? "Photo uploaded ✓" : "Upload Pickup Photo"}
                    </div>
                    <div className="text-xs text-paw-muted">Required for confirmation</div>
                  </div>
                </div>

                {/* Notes */}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add observations (condition, behavior, additional injuries...)"
                  className="w-full resize-none rounded-lg border border-paw-orange/20 bg-paw-bg p-3 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none"
                  rows={3}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shelter destination card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-paw-blue/15 bg-paw-card p-4"
        >
          <div className="text-xs text-paw-muted mb-2">Shelter Destination</div>
          <div className="font-medium text-paw-blue">{missionData.shelter.name}</div>
          <div className="text-sm text-paw-muted mt-1">{missionData.shelter.address}</div>
        </motion.div>
      </div>
    </div>
  );
}
