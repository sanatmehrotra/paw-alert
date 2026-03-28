"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MessageCircle, Camera, MapPin, Navigation,
  CheckCircle2, Circle, Clock, AlertTriangle, Truck,
  Building2, Locate, WifiOff, Signal, Loader2, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import MapplsMap from "@/components/MapplsMap";
import {
  createGpsChannel, broadcastLocation, broadcastStage,
  subscribeToStage, type GpsPayload, type StagePayload,
} from "@/lib/gps-channel";
import { fetchMapplsRoute } from "@/lib/mappls-route";
import type { RealtimeChannel } from "@supabase/supabase-js";

const SHELTER = {
  name: "Friendicoes SECA",
  address: "271, Defence Colony Flyover Market, Jangpura, New Delhi",
  lat: 28.5743,
  lng: 77.2367,
};

const missionStages = [
  { id: "en_route",       label: "En Route to Location",  icon: Navigation },
  { id: "arrived",        label: "Arrived at Location",   icon: MapPin },
  { id: "secured",        label: "Animal Secured",        icon: CheckCircle2 },
  { id: "heading_shelter",label: "Heading to Shelter",    icon: Truck },
  { id: "delivered",      label: "Delivered to Shelter",  icon: Building2 },
] as const;

interface Report {
  id: string;
  species: string;
  description: string;
  lat: number;
  lng: number;
  location: string;
  severity: number;
  severity_label: string;
  image_url: string | null;
  injury_tags: string[] | null;
  status: string;
}

