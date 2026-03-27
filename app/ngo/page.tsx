"use client";

import { useState, useEffect } from "react";
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
  Wrench,
  LogOut,
  Loader2,
} from "lucide-react";
import { alertCards, type AlertCard, rescuesPerDay, speciesDistribution, responseTimeTrend } from "@/lib/mockData";
import { toast } from "sonner";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
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
  LineChart,
  Line,
} from "recharts";
import Link from "next/link";

const sidebarLinks = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Incoming Alerts", icon: Bell },
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
function OverviewTab() {
  const overviewStats = [
    { label: "Total Alerts Today", value: "23", icon: Bell, color: "#E47F42" },
    { label: "Accepted Today", value: "18", icon: Check, color: "#4FC97E" },
    { label: "Avg Response Time", value: "44 min", icon: Clock, color: "#3B9EFF" },
    { label: "Fleet Utilization", value: "78%", icon: Zap, color: "#FFE00F" },
  ];

  const recentActivity = [
    { text: "Van MH-04-AB-1234 picked up dog at Lajpat Nagar", time: "2 min ago", color: "#4FC97E" },
    { text: "New critical report: Cow at Karol Bagh (severity 8/10)", time: "5 min ago", color: "#FF4F4F" },
    { text: "Bruno (PAW-DOG-0291) vaccination completed", time: "12 min ago", color: "#3B9EFF" },
    { text: "Driver Ravi Kumar completed shift — 4 rescues", time: "25 min ago", color: "#E47F42" },
    { text: "Friendicoes SECA shelter at 92% capacity", time: "1 hr ago", color: "#FFE00F" },
  ];

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
      </div>
    </motion.div>
  );
}

// ---- Incoming Alerts Tab ----
function IncomingAlerts() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
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
          accepted: r.status === "accepted" || r.status === "dispatched",
          image_url: r.image_url
        }));
        setCards(reports);
      })
      .catch((err) => {
        console.error("Fetch alerts error:", err);
        setCards(alertCards.map(c => ({ 
          id: c.id, 
          animal: c.animal, 
          location: c.location, 
          reportedAgo: c.reportedAgo, 
          severity: c.severity, 
          severityLabel: c.severityLabel, 
          color: c.color, 
          animalIcon: c.animalIcon, 
          accepted: false 
        })));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = (id: string | number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, accepted: true } : c))
    );
    toast.success("Van MH-04-AB-1234 assigned. Driver notified.", {
      description: "Dispatching rescue van to location",
    });
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
  );
}

