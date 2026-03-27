"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Star,
  CheckCircle2,
  Circle,
  MapPin,
  Share2,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  trackingSteps as initialSteps,
  driverInfo,
  rescueId,
} from "@/lib/mockData";
import { toast } from "sonner";
import MapplsMap from "@/components/MapplsMap";
import {
  createGpsChannel,
  subscribeToLocation,
  type GpsPayload,
} from "@/lib/gps-channel";

// Coordinates from the mock data (report location)
const INCIDENT_LOCATION = { lat: 28.57, lng: 77.21 }; // Lajpat Nagar, Delhi
const SHELTER_LOCATION = { lat: 28.5743, lng: 77.2367 }; // Friendicoes SECA

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
  const [steps, setSteps] = useState(initialSteps);
  const [isLive, setIsLive] = useState(false);
  const [driverPosition, setDriverPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Map marker refs so we can update them
  const vanMarkerRef = useRef<mappls.Marker | null>(null);
  const routeLineRef = useRef<mappls.Polyline | null>(null);
  const mapRef = useRef<mappls.Map | null>(null);
  const lastPingRef = useRef<number>(0);

  // Compute progress
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progressPercent = Math.round(((doneCount + 0.5) / steps.length) * 100);

  // Auto-advance timeline every 8 seconds (demo feature — kept from original)
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.status === "current");
        if (idx === -1 || idx >= prev.length - 1) return prev;

        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        return prev.map((s, i) => {
          if (i === idx)
            return { ...s, status: "done" as const, time: s.time || timeStr };
          if (i === idx + 1)
            return { ...s, status: "current" as const, time: timeStr };
          return s;
        });
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // GPS live status checker — marks as "not live" if no ping in 10s
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastPingRef.current && Date.now() - lastPingRef.current > 10000) {
        setIsLive(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to driver GPS broadcasts
  useEffect(() => {
    const channel = createGpsChannel(rescueId);
    const unsubscribe = subscribeToLocation(
      channel,
      (payload: GpsPayload) => {
        setDriverPosition({ lat: payload.lat, lng: payload.lng });
        setIsLive(true);
        lastPingRef.current = Date.now();

        // Update van marker position on the map
        if (vanMarkerRef.current) {
          vanMarkerRef.current.setPosition({
            lat: payload.lat,
            lng: payload.lng,
          });
        }

        // Update route line
        if (routeLineRef.current) {
          routeLineRef.current.setPath([
            { lat: payload.lat, lng: payload.lng },
            INCIDENT_LOCATION,
          ]);
        }
      }
    );

    return unsubscribe;
  }, []);

  // Compute distance for ETA display
  const distanceKm = driverPosition
    ? haversineDistance(driverPosition, INCIDENT_LOCATION)
    : null;
  const etaMinutes = distanceKm ? Math.max(1, Math.round(distanceKm * 3)) : null; // rough: 20km/h avg

  // Map ready callback — add markers and polyline
  const handleMapReady = useCallback((map: mappls.Map) => {
    mapRef.current = map;

    // Incident marker (red)
    new window.mappls.Marker({
      map,
      position: INCIDENT_LOCATION,
      html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#FF4F4F;box-shadow:0 4px 15px rgba(255,79,79,0.5);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      offset: [0, -20],
      width: 40,
      height: 40,
    });

    // Shelter marker (blue)
    new window.mappls.Marker({
      map,
      position: SHELTER_LOCATION,
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#3B9EFF;box-shadow:0 4px 15px rgba(59,158,255,0.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>`,
      offset: [0, -18],
      width: 36,
      height: 36,
    });

    // Van marker (green) — starts at incident until we get GPS
    const vanMarker = new window.mappls.Marker({
      map,
      position: { lat: 28.565, lng: 77.2 },
      html: `<div style="position:relative;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(79,201,126,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#4FC97E;box-shadow:0 4px 15px rgba(79,201,126,0.5);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
      </div>`,
      offset: [0, -20],
      width: 52,
      height: 52,
    });
    vanMarkerRef.current = vanMarker;

    // Route line (dashed) — van to incident
    const routeLine = new window.mappls.Polyline({
      map,
      path: [
        { lat: 28.565, lng: 77.2 },
        INCIDENT_LOCATION,
      ],
      strokeColor: "#4FC97E",
      strokeOpacity: 0.6,
      strokeWeight: 3,
      dasharray: [10, 6],
    });
    routeLineRef.current = routeLine;
  }, []);

  const handleShareTracking = () => {
    const url = `https://pawalert.in/track/${rescueId.replace("#", "")}`;
    navigator.clipboard?.writeText(url);
    toast.success("Tracking link copied!", { description: url });
  };

  return (
    <div className="min-h-screen bg-paw-bg">
      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Map area — real Mappls map */}
        <MapplsMap
          center={INCIDENT_LOCATION}
          zoom={14}
          className="flex-1 overflow-hidden rounded-none"
          onMapReady={handleMapReady}
        />

        {/* Live indicator badge */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-paw-bg/90 backdrop-blur-sm px-3 py-1.5 border border-paw-orange/20">
          {isLive ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-paw-green" />
              <span className="text-xs font-medium text-paw-green">
                Live GPS
              </span>
              <div className="h-2 w-2 rounded-full bg-paw-green animate-pulse" />
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-paw-muted/60" />
              <span className="text-xs font-medium text-paw-muted/60">
                Waiting for GPS…
              </span>
            </>
          )}
        </div>

        {/* ETA overlay on map */}
        {etaMinutes && (
          <div className="absolute bottom-4 right-4 z-30 rounded-lg bg-paw-bg/90 backdrop-blur-sm px-4 py-2 border border-paw-orange/20">
            <div className="text-xs text-paw-muted">ETA</div>
            <div className="text-lg font-bold text-paw-orange">
              ~{etaMinutes} min
            </div>
            {distanceKm && (
              <div className="text-xs text-paw-muted">
                {distanceKm.toFixed(1)} km away
              </div>
            )}
          </div>
        )}

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
                <h2 className="text-xl font-bold text-paw-orange">
                  {rescueId}
                </h2>
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
                <span className="font-bold text-paw-orange">
                  {progressPercent}%
                </span>
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
                      <div
                        className={`w-px flex-1 min-h-[28px] ${
                          s.status === "done"
                            ? "bg-paw-green/40"
                            : "bg-paw-muted/15"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <div
                      className={`text-sm font-medium ${
                        s.status === "current"
                          ? "text-paw-blue"
                          : s.status === "done"
                          ? "text-paw-text"
                          : "text-paw-muted/50"
                      }`}
                    >
                      {s.label}
                      {s.status === "current" && (
                        <span className="ml-2 text-xs text-paw-blue animate-pulse">
                          ← current
                        </span>
                      )}
                    </div>
                    {s.time && (
                      <div className="text-xs text-paw-muted">{s.time}</div>
                    )}
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
                  <div className="text-xs text-paw-muted">
                    {driverInfo.plate}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-paw-gold">
                  <Star className="h-4 w-4 fill-paw-gold" />
                  <span className="text-sm font-medium">
                    {driverInfo.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* ETA */}
            <div className="rounded-lg bg-paw-blue/10 border border-paw-blue/20 p-4 text-center">
              <div className="text-xs text-paw-blue mb-1">
                Estimated Arrival
              </div>
              <div className="text-2xl font-bold text-paw-blue">
                {etaMinutes ? `~${etaMinutes} min` : driverInfo.eta}
              </div>
            </div>

            {/* Call button */}
            <button
              onClick={() =>
                toast("Calling driver...", {
                  description: "Connecting you to Ravi Kumar",
                })
              }
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

// ---- Utility: Haversine distance in km ----
function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
