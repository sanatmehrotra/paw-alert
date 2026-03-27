"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, FileText, AlertTriangle, Activity, Server, Database,
  Wifi, LogOut, X, ExternalLink, Clock, CheckCircle2, XCircle,
  Building2, MapPin, Phone, Mail, ChevronRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

const activityLog = [
  { text: "Report #PAW-2024-0848 submitted by citizen Priya S.", time: "Just now", type: "report" },
  { text: "NGO Friendicoes SECA verified by admin", time: "5 min ago", type: "verify" },
  { text: "Bruno (PAW-DOG-0291) vaccination completed", time: "12 min ago", type: "medical" },
  { text: "Citizen Amit K. submitted adoption application for Coco", time: "30 min ago", type: "adopt" },
  { text: "Driver Ravi Kumar completed shift — 4 rescues", time: "1 hr ago", type: "fleet" },
  { text: "System backup completed successfully", time: "2 hr ago", type: "system" },
];

const typeColors: Record<string, string> = {
  report: "#E47F42", verify: "#4FC97E", medical: "#3B9EFF",
  adopt: "#FFE00F", fleet: "#E47F42", system: "#BBBBCC",
};

interface NgoApplication {
  id: string;
  user_id: string;
  email: string;
  phone: string;
  org_name: string;
  description: string;
  city: string;
  working_zone: string;
  address: string;
  pan_url: string | null;
  aadhaar_url: string | null;
  awbi_url: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
}

interface StatsData {
  totalRescues: number;
  activeNgos: number;
  pendingVerifications: number;
  animalsInShelters: number;
}

