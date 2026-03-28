"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Phone, Star, CheckCircle2, Circle, MapPin, Share2,
  Wifi, WifiOff, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import MapplsMap from "@/components/MapplsMap";
import {
  createGpsChannel, subscribeToLocation, subscribeToStage,
  type GpsPayload, type StagePayload,
} from "@/lib/gps-channel";
import { fetchMapplsRoute } from "@/lib/mappls-route";

const SHELTER = { lat: 28.5743, lng: 77.2367 };

const ALL_STEPS = [
  { label: "Report Submitted" },
  { label: "NGO Notified" },
  { label: "Van Dispatched" },
  { label: "En Route" },
  { label: "Arrived at Location" },
  { label: "Animal Picked Up" },
  { label: "At Shelter" },
  { label: "Under Treatment" },
  { label: "Vaccinated" },
  { label: "Available for Adoption" },
];

// Maps driver stage index (0-4) → tracking step index
const DRIVER_STAGE_TO_STEP: Record<number, number> = {
  0: 3, // En Route
  1: 4, // Arrived
  2: 5, // Animal Picked Up
  3: 6, // At Shelter
  4: 7, // Under Treatment
};

interface Report {
  id: string;
  species: string;
  location: string;
  lat: number;
  lng: number;
  severity: number;
  severity_label: string;
  status: string;
  image_url: string | null;
}

function statusToStep(status: string): number {
  const map: Record<string, number> = {
    pending: 1,
    dispatched: 2,
    accepted: 2,
  };
  return map[status] ?? 1;
}