// ---- Core driver UI ----
function DriverInner() {
  const params = useSearchParams();
  const reportIdParam = params.get("id");

  const [report, setReport] = useState<Report | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  const [currentStage, setCurrentStage] = useState(0);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [notes, setNotes] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  // GPS
  const [gpsStatus, setGpsStatus] = useState<"requesting" | "active" | "denied" | "error">("requesting");
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsSpeed, setGpsSpeed] = useState<number | null>(null);

  // Map refs
  const mapRef = useRef<mappls.Map | null>(null);
  const driverMarkerRef = useRef<mappls.Marker | null>(null);
  const routeLineRef = useRef<mappls.Polyline | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const driverPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // ── Fetch report from DB ──────────────────────────────────────────
  useEffect(() => {
    async function loadReport() {
      setLoadingReport(true);
      try {
        let url = "/api/reports";
        const res = await fetch(url);
        const all: Report[] = await res.json();

        if (reportIdParam) {
          const found = all.find((r) => r.id === reportIdParam);
          if (found) { setReport(found); return; }
        }
        // Fallback: first dispatched or pending report
        const candidate = all.find(r => r.status === "dispatched" || r.status === "pending");
        if (candidate) setReport(candidate as Report);
      } catch (err) {
        console.error("Report fetch error:", err);
      } finally {
        setLoadingReport(false);
      }
    }
    loadReport();
  }, [reportIdParam]);

  // ── Elapsed timer ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Supabase channel ──────────────────────────────────────────────
  useEffect(() => {
    if (!report) return;
    const channel = createGpsChannel(report.id);
    channel.subscribe();
    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [report?.id]);

  // ── GPS watchPosition ─────────────────────────────────────────────
  useEffect(() => {
    if (!report) return;
    if (!navigator.geolocation) { setGpsStatus("error"); return; }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const newPos = { lat: latitude, lng: longitude };
        setDriverPosition(newPos);
        driverPositionRef.current = newPos;
        setGpsAccuracy(accuracy);
        setGpsSpeed(speed);
        setGpsStatus("active");

        // Move marker
        driverMarkerRef.current?.setPosition(newPos);

        // Broadcast
        if (channelRef.current) {
          const payload: GpsPayload = {
            lat: latitude, lng: longitude,
            heading, speed, accuracy,
            timestamp: Date.now(),
          };
          broadcastLocation(channelRef.current, payload);
        }
      },
      (error) => {
        setGpsStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
        toast.error("GPS Error", { description: error.message });
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [report?.id]);

  // ── Destination based on current stage ───────────────────────────
  const destination = !report
    ? SHELTER
    : currentStage < 2
    ? { lat: report.lat, lng: report.lng, address: report.location, name: "Pickup" }
    : { lat: SHELTER.lat, lng: SHELTER.lng, address: SHELTER.address, name: SHELTER.name };

  const distanceKm = driverPosition
    ? haversineDistance(driverPosition, { lat: destination.lat, lng: destination.lng })
    : null;
  const etaMinutes = distanceKm ? Math.max(1, Math.round(distanceKm * 3)) : null;

  // ── Update route line when position or stage changes ─────────────
  const updateRoute = useCallback(async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    if (!routeLineRef.current || !mapRef.current) return;
    const routePoints = await fetchMapplsRoute(from, to);
    routeLineRef.current.setPath(routePoints);
  }, []);

  useEffect(() => {
    if (!driverPosition || !report) return;
    const to = currentStage < 2
      ? { lat: report.lat, lng: report.lng }
      : { lat: SHELTER.lat, lng: SHELTER.lng };
    updateRoute(driverPosition, to);
  }, [driverPosition, currentStage, report, updateRoute]);

  // ── Map ready ─────────────────────────────────────────────────────
  const handleMapReady = useCallback((map: mappls.Map) => {
    if (!report) return;
    mapRef.current = map;

    // Pickup / incident marker (red)
    new window.mappls.Marker({
      map,
      position: { lat: report.lat, lng: report.lng },
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#FF4F4F;box-shadow:0 4px 15px rgba(255,79,79,0.5);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      offset: [0, -18], width: 36, height: 36,
    });

    // Shelter marker (blue)
    new window.mappls.Marker({
      map,
      position: { lat: SHELTER.lat, lng: SHELTER.lng },
      html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#3B9EFF;box-shadow:0 4px 12px rgba(59,158,255,0.4);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>`,
      offset: [0, -16], width: 32, height: 32,
    });

    // Driver marker (green pulsing)
    const startPos = driverPositionRef.current || { lat: report.lat - 0.005, lng: report.lng - 0.005 };
    const driverMarker = new window.mappls.Marker({
      map,
      position: startPos,
      html: `<div style="position:relative;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(79,201,126,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#4FC97E;border:3px solid white;box-shadow:0 4px 15px rgba(79,201,126,0.5);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </div>
      </div>`,
      offset: [0, -18], width: 48, height: 48,
    });
    driverMarkerRef.current = driverMarker;

    // Route line (will be updated with real route)
    const routeLine = new window.mappls.Polyline({
      map,
      path: [startPos, { lat: report.lat, lng: report.lng }],
      strokeColor: "#E47F42",
      strokeOpacity: 0.7,
      strokeWeight: 4,
    });
    routeLineRef.current = routeLine;

    // Fetch real road route if we have GPS already
    if (driverPositionRef.current) {
      fetchMapplsRoute(driverPositionRef.current, { lat: report.lat, lng: report.lng })
        .then(pts => routeLine.setPath(pts));
    }
  }, [report]);

  // ── Advance stage ─────────────────────────────────────────────────
  const advanceStage = () => {
    if (!report) return;
    if (currentStage >= missionStages.length - 1) {
      toast.success("🎉 Mission Complete!", { description: "Animal safely delivered to shelter." });
      return;
    }
    const next = currentStage + 1;
    setCurrentStage(next);
    toast.success(`Status: ${missionStages[next].label}`, { description: "NGO and reporter notified" });

    // Broadcast stage to tracker
    if (channelRef.current) {
      const payload: StagePayload = {
        stageIndex: next,
        stageId: missionStages[next].id,
        timestamp: Date.now(),
      };
      broadcastStage(channelRef.current, payload);
    }

    // Update route to shelter after animal secured
    if (next === 2 && driverPositionRef.current) {
      updateRoute(driverPositionRef.current, { lat: SHELTER.lat, lng: SHELTER.lng });
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const stageComplete = currentStage >= missionStages.length - 1;
  const NextIcon = missionStages[Math.min(currentStage + 1, missionStages.length - 1)].icon;
  const mapCenter = driverPosition || (report ? { lat: report.lat, lng: report.lng } : { lat: 28.57, lng: 77.21 });

  const severityColor = (s: number) => s >= 9 ? "#FF4F4F" : s >= 7 ? "#E47F42" : s >= 4 ? "#FFE00F" : "#4FC97E";

  // ── Loading state ─────────────────────────────────────────────────
  if (loadingReport) {
    return (
      <div className="min-h-screen bg-paw-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-paw-orange" />
          <p className="text-paw-muted text-sm">Loading rescue mission…</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-paw-bg flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🚐</div>
          <h1 className="text-xl font-bold mb-2">No Active Mission</h1>
          <p className="text-paw-muted text-sm">No report ID provided or no dispatched reports found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paw-bg">
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">

        {/* Mission header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-paw-orange/20 bg-paw-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-paw-red/15">
                <AlertTriangle className="h-4 w-4 text-paw-red" />
              </div>
              <div>
                <div className="text-xs text-paw-muted">Active Rescue</div>
                <div className="font-bold text-paw-orange font-mono">{report.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-paw-bg px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-paw-muted" />
              <span className="font-mono text-sm font-medium">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Animal info */}
          <div className="flex items-center gap-3 rounded-lg bg-paw-bg/50 p-3">
            <span className="text-3xl">{report.species === "Dog" ? "🐕" : report.species === "Cat" ? "🐈" : report.species === "Cow" ? "🐄" : report.species === "Bird" ? "🐦" : "🐾"}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{report.species} — Rescue</div>
              <div className="text-xs text-paw-muted truncate">{report.location}</div>
            </div>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
              style={{ backgroundColor: `${severityColor(report.severity)}20`, color: severityColor(report.severity) }}>
              {report.severity}/10
            </span>
          </div>

          {/* Injury tags if present */}
          {report.injury_tags && report.injury_tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {report.injury_tags.slice(0, 4).map(tag => (
                <span key={tag} className="rounded-full bg-paw-red/15 px-2 py-0.5 text-[10px] text-paw-red font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Live navigation map */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl border border-paw-orange/20 bg-paw-card">
          <MapplsMap center={mapCenter} zoom={15} className="h-56" onMapReady={handleMapReady} />

          {/* GPS status */}
          <div className="absolute top-3 left-3 z-20">
            {gpsStatus === "active" && (
              <div className="flex items-center gap-1.5 rounded-full bg-paw-green/20 backdrop-blur-sm px-2.5 py-1 text-xs text-paw-green">
                <Signal className="h-3 w-3" /> GPS Active
                {gpsAccuracy && <span className="text-paw-green/60">±{Math.round(gpsAccuracy)}m</span>}
              </div>
            )}
            {gpsStatus === "requesting" && (
              <div className="flex items-center gap-1.5 rounded-full bg-paw-orange/20 backdrop-blur-sm px-2.5 py-1 text-xs text-paw-orange animate-pulse">
                <Locate className="h-3 w-3" /> Requesting GPS…
              </div>
            )}
            {(gpsStatus === "denied" || gpsStatus === "error") && (
              <div className="flex items-center gap-1.5 rounded-full bg-paw-red/20 backdrop-blur-sm px-2.5 py-1 text-xs text-paw-red">
                <WifiOff className="h-3 w-3" /> GPS {gpsStatus === "denied" ? "Denied" : "Error"}
              </div>
            )}
          </div>

          {/* Destination label */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-paw-orange/20 backdrop-blur-sm px-2.5 py-1 text-xs text-paw-orange">
            <MapPin className="h-3 w-3" /> {currentStage < 2 ? "Pickup" : "Shelter"}
          </div>

          {/* ETA bar */}
          <div className="flex items-center justify-between border-t border-paw-orange/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <Navigation className="h-4 w-4 text-paw-blue" />
              <span className="text-sm font-medium">
                {distanceKm ? `${distanceKm.toFixed(1)} km away` : "Calculating…"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-paw-muted" />
              <span className="text-paw-muted">ETA:</span>
              <span className="font-bold text-paw-orange">{etaMinutes ? `${etaMinutes} min` : "—"}</span>
            </div>
          </div>
        </motion.div>

        {/* GPS denied banner */}
        {(gpsStatus === "denied" || gpsStatus === "error") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-paw-red/30 bg-paw-red/5 p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-paw-red flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-paw-red">GPS Unavailable</div>
                <div className="text-xs text-paw-muted mt-1">
                  {gpsStatus === "denied"
                    ? "Enable location access in browser settings to broadcast your position."
                    : "Unable to get GPS. Live tracking disabled."}
                </div>
                <button onClick={() => window.location.reload()} className="mt-2 text-xs text-paw-orange hover:underline">
                  Try again
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mission progress */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-paw-orange/20 bg-paw-card p-4">
          <div className="text-xs text-paw-muted mb-3">Mission Progress</div>
          <div className="space-y-0">
            {missionStages.map((stage, i) => {
              const Icon = stage.icon;
              const isDone = i < currentStage;
              const isCurrent = i === currentStage;
              return (
                <div key={stage.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full transition-all
                      ${isDone ? "bg-paw-green/20" : isCurrent ? "bg-paw-orange/20 animate-pulse-glow" : "bg-paw-muted/10"}`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4 text-paw-green" />
                        : isCurrent ? <Icon className="h-4 w-4 text-paw-orange" />
                        : <Circle className="h-4 w-4 text-paw-muted/30" />}
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

          <button onClick={advanceStage} disabled={stageComplete}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold transition-all
              ${stageComplete ? "bg-paw-green/20 text-paw-green cursor-default"
              : "bg-paw-orange text-white hover:shadow-lg hover:shadow-paw-orange/25 active:scale-[0.98]"}`}>
            {stageComplete ? <><CheckCircle2 className="h-5 w-5" /> Mission Complete</>
              : <><NextIcon className="h-5 w-5" /> {currentStage + 1 < missionStages.length ? `Update: ${missionStages[currentStage + 1].label}` : "Complete Mission"}</>}
          </button>
        </motion.div>

        {/* Quick contacts */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3">
          <button onClick={() => toast("Calling reporter…")}
            className="flex items-center gap-2 rounded-xl border border-paw-blue/20 bg-paw-card p-3 text-sm font-medium text-paw-blue transition-all hover:bg-paw-blue/5 active:scale-[0.98]">
            <Phone className="h-4 w-4" /> Call Reporter
          </button>
          <button onClick={() => toast("Opening WhatsApp…")}
            className="flex items-center gap-2 rounded-xl border border-paw-green/20 bg-paw-card p-3 text-sm font-medium text-paw-green transition-all hover:bg-paw-green/5 active:scale-[0.98]">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
          <button onClick={() => toast("Calling emergency vet…")}
            className="flex items-center gap-2 rounded-xl border border-paw-red/20 bg-paw-card p-3 text-sm font-medium text-paw-red transition-all hover:bg-paw-red/5 active:scale-[0.98]">
            <Phone className="h-4 w-4" /> Emergency Vet
          </button>
          <button onClick={() => {
            if (driverPosition) {
              const dest = currentStage < 2 ? { lat: report.lat, lng: report.lng } : { lat: SHELTER.lat, lng: SHELTER.lng };
              window.open(`https://maps.mappls.com/directions?from=${driverPosition.lat},${driverPosition.lng}&to=${dest.lat},${dest.lng}`, "_blank");
            } else {
              toast("Enable GPS first");
            }
          }} className="flex items-center gap-2 rounded-xl border border-paw-orange/20 bg-paw-card p-3 text-sm font-medium text-paw-orange transition-all hover:bg-paw-orange/5 active:scale-[0.98]">
            <Navigation className="h-4 w-4" /> Navigate
          </button>
        </motion.div>

        {/* Pickup confirmation */}
        <AnimatePresence>
          {currentStage >= 1 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-xl border border-paw-orange/20 bg-paw-card p-4 space-y-4">
                <div className="text-sm font-medium">Pickup Confirmation</div>
                <div onClick={() => { setPhotoUploaded(true); toast.success("Photo captured!"); }}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-all
                    ${photoUploaded ? "border-paw-green/40 bg-paw-green/5" : "border-paw-orange/30 hover:border-paw-orange"}`}>
                  <Camera className={`h-6 w-6 ${photoUploaded ? "text-paw-green" : "text-paw-orange"}`} />
                  <div>
                    <div className={`text-sm font-medium ${photoUploaded ? "text-paw-green" : ""}`}>
                      {photoUploaded ? "Photo uploaded ✓" : "Upload Pickup Photo"}
                    </div>
                    <div className="text-xs text-paw-muted">Required for confirmation</div>
                  </div>
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Add observations (condition, behavior, additional injuries…)"
                  className="w-full resize-none rounded-lg border border-paw-orange/20 bg-paw-bg p-3 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none" rows={3} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shelter destination card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl border border-paw-blue/15 bg-paw-card p-4">
          <div className="text-xs text-paw-muted mb-1">Shelter Destination</div>
          <div className="font-medium text-paw-blue">{SHELTER.name}</div>
          <div className="text-sm text-paw-muted mt-0.5">{SHELTER.address}</div>
        </motion.div>

        {/* Live GPS debug */}
        {gpsStatus === "active" && driverPosition && (
          <div className="rounded-lg bg-paw-card/50 border border-paw-orange/10 px-3 py-2 flex items-center justify-between text-xs text-paw-muted">
            <span>📍 {driverPosition.lat.toFixed(5)}, {driverPosition.lng.toFixed(5)}</span>
            {gpsSpeed !== null && gpsSpeed > 0 && <span>🚐 {Math.round(gpsSpeed * 3.6)} km/h</span>}
            {gpsAccuracy !== null && <span>±{Math.round(gpsAccuracy)}m</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paw-bg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-paw-orange" />
      </div>
    }>
      <DriverInner />
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