/* ── NGO Detail Drawer ── */
function NgoDetailDrawer({
  app,
  onClose,
  onApprove,
  onReject,
}: {
  app: NgoApplication;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);

  const getDocUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage
      .from("ngo-documents")
      .createSignedUrl(path, 60 * 10); // 10 min
    return data?.signedUrl || null;
  };

  const openDoc = async (path: string | null, label: string) => {
    if (!path) return;
    const url = await getDocUrl(path);
    if (url) window.open(url, "_blank");
    else toast.error(`Could not open ${label}`);
  };

  const handleApprove = async () => {
    setLoadingAction("approve");
    await onApprove(app.id);
    setLoadingAction(null);
  };

  const handleReject = async () => {
    if (!reason.trim()) { toast.error("Please enter a rejection reason"); return; }
    setLoadingAction("reject");
    await onReject(app.id, reason);
    setLoadingAction(null);
  };

  const statusConfig = {
    pending:  { label: "Pending Review", color: "#FFE00F", bg: "#FFE00F15", icon: Clock },
    approved: { label: "Approved",       color: "#4FC97E", bg: "#4FC97E15", icon: CheckCircle2 },
    rejected: { label: "Rejected",       color: "#FF4F4F", bg: "#FF4F4F15", icon: XCircle },
  }[app.status];

  const StatusIcon = statusConfig.icon;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] overflow-y-auto bg-paw-bg border-l border-paw-orange/15 shadow-2xl"
      >
        {/* Drawer header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-paw-orange/10 bg-paw-bg/95 backdrop-blur-sm px-6 py-4">
          <div>
            <div className="text-xs text-paw-muted uppercase tracking-wider font-medium">NGO Application</div>
            <div className="font-bold text-lg">{app.org_name}</div>
            <div className="font-mono text-xs text-paw-muted">#{app.id}</div>
          </div>
          <button onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-paw-orange/20 text-paw-muted transition-all hover:border-paw-orange hover:text-paw-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: statusConfig.bg, borderColor: `${statusConfig.color}30` }}>
            <StatusIcon className="h-4 w-4" style={{ color: statusConfig.color }} />
            <span className="text-sm font-semibold" style={{ color: statusConfig.color }}>
              {statusConfig.label}
            </span>
            <span className="ml-auto text-xs text-paw-muted">
              {new Date(app.submitted_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>

          {/* Organisation Info */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-paw-muted mb-3 uppercase tracking-wider">
              <Building2 className="h-4 w-4" /> Organisation
            </h3>
            <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-4 space-y-3">
              <div>
                <div className="text-xs text-paw-muted">Name</div>
                <div className="font-medium">{app.org_name}</div>
              </div>
              {app.description && (
                <div>
                  <div className="text-xs text-paw-muted">Description</div>
                  <div className="text-sm text-paw-text">{app.description}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-paw-muted flex items-center gap-1"><MapPin className="h-3 w-3" /> City</div>
                  <div className="text-sm font-medium">{app.city || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-paw-muted">Working Zone</div>
                  <div className="text-sm font-medium">{app.working_zone || "—"}</div>
                </div>
              </div>
              {app.address && (
                <div>
                  <div className="text-xs text-paw-muted">Office Address</div>
                  <div className="text-sm text-paw-text">{app.address}</div>
                </div>
              )}
            </div>
          </section>

          {/* Contact Info */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-paw-muted mb-3 uppercase tracking-wider">
              <Mail className="h-4 w-4" /> Contact
            </h3>
            <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-paw-muted" />
                <span className="text-sm">{app.email}</span>
              </div>
              {app.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-paw-muted" />
                  <span className="text-sm">{app.phone}</span>
                </div>
              )}
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-paw-muted mb-3 uppercase tracking-wider">
              <FileText className="h-4 w-4" /> Documents
            </h3>
            <div className="rounded-xl border border-paw-orange/15 bg-paw-card divide-y divide-paw-orange/10">
              {[
                { label: "PAN Card", path: app.pan_url, required: true },
                { label: "Aadhaar Card", path: app.aadhaar_url, required: true },
                { label: "AWBI Certificate", path: app.awbi_url, required: false },
              ].map(({ label, path, required }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {path
                      ? <CheckCircle2 className="h-4 w-4 text-paw-green" />
                      : <AlertTriangle className={`h-4 w-4 ${required ? "text-paw-red" : "text-paw-muted/40"}`} />}
                    <span className={`text-sm ${path ? "text-paw-text" : "text-paw-muted/60"}`}>
                      {label} {!required && <span className="text-paw-muted/40">(optional)</span>}
                    </span>
                  </div>
                  {path ? (
                    <button onClick={() => openDoc(path, label)}
                      className="flex items-center gap-1 rounded-lg bg-paw-orange/10 px-3 py-1.5 text-xs font-medium text-paw-orange transition-all hover:bg-paw-orange/20">
                      View <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="text-xs text-paw-muted/40">Not uploaded</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Rejection reason (if rejected) */}
          {app.status === "rejected" && app.rejection_reason && (
            <div className="rounded-xl border border-paw-red/20 bg-paw-red/5 p-4">
              <div className="text-xs text-paw-red font-medium mb-1">Rejection Reason</div>
              <div className="text-sm text-paw-muted">{app.rejection_reason}</div>
            </div>
          )}

          {/* Actions */}
          {app.status === "pending" && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-paw-muted uppercase tracking-wider">Admin Action</h3>

              {!rejecting ? (
                <div className="flex gap-3">
                  <button onClick={handleApprove} disabled={!!loadingAction}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-paw-green/15 py-3 text-sm font-semibold text-paw-green transition-all hover:bg-paw-green/25 disabled:opacity-50">
                    {loadingAction === "approve"
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Check className="h-4 w-4" /> Approve</>}
                  </button>
                  <button onClick={() => setRejecting(true)} disabled={!!loadingAction}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-paw-red/30 py-3 text-sm font-semibold text-paw-red transition-all hover:bg-paw-red/10 disabled:opacity-50">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-3">
                  <textarea value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="Reason for rejection (visible to the NGO)…"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-paw-red/30 bg-paw-bg px-4 py-3 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-red focus:outline-none" />
                  <div className="flex gap-3">
                    <button onClick={() => setRejecting(false)}
                      className="flex-1 rounded-xl border border-paw-orange/30 py-2.5 text-sm text-paw-muted hover:text-paw-text transition-all">
                      Cancel
                    </button>
                    <button onClick={handleReject} disabled={!reason.trim() || !!loadingAction}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-paw-red/15 py-2.5 text-sm font-semibold text-paw-red transition-all hover:bg-paw-red/25 disabled:opacity-40">
                      {loadingAction === "reject"
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : "Confirm Rejection"}
                    </button>
                  </div>
                </motion.div>
              )}
            </section>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ── Admin Dashboard ── */
function AdminDashboard() {
  const { signOut } = useAuth();
  const [applications, setApplications] = useState<NgoApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<NgoApplication | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setStats({ totalRescues: 847, activeNgos: 34, pendingVerifications: 6, animalsInShelters: 312 }));

    fetch("/api/ngo-applications")
      .then(r => r.json())
      .then(data => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setApplications([]))
      .finally(() => setLoadingApps(false));
  }, []);

  const pendingCount = applications.filter(a => a.status === "pending").length;

  const adminStats = stats ? [
    { label: "Total Rescues This Month", value: String(stats.totalRescues), icon: "🐾", color: "#E47F42" },
    { label: "Active NGOs", value: String(stats.activeNgos), icon: "🏥", color: "#4FC97E" },
    { label: "Pending Verifications", value: String(pendingCount || stats.pendingVerifications), icon: "⏳", color: "#FFE00F", badge: pendingCount > 0 },
    { label: "Animals in Shelters", value: String(stats.animalsInShelters), icon: "🏠", color: "#3B9EFF" },
  ] : [];

  const handleApprove = async (id: string) => {
    await fetch("/api/ngo/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id, action: "approve" }),
    });
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: "approved" } : a));
    if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status: "approved" } : null);
    toast.success("NGO approved!", { description: "The organisation can now sign in." });
  };

  const handleReject = async (id: string, reason: string) => {
    await fetch("/api/ngo/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id, action: "reject", reason }),
    });
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: "rejected", rejection_reason: reason } : a));
    if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status: "rejected", rejection_reason: reason } : null);
    toast("Application rejected", { description: "The NGO has been notified." });
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-paw-green/15 px-2.5 py-0.5 text-xs font-bold text-paw-green">
        <Check className="h-3 w-3" /> Approved
      </span>
    );
    if (status === "rejected") return (
      <span className="inline-flex items-center gap-1 rounded-full bg-paw-red/15 px-2.5 py-0.5 text-xs font-bold text-paw-red">
        <X className="h-3 w-3" /> Rejected
      </span>
    );
    return (
      <span className="rounded-full bg-paw-gold/10 px-2.5 py-0.5 text-xs font-medium text-paw-gold">
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-paw-bg px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
              Admin <span className="text-paw-orange">Panel</span>
            </h1>
            <p className="text-paw-muted">Platform overview and management</p>
          </div>
          <button onClick={() => signOut()}
            className="flex items-center gap-2 rounded-lg border border-paw-orange/20 bg-paw-card px-4 py-2 text-sm font-medium text-paw-muted transition-all hover:border-paw-orange/40 hover:text-paw-text">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden" animate="visible">
          {adminStats.map((stat, i) => (
            <motion.div key={stat.label} custom={i} variants={fadeUp}
              className="rounded-xl border border-paw-orange/15 bg-paw-card p-6 transition-all hover:border-paw-orange/30"
              style={{ borderLeftColor: stat.color, borderLeftWidth: "3px" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                {stat.badge && (
                  <span className="rounded-full bg-paw-orange/15 px-2.5 py-0.5 text-xs font-bold text-paw-orange">
                    Action needed
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="mt-1 text-sm text-paw-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Activity + System */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <motion.div className="lg:col-span-2 rounded-xl border border-paw-orange/15 bg-paw-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-paw-orange" />
              <h3 className="text-sm font-semibold">Activity Log</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activityLog.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: typeColors[item.type] }} />
                  <div className="flex-1">
                    <div className="text-sm text-paw-text">{item.text}</div>
                    <div className="text-xs text-paw-muted">{item.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="rounded-xl border border-paw-green/20 bg-paw-card p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-4 w-4 text-paw-green" />
              <h3 className="text-sm font-semibold">System Health</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: "Platform Uptime", value: "99.97%", icon: Wifi, color: "#4FC97E" },
                { label: "API Calls Today", value: "14,832", icon: Activity, color: "#3B9EFF" },
                { label: "Storage Used", value: "42.3 GB", icon: Database, color: "#E47F42" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: `${item.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-paw-muted">{item.label}</div>
                      <div className="text-sm font-bold" style={{ color: item.color }}>{item.value}</div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-paw-green" />
                  </div>
                );
              })}
              <div className="text-xs text-paw-green mt-2 pt-2 border-t border-paw-green/10">
                ✓ All systems operational
              </div>
            </div>
          </motion.div>
        </div>

        {/* NGO Verification Queue */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">NGO Verification Queue</h2>
            {pendingCount > 0 && (
              <span className="rounded-full bg-paw-orange/15 px-3 py-1 text-xs font-bold text-paw-orange">
                {pendingCount} pending
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-paw-orange/15 bg-paw-card">
            {loadingApps ? (
              <div className="flex items-center justify-center py-16 gap-3 text-paw-muted text-sm">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading applications…
              </div>
            ) : applications.length === 0 ? (
              <div className="py-16 text-center text-paw-muted text-sm">
                No NGO applications yet — they will appear here when submitted.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-paw-orange/10">
                    <th className="px-5 py-4 text-left font-medium text-paw-muted">Organisation</th>
                    <th className="px-5 py-4 text-left font-medium text-paw-muted hidden sm:table-cell">City</th>
                    <th className="px-5 py-4 text-left font-medium text-paw-muted hidden md:table-cell">Applied</th>
                    <th className="px-5 py-4 text-left font-medium text-paw-muted">Documents</th>
                    <th className="px-5 py-4 text-left font-medium text-paw-muted">Status</th>
                    <th className="px-5 py-4 text-right font-medium text-paw-muted">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`border-b border-paw-orange/5 cursor-pointer transition-colors
                        ${app.status === "approved" ? "bg-paw-green/5 hover:bg-paw-green/8"
                          : app.status === "rejected" ? "bg-paw-red/5 hover:bg-paw-red/8"
                          : "hover:bg-white/[0.03]"}`}>
                      <td className="px-5 py-4">
                        <div className="font-medium">{app.org_name}</div>
                        <div className="text-xs text-paw-muted font-mono">{app.id}</div>
                      </td>
                      <td className="px-5 py-4 text-paw-muted hidden sm:table-cell">{app.city || "—"}</td>
                      <td className="px-5 py-4 text-paw-muted text-xs hidden md:table-cell">
                        {new Date(app.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`flex items-center gap-1.5 text-sm
                          ${app.pan_url && app.aadhaar_url ? "text-paw-green" : "text-paw-gold"}`}>
                          {app.pan_url && app.aadhaar_url
                            ? <><Check className="h-4 w-4" /> All submitted</>
                            : <><AlertTriangle className="h-4 w-4" /> Incomplete</>}
                        </span>
                      </td>
                      <td className="px-5 py-4">{statusBadge(app.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-paw-orange hover:underline">
                          View <ChevronRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedApp && (
          <NgoDetailDrawer
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