function TrackInner() {
  const params = useSearchParams();
  const reportIdParam = params.get("id");

  const [report, setReport] = useState<Report | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  const [currentStep, setCurrentStep] = useState(1); // step in ALL_STEPS
  const [isLive, setIsLive] = useState(false);
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);

  const vanMarkerRef = useRef<mappls.Marker | null>(null);
  const routeLineRef = useRef<mappls.Polyline | null>(null);
  const mapRef = useRef<mappls.Map | null>(null);
  const lastPingRef = useRef<number>(0);

  // ── Fetch report ─────────────────────────────────────────────────
  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch("/api/reports");
        const all: Report[] = await res.json();
        if (reportIdParam) {
          const found = all.find(r => r.id === reportIdParam);
          if (found) { setReport(found); setCurrentStep(statusToStep(found.status)); return; }
        }
        // Fallback to latest
        if (all.length > 0) { setReport(all[0]); setCurrentStep(statusToStep(all[0].status)); }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingReport(false);
      }
    }
    loadReport();
  }, [reportIdParam]);

  // ── GPS stale check ───────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastPingRef.current && Date.now() - lastPingRef.current > 10000) setIsLive(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Update route polyline ─────────────────────────────────────────
  const updateRoute = useCallback(async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    if (!routeLineRef.current) return;
    const pts = await fetchMapplsRoute(from, to);
    routeLineRef.current.setPath(pts);
  }, []);

  // ── Subscribe to driver GPS + stage broadcasts ────────────────────
  useEffect(() => {
    if (!report) return;
    const channel = createGpsChannel(report.id);

    // Stage updates — advance tracker timeline in real time
    subscribeToStage(channel, (payload: StagePayload) => {
      const step = DRIVER_STAGE_TO_STEP[payload.stageIndex];
      if (step !== undefined) setCurrentStep(step);
    });

    const unsubLocation = subscribeToLocation(channel, (payload: GpsPayload) => {
      const pos = { lat: payload.lat, lng: payload.lng };
      setDriverPosition(pos);
      setIsLive(true);
      lastPingRef.current = Date.now();

      // Pan map to latest location
      if (mapRef.current) {
        mapRef.current.setCenter(pos);
      }

      // Move van marker
      vanMarkerRef.current?.setPosition(pos);

      // Update route (to current destination)
      const dest = currentStep >= 5 ? SHELTER : { lat: report.lat, lng: report.lng };
      updateRoute(pos, dest);
    });

    return unsubLocation;
  }, [report?.id, currentStep, updateRoute]);

  // ── Compute ETA ───────────────────────────────────────────────────
  const dest = currentStep >= 5 ? SHELTER : report ? { lat: report.lat, lng: report.lng } : null;
  const distanceKm = driverPosition && dest ? haversineDistance(driverPosition, dest) : null;
  const etaMinutes = distanceKm ? Math.max(1, Math.round(distanceKm * 3)) : null;

  // ── Map ready ─────────────────────────────────────────────────────
  const handleMapReady = useCallback((map: mappls.Map) => {
    if (!report) return;
    mapRef.current = map;

    // Incident marker (red)
    new window.mappls.Marker({
      map,
      position: { lat: report.lat, lng: report.lng },
      html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#FF4F4F;box-shadow:0 4px 15px rgba(255,79,79,0.5);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      offset: [0, -20], width: 40, height: 40,
    });

    // Shelter marker (blue)
    new window.mappls.Marker({
      map,
      position: SHELTER,
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#3B9EFF;box-shadow:0 4px 15px rgba(59,158,255,0.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>`,
      offset: [0, -18], width: 36, height: 36,
    });

    // Van marker (green pulsing) — begins near incident until real GPS arrives
    const startPos = { lat: report.lat - 0.01, lng: report.lng - 0.01 };
    const vanMarker = new window.mappls.Marker({
      map,
      position: startPos,
      html: `<div style="position:relative;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(79,201,126,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#4FC97E;box-shadow:0 4px 15px rgba(79,201,126,0.5);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
      </div>`,
      offset: [0, -20], width: 52, height: 52,
    });
    vanMarkerRef.current = vanMarker;

    // Initial route line
    const routeLine = new window.mappls.Polyline({
      map,
      path: [startPos, { lat: report.lat, lng: report.lng }],
      strokeColor: "#4FC97E",
      strokeOpacity: 0.7,
      strokeWeight: 4,
    });
    routeLineRef.current = routeLine;

    // Fetch real road route immediately
    fetchMapplsRoute(startPos, { lat: report.lat, lng: report.lng })
      .then(pts => routeLine.setPath(pts));
  }, [report]);

  const handleShare = () => {
    const url = `${window.location.origin}/track?id=${report?.id || ""}`;
    navigator.clipboard?.writeText(url);
    toast.success("Tracking link copied!", { description: url });
  };

  // Steps with timestamps
  const stepsWithTime = ALL_STEPS.map((s, i) => {
    const isDone = i < currentStep;
    const isCurrent = i === currentStep;
    const status: "done" | "current" | "pending" = isDone ? "done" : isCurrent ? "current" : "pending";
    const time = isDone ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined;
    return { ...s, status, time };
  });

  const doneCount = stepsWithTime.filter(s => s.status === "done").length;
  const progressPercent = Math.round(((doneCount + 0.5) / ALL_STEPS.length) * 100);

  if (loadingReport) {
    return (
      <div className="min-h-screen bg-paw-bg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-paw-orange" />
      </div>
    );
  }

  const incidentCenter = report ? { lat: report.lat, lng: report.lng } : { lat: 28.57, lng: 77.21 };

  return (
    <div className="min-h-screen bg-paw-bg">
      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Map */}
        <MapplsMap
          center={incidentCenter}
          zoom={14}
          className="flex-1 overflow-hidden rounded-none"
          onMapReady={handleMapReady}
        />

        {/* Live indicator */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-paw-bg/90 backdrop-blur-sm px-3 py-1.5 border border-paw-orange/20">
          {isLive ? (
            <><Wifi className="h-3.5 w-3.5 text-paw-green" />
              <span className="text-xs font-medium text-paw-green">Live GPS</span>
              <div className="h-2 w-2 rounded-full bg-paw-green animate-pulse" /></>
          ) : (
            <><WifiOff className="h-3.5 w-3.5 text-paw-muted/60" />
              <span className="text-xs font-medium text-paw-muted/60">Waiting for GPS…</span></>
          )}
        </div>

        {/* ETA overlay */}
        {etaMinutes && (
          <div className="absolute bottom-4 right-4 z-30 rounded-lg bg-paw-bg/90 backdrop-blur-sm px-4 py-2 border border-paw-orange/20">
            <div className="text-xs text-paw-muted">ETA</div>
            <div className="text-lg font-bold text-paw-orange">~{etaMinutes} min</div>
            {distanceKm && <div className="text-xs text-paw-muted">{distanceKm.toFixed(1)} km away</div>}
          </div>
        )}

        {/* Left panel */}
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
                <h2 className="text-xl font-bold text-paw-orange font-mono">
                  {report?.id || "—"}
                </h2>
                {report && <div className="text-xs text-paw-muted">{report.species} · {report.severity}/10 {report.severity_label}</div>}
              </div>
              <button onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg border border-paw-orange/20 px-3 py-1.5 text-xs text-paw-muted transition-all hover:text-paw-text hover:border-paw-orange/40">
                <Share2 className="h-3 w-3" /> Share
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

            {/* Timeline */}
            <div className="space-y-0">
              {stepsWithTime.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {s.status === "done" ? <CheckCircle2 className="h-5 w-5 text-paw-green" />
                      : s.status === "current" ? (
                        <div className="relative">
                          <Circle className="h-5 w-5 text-paw-blue fill-paw-blue" />
                          <div className="absolute inset-0 animate-ping rounded-full bg-paw-blue/40" />
                        </div>
                      ) : <Circle className="h-5 w-5 text-paw-muted/40" />}
                    {i < ALL_STEPS.length - 1 && (
                      <div className={`w-px flex-1 min-h-[24px] ${s.status === "done" ? "bg-paw-green/40" : "bg-paw-muted/15"}`} />
                    )}
                  </div>
                  <div className="pb-3">
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
              <div className="text-xs text-paw-muted mb-2">Rescue Vehicle</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">PawAlert Van</div>
                  <div className="text-xs text-paw-muted">MH-04-AB-1234</div>
                </div>
                <div className="flex items-center gap-1 text-paw-gold">
                  <Star className="h-4 w-4 fill-paw-gold" />
                  <span className="text-sm font-medium">4.9</span>
                </div>
              </div>
            </div>

            {/* ETA panel */}
            <div className="rounded-lg bg-paw-blue/10 border border-paw-blue/20 p-4 text-center">
              <div className="text-xs text-paw-blue mb-1">Estimated Arrival</div>
              <div className="text-2xl font-bold text-paw-blue">
                {etaMinutes ? `~${etaMinutes} min` : isLive ? "Calculating…" : "Waiting for van…"}
              </div>
            </div>

            {/* Call */}
            <button onClick={() => toast("Calling driver…", { description: "Connecting you to the rescue van" })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-paw-orange/25 animate-pulse-glow">
              <Phone className="h-5 w-5" /> Call Driver
            </button>

            {/* Location */}
            {report && (
              <div className="flex items-start gap-2 text-xs text-paw-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{report.location}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paw-bg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-paw-orange" />
      </div>
    }>
      <TrackInner />
    </Suspense>
  );
}

function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
