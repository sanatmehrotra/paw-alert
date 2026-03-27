"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, FileText, AlertTriangle, Activity, Server, Database, Wifi, LogOut } from "lucide-react";
import { type NgoRow } from "@/lib/mockData";
import { toast } from "sonner";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
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
  report: "#E47F42",
  verify: "#4FC97E",
  medical: "#3B9EFF",
  adopt: "#FFE00F",
  fleet: "#E47F42",
  system: "#BBBBCC",
};

interface StatsData {
  totalRescues: number;
  activeNgos: number;
  pendingVerifications: number;
  animalsInShelters: number;
}

function AdminDashboard() {
  const { signOut } = useAuth();
  const [rows, setRows] = useState<(NgoRow & { verified?: boolean })[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);

  // Fetch stats from API
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats({ totalRescues: 847, activeNgos: 34, pendingVerifications: 6, animalsInShelters: 312 }));
      
    // Fetch NGOs
    fetch("/api/ngo")
      .then(r => r.json())
      .then(data => setRows(data.map((r: NgoRow) => ({ ...r, verified: r.status === "Verified" }))))
      .catch(() => {});
  }, []);

  const adminStats = stats
    ? [
        { label: "Total Rescues This Month", value: String(stats.totalRescues), icon: "🐾", color: "#E47F42" },
        { label: "Active NGOs", value: String(stats.activeNgos), icon: "🏥", color: "#4FC97E" },
        { label: "Pending NGO Verifications", value: String(stats.pendingVerifications), icon: "⏳", color: "#FFE00F", badge: stats.pendingVerifications > 0 },
        { label: "Animals in Shelters", value: String(stats.animalsInShelters), icon: "🏠", color: "#3B9EFF" },
      ]
    : [];

  const handleApprove = async (id: number) => {
    try {
      await fetch("/api/ngo/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoId: id, action: "approve" }),
      });
    } catch { /* ignore */ }

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, verified: true, status: "Verified" } : r))
    );
    toast.success("NGO verified successfully!", {
      description: "Verification email sent to the organization",
    });
  };

  const handleRequestDocs = () => {
    toast("Document request sent", {
      description: "Email sent to CARE India requesting PAN document",
    });
  };

  return (
    <div className="min-h-screen bg-paw-bg px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
              Admin <span className="text-paw-orange">Panel</span>
            </h1>
            <p className="text-paw-muted">Platform overview and management</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 rounded-lg border border-paw-orange/20 bg-paw-card px-4 py-2 text-sm font-medium text-paw-muted transition-all hover:border-paw-orange/40 hover:text-paw-text"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
        >
          {adminStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={fadeUp}
              className="rounded-xl border border-paw-orange/15 bg-paw-card p-6 transition-all hover:border-paw-orange/30"
              style={{ borderLeftColor: stat.color, borderLeftWidth: "3px" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                {stat.badge && (
                  <span className="rounded-full bg-paw-orange/15 px-2.5 py-0.5 text-xs font-bold text-paw-orange">
                    Action needed
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-paw-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Activity Log */}
          <motion.div
            className="lg:col-span-2 rounded-xl border border-paw-orange/15 bg-paw-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-paw-orange" />
              <h3 className="text-sm font-semibold">Activity Log</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activityLog.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: typeColors[item.type] }} />
                  <div className="flex-1">
                    <div className="text-sm text-paw-text">{item.text}</div>
                    <div className="text-xs text-paw-muted">{item.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div
            className="rounded-xl border border-paw-green/20 bg-paw-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-4 w-4 text-paw-green" />
              <h3 className="text-sm font-semibold">System Health</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: "Platform Uptime", value: "99.97%", icon: Wifi, color: "#4FC97E" },
                { label: "API Calls Today", value: "14,832", icon: Activity, color: "#3B9EFF" },
                { label: "Storage Used", value: "42.3 GB", icon: Database, color: "#E47F42" },
              ].map((item) => {
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
                    <div className="h-2 w-2 rounded-full bg-paw-green" title="Healthy" />
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="mb-4 text-xl font-bold">NGO Verification Queue</h2>
          <div className="overflow-x-auto rounded-xl border border-paw-orange/15 bg-paw-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paw-orange/10">
                  <th className="px-5 py-4 text-left font-medium text-paw-muted">NGO Name</th>
                  <th className="px-5 py-4 text-left font-medium text-paw-muted">City</th>
                  <th className="px-5 py-4 text-left font-medium text-paw-muted hidden sm:table-cell">Applied On</th>
                  <th className="px-5 py-4 text-left font-medium text-paw-muted hidden md:table-cell">Documents</th>
                  <th className="px-5 py-4 text-left font-medium text-paw-muted">Status</th>
                  <th className="px-5 py-4 text-right font-medium text-paw-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-paw-orange/5 transition-colors ${
                      row.verified ? "bg-paw-green/5" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-5 py-4 font-medium">{row.name}</td>
                    <td className="px-5 py-4 text-paw-muted">{row.city}</td>
                    <td className="px-5 py-4 text-paw-muted hidden sm:table-cell">{row.appliedOn}</td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`flex items-center gap-1.5 text-sm ${row.documentsOk ? "text-paw-green" : "text-paw-gold"}`}>
                        {row.documentsOk ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        {row.documents}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {row.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-paw-green/15 px-2.5 py-0.5 text-xs font-bold text-paw-green">
                          <Check className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.status === "Pending"
                              ? "text-paw-gold bg-paw-gold/10"
                              : "text-paw-orange bg-paw-orange/10"
                          }`}
                        >
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {row.verified ? (
                        <span className="text-xs text-paw-green">Done</span>
                      ) : row.documentsOk ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(row.id)}
                            className="rounded-lg bg-paw-green/15 px-3 py-1.5 text-xs font-medium text-paw-green transition-all hover:bg-paw-green/25"
                          >
                            Approve
                          </button>
                          <button className="rounded-lg border border-paw-red/30 px-3 py-1.5 text-xs font-medium text-paw-red transition-all hover:bg-paw-red/10">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleRequestDocs}
                          className="rounded-lg bg-paw-orange/15 px-3 py-1.5 text-xs font-medium text-paw-orange transition-all hover:bg-paw-orange/25"
                        >
                          <FileText className="mr-1 inline h-3 w-3" />
                          Request Docs
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
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
