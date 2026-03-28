"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Bell,
  Truck,
  PawPrint,
  BarChart3,
  Check,
  X,
  Activity,
  Clock,
  Zap,
  Wrench as _Wrench,
  LogOut,
  Loader2,
  Map,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react";
import { getTagStyle } from "@/lib/gemini-triage";
import { subscribeToMultipleRescues, type GpsPayload } from "@/lib/gps-channel";
import { toast } from "sonner";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import MapplsMap from "@/components/MapplsMap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  // LineChart and Line removed - analytics now uses PieChart for severity
} from "recharts";
import Link from "next/link";

const sidebarLinks = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Incoming Alerts", icon: Bell },
  { label: "Live Map", icon: Map },
  { label: "My Fleet", icon: Truck },
  { label: "Animal Profiles", icon: PawPrint },
  { label: "Analytics", icon: BarChart3 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

// ---- Overview Tab ----
function OverviewTab({ ngoId }: { ngoId: string }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports?ngo_id=${ngoId}`)
      .then(r => r.json())
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ngoId]);

  const today = new Date().toDateString();
  const todayReports = reports.filter(r => new Date(r.created_at).toDateString() === today);
  const dispatched = reports.filter(r => r.status === "dispatched" || r.status === "accepted");
  const pending = reports.filter(r => r.status === "pending");

  const overviewStats = [
    { label: "Total Reports", value: String(reports.length), icon: Bell, color: "#E47F42" },
    { label: "Dispatched", value: String(dispatched.length), icon: Check, color: "#4FC97E" },
    { label: "Pending", value: String(pending.length), icon: Clock, color: "#3B9EFF" },
    { label: "Today", value: String(todayReports.length), icon: Zap, color: "#FFE00F" },
  ];

  // Build activity feed from recent reports
  const recentActivity = reports.slice(0, 8).map(r => {
    const colors: Record<string, string> = { pending: "#FFE00F", dispatched: "#4FC97E", accepted: "#3B9EFF" };
    const ago = getTimeAgo(new Date(r.created_at));
    return {
      text: `${r.species} reported at ${r.location} — severity ${r.severity}/10`,
      time: ago,
      color: colors[r.status] || "#E47F42",
    };
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-paw-orange" /></div>;
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-xl font-bold">Overview</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-paw-orange/15 bg-paw-card p-4"
              style={{ borderLeftColor: stat.color, borderLeftWidth: "3px" }}
            >
              <Icon className="h-5 w-5 mb-2" style={{ color: stat.color }} />
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-paw-muted mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Activity feed */}
      <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-paw-orange" />
          <h3 className="text-sm font-medium">Recent Activity</h3>
        </div>
        {recentActivity.length === 0 ? (
          <div className="text-sm text-paw-muted text-center py-6">No reports yet. Activity will appear here as reports come in.</div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-paw-text">{item.text}</div>
                  <div className="text-xs text-paw-muted">{item.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

// ---- Dispatch Link Modal ----
function DispatchModal({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const driverLink = `${typeof window !== "undefined" ? window.location.origin : ""}/driver?id=${encodeURIComponent(reportId)}`;
  const trackLink = `${typeof window !== "undefined" ? window.location.origin : ""}/track?id=${encodeURIComponent(reportId)}`;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-paw-green/30 bg-paw-card p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paw-green/15">
            <Check className="h-5 w-5 text-paw-green" />
          </div>
          <div>
            <div className="font-bold">Van Dispatched!</div>
            <div className="text-xs text-paw-muted font-mono">{reportId}</div>
          </div>
          <button onClick={onClose} className="ml-auto text-paw-muted hover:text-paw-text"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          {/* Driver link */}
          <div className="rounded-xl border border-paw-orange/20 bg-paw-bg p-4">
            <div className="text-xs text-paw-muted mb-1.5 font-medium uppercase tracking-wider">🚐 Driver Link</div>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-xs text-paw-text truncate">{driverLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(driverLink); toast.success("Driver link copied!"); }}
                className="shrink-0 rounded-lg bg-paw-orange/15 px-3 py-1.5 text-xs text-paw-orange hover:bg-paw-orange/25 flex items-center gap-1">
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <div className="text-xs text-paw-muted mt-1">Send this to the driver. They open it to start GPS tracking.</div>
          </div>

          {/* Track link */}
          <div className="rounded-xl border border-paw-blue/20 bg-paw-bg p-4">
            <div className="text-xs text-paw-muted mb-1.5 font-medium uppercase tracking-wider">📍 Citizen Tracker</div>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-xs text-paw-text truncate">{trackLink}</span>
              <a href={trackLink} target="_blank" rel="noreferrer"
                className="shrink-0 rounded-lg bg-paw-blue/15 px-3 py-1.5 text-xs text-paw-blue hover:bg-paw-blue/25 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Open
              </a>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-paw-orange/10 py-2.5 text-sm font-medium text-paw-orange hover:bg-paw-orange/20 transition-all">Close</button>
      </motion.div>
    </>
  );
}

// ---- Incoming Alerts Tab (shows UNASSIGNED pending reports — the global pool) ----
function IncomingAlerts({ ngoId }: { ngoId: string }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchModal, setDispatchModal] = useState<string | null>(null);

  useEffect(() => {
    // Fetch ALL pending reports (not assigned to any NGO yet)
    fetch("/api/reports?status=pending")
      .then(r => r.json())
      .then((data: any[]) => {
        const severityColors: Record<string, string> = {
          CRITICAL: "#FF4F4F", HIGH: "#E47F42", MODERATE: "#FFE00F", LOW: "#4FC97E"
        };
        const speciesIcons: Record<string, string> = {
          Dog: "🐕", Cat: "🐈", Cow: "🐄", Bird: "🐦", Other: "🐾"
        };
        const reports = data.map(r => ({
          id: r.id,
          animal: r.species,
          location: r.location,
          reportedAgo: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: r.severity,
          severityLabel: r.severity_label,
          color: severityColors[r.severity_label] || "#FFE00F",
          animalIcon: speciesIcons[r.species] || "🐾",
          accepted: false,
          image_url: r.image_url,
          injury_tags: r.injury_tags || [],
          ai_description: r.ai_description || null,
        }));
        setCards(reports);
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id, ngoId }),
      });
    } catch { /* ignore — links still work */ }
    setCards(prev => prev.map(c => c.id === id ? { ...c, accepted: true } : c));
    setDispatchModal(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-paw-orange" />
        <div className="ml-3 text-paw-muted text-sm">Loading live alerts...</div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {dispatchModal && (
          <DispatchModal reportId={dispatchModal} onClose={() => setDispatchModal(null)} />
        )}
      </AnimatePresence>

      <motion.div className="space-y-4" initial="hidden" animate="visible">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Incoming Alerts</h2>
        <span className="rounded-full bg-paw-red/15 px-3 py-1 text-xs font-bold text-paw-red">
          {cards.filter((c) => !c.accepted).length} pending
        </span>
      </div>
      {cards.length === 0 ? (
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-10 text-center text-paw-muted text-sm">
          No reports yet — new submissions will appear here instantly.
        </div>
      ) : cards.map((card, i) => (
        <motion.div
          key={card.id}
          custom={i}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className={`relative flex items-stretch overflow-hidden rounded-xl border transition-all duration-500 ${
            card.accepted
              ? "border-paw-green/40 bg-paw-green/5"
              : "border-paw-orange/15 bg-paw-card hover:border-paw-orange/30"
          }`}
        >
          <div className="w-1.5 shrink-0" style={{ backgroundColor: card.accepted ? "#4FC97E" : card.color }} />
          
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
            {card.image_url && (
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-paw-orange/10">
                <img src={card.image_url} alt="Animal" className="h-full w-full object-cover" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{card.animalIcon}</span>
                <span className="font-semibold text-lg">{card.animal}</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: card.accepted ? "rgba(79,201,126,0.15)" : `${card.color}20`,
                    color: card.accepted ? "#4FC97E" : card.color,
                  }}
                >
                  {card.accepted ? "✓ DISPATCHING" : `${card.severity}/10 ${card.severityLabel}`}
                </span>
              </div>
              <div className="text-sm text-paw-muted">📍 {card.location} · {card.reportedAgo}</div>
              {card.ai_description && (
                <div className="text-xs text-paw-muted/70 mt-1 line-clamp-2">{card.ai_description}</div>
              )}
              {card.injury_tags && card.injury_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {card.injury_tags.map((tag: string) => {
                    const style = getTagStyle(tag);
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: style.bg, color: style.text }}
                      >
                        <span>{style.emoji}</span>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            
            {!card.accepted ? (
              <div className="flex gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => handleAccept(card.id)}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-paw-green/15 px-4 py-2 text-sm font-medium text-paw-green transition-all hover:bg-paw-green/25"
                >
                  <Check className="h-4 w-4" /> Accept
                </button>
                <button className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-paw-red/30 px-4 py-2 text-sm font-medium text-paw-red transition-all hover:bg-paw-red/10">
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-lg bg-paw-green/15 px-4 py-2 text-sm font-medium text-paw-green"
              >
                <Check className="h-4 w-4" /> Dispatching van...
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
      </motion.div>
    </>
  );
}

// ---- Live Map Tab ----
function LiveMapTab({ ngoId }: { ngoId: string }) {
  const [dispatched, setDispatched] = useState<any[]>([]);
  const [vanPositions, setVanPositions] = useState<Record<string, { lat: number; lng: number; timestamp: number }>>({});
  const markersRef = useRef<Record<string, mappls.Marker>>({});
  const mapRef = useRef<mappls.Map | null>(null);

  // Fetch this NGO's dispatched reports
  useEffect(() => {
    const load = () => {
      fetch(`/api/reports?ngo_id=${ngoId}&status=dispatched`)
        .then(r => r.json())
        .then((data: any[]) => setDispatched(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // Subscribe to GPS for all dispatched rescues
  useEffect(() => {
    if (!dispatched.length) return;
    const ids = dispatched.map((r: any) => r.id);
    const unsub = subscribeToMultipleRescues(ids, (rescueId, payload: GpsPayload) => {
      setVanPositions(prev => ({ ...prev, [rescueId]: { lat: payload.lat, lng: payload.lng, timestamp: payload.timestamp } }));
      // Move marker on map
      if (markersRef.current[rescueId]) {
        markersRef.current[rescueId].setPosition({ lat: payload.lat, lng: payload.lng });
      }
    });
    return unsub;
  }, [dispatched.map((r: any) => r.id).join(',')]);

  const handleMapReady = useCallback((map: mappls.Map) => {
    mapRef.current = map;
    // Place van markers for all dispatched rescues
    dispatched.forEach((r: any) => {
      const pos = vanPositions[r.id] || { lat: r.lat, lng: r.lng };
      const hasLive = !!vanPositions[r.id];

      // Incident pin
      new window.mappls.Marker({
        map,
        position: { lat: r.lat, lng: r.lng },
        html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#FF4F4F;box-shadow:0 2px 8px rgba(255,79,79,0.4);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        offset: [0, -14], width: 28, height: 28,
      });

      // Van marker
      const vanMarker = new window.mappls.Marker({
        map,
        position: pos,
        html: hasLive
          ? `<div style="position:relative;"><div style="position:absolute;inset:-5px;border-radius:50%;background:rgba(79,201,126,0.3);animation:ping 1.5s infinite;"></div><div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#4FC97E;border:2px solid white;box-shadow:0 3px 12px rgba(79,201,126,0.5);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div></div>`
          : `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#6B6B80;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>`,
        offset: [0, -17], width: 44, height: 44,
      });
      markersRef.current[r.id] = vanMarker;
    });
  }, [dispatched, vanPositions]);

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Live Dispatch Map</h2>
        <span className="text-xs text-paw-muted">{dispatched.length} active rescue{dispatched.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Map */}
      <div className="relative rounded-xl border border-paw-orange/20 overflow-hidden">
        <MapplsMap
          center={{ lat: 28.6145, lng: 77.2395 }}
          zoom={12}
          className="h-[500px]"
          onMapReady={handleMapReady}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 rounded-lg bg-paw-bg/90 backdrop-blur-sm border border-paw-orange/20 px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-paw-text">
            <div className="h-3 w-3 rounded-full bg-paw-green" /> Live GPS active
          </div>
          <div className="flex items-center gap-2 text-xs text-paw-muted">
            <div className="h-3 w-3 rounded-full bg-paw-muted/60" /> Waiting for driver
          </div>
          <div className="flex items-center gap-2 text-xs text-paw-muted">
            <div className="h-3 w-3 rounded-full bg-paw-red" /> Incident location
          </div>
        </div>
      </div>

      {/* Van list */}
      {dispatched.length === 0 ? (
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-8 text-center text-paw-muted text-sm">
          No active dispatches. Accept an incoming alert to see vans here.
        </div>
      ) : (
        <div className="space-y-2">
          {dispatched.map((r: any) => {
            const pos = vanPositions[r.id];
            const isLive = !!pos && (Date.now() - pos.timestamp < 15000);
            return (
              <div key={r.id} className="flex items-center gap-4 rounded-xl border border-paw-orange/15 bg-paw-card px-4 py-3">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isLive ? 'bg-paw-green animate-pulse' : 'bg-paw-muted/40'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-medium">{r.id}</div>
                  <div className="text-xs text-paw-muted truncate">{r.species} · {r.location}</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {isLive
                    ? <><Wifi className="h-3 w-3 text-paw-green" /><span className="text-paw-green">Live</span></>
                    : <><WifiOff className="h-3 w-3 text-paw-muted/50" /><span className="text-paw-muted/50">Waiting</span></>}
                </div>
                <a href={`/track?id=${r.id}`} target="_blank" rel="noreferrer"
                  className="shrink-0 rounded-lg bg-paw-orange/15 px-2.5 py-1 text-xs text-paw-orange hover:bg-paw-orange/25">
                  Track →
                </a>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ---- My Fleet Tab (Dynamic — shows this NGO's dispatched reports as active missions) ----
function FleetTab({ ngoId }: { ngoId: string }) {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports?ngo_id=${ngoId}&status=dispatched`)
      .then(r => r.json())
      .then((data: any[]) => setMissions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ngoId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-paw-orange" /></div>;
  }

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Active Missions</h2>
        <span className="text-xs text-paw-muted">{missions.length} dispatched</span>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-8 text-center">
          <Truck className="h-10 w-10 text-paw-muted/30 mx-auto mb-3" />
          <div className="text-sm text-paw-muted">No active missions. Dispatch a van from Incoming Alerts.</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-paw-orange/15 bg-paw-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-paw-orange" />
                  <span className="font-mono text-sm font-medium">{m.id}</span>
                </div>
                <span className="rounded-full bg-paw-orange/15 px-2.5 py-0.5 text-xs font-bold text-paw-orange">On Mission</span>
              </div>
              <div className="text-sm">
                <div className="text-paw-text font-medium">{m.species} Rescue</div>
                <div className="text-paw-muted text-xs truncate">📍 {m.location}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: m.severity >= 7 ? '#FF4F4F' : m.severity >= 4 ? '#FFE00F' : '#4FC97E' }}>
                  Severity: {m.severity}/10
                </span>
                <a href={`/track?id=${m.id}`} target="_blank" rel="noreferrer"
                  className="text-xs text-paw-orange hover:underline">Track →</a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ---- Animal Profiles Tab (Dynamic — fetches this NGO's animals from /api/animals) ----
function AnimalProfilesTab({ ngoId }: { ngoId: string }) {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/animals?ngo_id=${ngoId}`)
      .then(r => r.json())
      .then(data => setAnimals(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ngoId]);

  const statusColor = (status: string) => {
    if (status.includes("ADOPTION")) return "#4FC97E";
    if (status.includes("TREATMENT")) return "#3B9EFF";
    if (status.includes("RECOVER")) return "#FFE00F";
    return "#E47F42";
  };
  const speciesEmoji: Record<string, string> = { Dog: "🐕", Cat: "🐈", Cow: "🐄", Bird: "🐦" };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-paw-orange" /></div>;
  }

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-xl font-bold">Animal Profiles</h2>
      {animals.length === 0 ? (
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-8 text-center text-paw-muted text-sm">No animals in shelter yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-paw-orange/15 bg-paw-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paw-orange/10">
                <th className="px-5 py-3 text-left font-medium text-paw-muted">Animal</th>
                <th className="px-5 py-3 text-left font-medium text-paw-muted">ID</th>
                <th className="px-5 py-3 text-left font-medium text-paw-muted hidden sm:table-cell">Species</th>
                <th className="px-5 py-3 text-left font-medium text-paw-muted">Status</th>
                <th className="px-5 py-3 text-right font-medium text-paw-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {animals.map((a: any) => {
                const color = statusColor(a.status || "");
                const emoji = a.image_emoji || speciesEmoji[a.species] || "🐾";
                return (
                  <tr key={a.id} className="border-b border-paw-orange/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{emoji}</span>
                        <span className="font-medium">{a.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-paw-muted">{a.id}</td>
                    <td className="px-5 py-3 text-paw-muted hidden sm:table-cell">{a.species}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${color}15`, color }}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/animal/${a.id}`} className="text-xs text-paw-orange hover:underline">View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

// ---- Analytics Tab (Dynamic — computes from this NGO's reports) ----
function AnalyticsView({ ngoId }: { ngoId: string }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports?ngo_id=${ngoId}`)
      .then(r => r.json())
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ngoId]);

  // Compute species distribution from real data
  const speciesCounts: Record<string, number> = {};
  reports.forEach(r => { speciesCounts[r.species] = (speciesCounts[r.species] || 0) + 1; });
  const total = reports.length || 1;
  const speciesColors: Record<string, string> = { Dog: "#E47F42", Cat: "#4FC97E", Cow: "#3B9EFF", Bird: "#FFE00F" };
  const speciesData = Object.entries(speciesCounts).map(([name, count]) => ({
    name, value: Math.round((count / total) * 100), fill: speciesColors[name] || "#BBBBCC",
  }));

  // Compute daily report counts (last 7 days)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyCounts: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dailyCounts[days[d.getDay()]] = 0;
  }
  reports.forEach(r => {
    const d = new Date(r.created_at);
    const dayName = days[d.getDay()];
    if (dayName in dailyCounts) dailyCounts[dayName]++;
  });
  const dailyData = Object.entries(dailyCounts).map(([day, rescues]) => ({ day, rescues }));

  // Compute severity distribution
  const sevBuckets = [
    { name: "Critical (8-10)", value: reports.filter(r => r.severity >= 8).length, fill: "#FF4F4F" },
    { name: "High (5-7)", value: reports.filter(r => r.severity >= 5 && r.severity < 8).length, fill: "#E47F42" },
    { name: "Low (1-4)", value: reports.filter(r => r.severity < 5).length, fill: "#4FC97E" },
  ].filter(b => b.value > 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-paw-orange" /></div>;
  }

  if (reports.length === 0) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold">Analytics</h2>
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-8 text-center text-sm text-paw-muted">
          No report data yet. Analytics will appear once reports are submitted.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h2 className="text-xl font-bold">Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-6 col-span-1 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium text-paw-muted">Reports per Day (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(228,127,66,0.1)" />
                <XAxis dataKey="day" stroke="#BBBBCC" fontSize={12} />
                <YAxis stroke="#BBBBCC" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0C0C20", border: "1px solid rgba(228,127,66,0.3)", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="rescues" fill="#E47F42" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-6">
          <h3 className="mb-4 text-sm font-medium text-paw-muted">Reports by Species</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={speciesData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {speciesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0C0C20", border: "1px solid rgba(228,127,66,0.3)", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-6">
          <h3 className="mb-4 text-sm font-medium text-paw-muted">Severity Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sevBuckets} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {sevBuckets.map((entry, index) => (
                    <Cell key={`sev-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0C0C20", border: "1px solid rgba(228,127,66,0.3)", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Main Dashboard ----
function NgoDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const ngoId = user?.id || "";

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/ngo/login";
  };

  const tabs: Record<string, React.ReactNode> = {
    "Overview": <OverviewTab ngoId={ngoId} />,
    "Incoming Alerts": <IncomingAlerts ngoId={ngoId} />,
    "Live Map": <LiveMapTab ngoId={ngoId} />,
    "My Fleet": <FleetTab ngoId={ngoId} />,
    "Animal Profiles": <AnimalProfilesTab ngoId={ngoId} />,
    "Analytics": <AnalyticsView ngoId={ngoId} />,
  };

  return (
    <div className="min-h-screen bg-paw-bg flex flex-col">
      {/* Top Header — always visible */}
      <header className="flex items-center justify-between border-b border-paw-orange/15 bg-paw-card px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-paw-orange" />
          <span className="font-bold text-paw-orange text-sm lg:text-base">PawAlert NGO</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-paw-muted truncate max-w-[200px]">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg bg-paw-red/10 px-3 py-2 text-sm font-medium text-paw-red transition-all hover:bg-paw-red/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-paw-orange/15 bg-paw-card p-4 pt-6">
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.label;
              return (
                <button
                  key={link.label}
                  onClick={() => setActiveTab(link.label)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-paw-orange/10 text-paw-orange"
                      : "text-paw-muted hover:text-paw-text hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-paw-orange/15 bg-paw-bg/95 backdrop-blur-xl">
          <div className="flex">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.label;
              return (
                <button
                  key={link.label}
                  onClick={() => setActiveTab(link.label)}
                  className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                    isActive ? "text-paw-orange" : "text-paw-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {tabs[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function NgoDashboardPage() {
  return (
    <ProtectedRoute requiredRole="ngo">
      <NgoDashboard />
    </ProtectedRoute>
  );
}