// ---- My Fleet Tab ----
function FleetTab() {
  const fleet = [
    { id: "MH-04-AB-1234", driver: "Ravi Kumar", status: "dispatched", mission: "PAW-2024-0844", rating: 4.8 },
    { id: "DL-01-CD-5678", driver: "Suresh Patel", status: "available", mission: null, rating: 4.6 },
    { id: "DL-08-EF-9012", driver: "Amit Singh", status: "maintenance", mission: null, rating: 4.9 },
  ];

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    dispatched: { bg: "bg-paw-orange/15", text: "text-paw-orange", label: "On Mission" },
    available: { bg: "bg-paw-green/15", text: "text-paw-green", label: "Available" },
    maintenance: { bg: "bg-paw-muted/15", text: "text-paw-muted", label: "Maintenance" },
  };

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-xl font-bold">My Fleet</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fleet.map((v, i) => {
          const sc = statusColors[v.status];
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-paw-orange/15 bg-paw-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-paw-orange" />
                  <span className="font-mono font-medium">{v.id}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
              </div>
              <div className="text-sm">
                <div className="text-paw-text font-medium">{v.driver}</div>
                <div className="text-paw-muted text-xs">⭐ {v.rating} rating</div>
              </div>
              {v.mission && (
                <div className="text-xs text-paw-orange">Active: #{v.mission}</div>
              )}
              {v.status === "maintenance" && (
                <div className="flex items-center gap-1.5 text-xs text-paw-muted">
                  <Wrench className="h-3 w-3" /> Scheduled service — back tomorrow
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ---- Animal Profiles Tab ----
function AnimalProfilesTab() {
  const animals = [
    { id: "PAW-DOG-0291", name: "Bruno", species: "Dog", status: "UNDER TREATMENT", color: "#3B9EFF", emoji: "🐕" },
    { id: "PAW-DOG-0285", name: "Coco", species: "Dog", status: "AVAILABLE FOR ADOPTION", color: "#4FC97E", emoji: "🐕" },
    { id: "PAW-CAT-0102", name: "Whiskers", species: "Cat", status: "RECOVERING", color: "#FFE00F", emoji: "🐈" },
    { id: "PAW-COW-0058", name: "Ganga", species: "Cow", status: "UNDER TREATMENT", color: "#3B9EFF", emoji: "🐄" },
    { id: "PAW-BRD-0034", name: "Chirpy", species: "Bird", status: "AVAILABLE FOR ADOPTION", color: "#4FC97E", emoji: "🐦" },
  ];

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-xl font-bold">Animal Profiles</h2>
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
            {animals.map((a) => (
              <tr key={a.id} className="border-b border-paw-orange/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{a.emoji}</span>
                    <span className="font-medium">{a.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-paw-muted">{a.id}</td>
                <td className="px-5 py-3 text-paw-muted hidden sm:table-cell">{a.species}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${a.color}15`, color: a.color }}>
                    {a.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/animal/${a.id}`} className="text-xs text-paw-orange hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ---- Analytics Tab ----
function AnalyticsView() {
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h2 className="text-xl font-bold">Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-6 col-span-1 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium text-paw-muted">Rescues per Day (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rescuesPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(228,127,66,0.1)" />
                <XAxis dataKey="day" stroke="#BBBBCC" fontSize={12} />
                <YAxis stroke="#BBBBCC" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#0C0C20", border: "1px solid rgba(228,127,66,0.3)", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="rescues" fill="#E47F42" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-6">
          <h3 className="mb-4 text-sm font-medium text-paw-muted">Rescues by Species</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={speciesDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {speciesDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0C0C20", border: "1px solid rgba(228,127,66,0.3)", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-6">
          <h3 className="mb-4 text-sm font-medium text-paw-muted">Avg Response Time (minutes)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(228,127,66,0.1)" />
                <XAxis dataKey="day" stroke="#BBBBCC" fontSize={12} />
                <YAxis stroke="#BBBBCC" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#0C0C20", border: "1px solid rgba(228,127,66,0.3)", borderRadius: "8px", color: "#fff" }} />
                <Line type="monotone" dataKey="time" stroke="#4FC97E" strokeWidth={3} dot={{ fill: "#4FC97E", r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Main Dashboard ----
function NgoDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");

  const tabs: Record<string, React.ReactNode> = {
    "Overview": <OverviewTab />,
    "Incoming Alerts": <IncomingAlerts />,
    "My Fleet": <FleetTab />,
    "Animal Profiles": <AnimalProfilesTab />,
    "Analytics": <AnalyticsView />,
  };

  return (
    <div className="min-h-screen bg-paw-bg flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-paw-orange/15 bg-paw-card p-4 pt-6">
        <div className="flex items-center gap-2 px-3 mb-8">
          <PawPrint className="h-5 w-5 text-paw-orange" />
          <span className="font-bold text-paw-orange">NGO Dashboard</span>
        </div>
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
                {link.label === "Incoming Alerts" && (
                  <span className="ml-auto rounded-full bg-paw-red/15 px-2 py-0.5 text-xs font-bold text-paw-red">4</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-paw-orange/10">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-paw-muted transition-all hover:bg-white/5 hover:text-paw-text"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
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
  );
}

export default function NgoDashboardPage() {
  return (
    <ProtectedRoute requiredRole="ngo">
      <NgoDashboard />
    </ProtectedRoute>
  );
}
