// ============================================================
// PawAlert — Mock Data (no backend needed)
// ============================================================

export const stats = [
  { label: "Stray animals in India", value: "20.3M+", icon: "🐾" },
  { label: "NGOs with zero shared platform", value: "3,786", icon: "🏥" },
  { label: "Animals die/day from neglect", value: "5", icon: "💔" },
];

export const howItWorks = [
  { step: "01", title: "Citizen Reports", description: "Snap a photo & submit location", icon: "📱" },
  { step: "02", title: "AI Triages", description: "Vision AI assesses severity instantly", icon: "🧠" },
  { step: "03", title: "NGO Dispatches", description: "Nearest NGO gets alerted", icon: "🚐" },
  { step: "04", title: "Live Tracking", description: "Track rescue in real-time", icon: "📡" },
  { step: "05", title: "Animal Saved", description: "Treatment, vaccination & adoption", icon: "❤️" },
];

export const features = [
  {
    title: "AI Triage",
    description: "Computer vision analyses injuries from photos and assigns severity scores in seconds.",
    icon: "🧠",
    color: "#E47F42",
  },
  {
    title: "Live GPS Tracking",
    description: "Track rescue vans in real-time from dispatch to shelter admission.",
    icon: "📡",
    color: "#3B9EFF",
  },
  {
    title: "Full Lifecycle",
    description: "End-to-end tracking: rescue → treatment → vaccination → adoption.",
    icon: "🔄",
    color: "#4FC97E",
  },
];

export const speciesOptions = ["Dog", "Cat", "Cow", "Bird", "Other"] as const;

export const severityResult = {
  score: 7,
  maxScore: 10,
  label: "HIGH SEVERITY",
  description: "Possible fracture or deep laceration detected. Immediate rescue recommended.",
  note: "This report will be prioritised in the NGO queue",
};

export const rescueId = "#PAW-2024-0847";

export interface TrackingStep {
  label: string;
  time?: string;
  status: "done" | "current" | "pending";
}

export const trackingSteps: TrackingStep[] = [
  { label: "Report Submitted", time: "2:34 PM", status: "done" },
  { label: "NGO Notified", time: "2:35 PM", status: "done" },
  { label: "Van Dispatched", time: "2:38 PM", status: "done" },
  { label: "En Route", status: "current" },
  { label: "Animal Picked Up", status: "pending" },
  { label: "At Shelter", status: "pending" },
  { label: "Under Treatment", status: "pending" },
  { label: "Vaccinated", status: "pending" },
  { label: "Available for Adoption", status: "pending" },
];

export const driverInfo = {
  name: "Ravi Kumar",
  plate: "MH 04 AB 1234",
  rating: 4.8,
  eta: "~12 minutes",
};

export interface AlertCard {
  id: number;
  severity: number;
  severityLabel: string;
  color: string;
  animal: string;
  animalIcon: string;
  location: string;
  reportedAgo: string;
}

export const alertCards: AlertCard[] = [
  { id: 1, severity: 9, severityLabel: "CRITICAL", color: "#FF4F4F", animal: "Dog", animalIcon: "🐕", location: "Lajpat Nagar, Delhi", reportedAgo: "3 mins ago" },
  { id: 2, severity: 7, severityLabel: "HIGH", color: "#E47F42", animal: "Cow", animalIcon: "🐄", location: "Karol Bagh, Delhi", reportedAgo: "8 mins ago" },
  { id: 3, severity: 5, severityLabel: "MODERATE", color: "#FFE00F", animal: "Cat", animalIcon: "🐈", location: "Dwarka Sector 10", reportedAgo: "14 mins ago" },
  { id: 4, severity: 3, severityLabel: "LOW", color: "#4FC97E", animal: "Bird", animalIcon: "🐦", location: "Rohini", reportedAgo: "22 mins ago" },
];

export const rescuesPerDay = [
  { day: "Mon", rescues: 12 },
  { day: "Tue", rescues: 8 },
  { day: "Wed", rescues: 15 },
  { day: "Thu", rescues: 11 },
  { day: "Fri", rescues: 19 },
  { day: "Sat", rescues: 14 },
  { day: "Sun", rescues: 17 },
];

export const speciesDistribution = [
  { name: "Dogs", value: 52, fill: "#E47F42" },
  { name: "Cattle", value: 28, fill: "#3B9EFF" },
  { name: "Cats", value: 14, fill: "#4FC97E" },
  { name: "Others", value: 6, fill: "#FFE00F" },
];

export const responseTimeTrend = [
  { day: "Mon", time: 85 },
  { day: "Tue", time: 72 },
  { day: "Wed", time: 68 },
  { day: "Thu", time: 61 },
  { day: "Fri", time: 55 },
  { day: "Sat", time: 50 },
  { day: "Sun", time: 44 },
];

export const animalProfile = {
  id: "PAW-DOG-0291",
  name: "Bruno",
  species: "Dog",
  breed: "Mixed",
  age: "~2 yrs",
  gender: "Male",
  status: "UNDER TREATMENT",
  rescueDate: "14 Jan 2025",
  location: "Lajpat Nagar, Delhi",
  rescuedBy: "Friendicoes SECA NGO",
  reporter: "Priya S.",
  timeline: [
    { label: "Rescued", date: "14 Jan 2025, 3:12 PM", status: "done" as const },
    { label: "Shelter Admission", date: "14 Jan 2025, 4:30 PM", status: "done" as const },
    { label: "Initial Examination — fracture in left hind leg", date: "14 Jan 2025, 5:00 PM", status: "done" as const },
    { label: "Treatment Begun — splinting + antibiotics", date: "14 Jan 2025, 5:30 PM", status: "done" as const },
    { label: "Anti-Rabies Vaccination", date: "16 Jan 2025", status: "done" as const },
    { label: "Recovery Complete (expected 28 Jan 2025)", status: "pending" as const },
    { label: "Available for Adoption", status: "pending" as const },
  ],
};

export const adminStats = [
  { label: "Total Rescues This Month", value: "847", icon: "🐾", color: "#E47F42" },
  { label: "Active NGOs", value: "34", icon: "🏥", color: "#4FC97E" },
  { label: "Pending NGO Verifications", value: "6", icon: "⏳", color: "#FFE00F", badge: true },
  { label: "Animals in Shelters", value: "312", icon: "🏠", color: "#3B9EFF" },
];

export interface NgoRow {
  id: number;
  name: string;
  city: string;
  appliedOn: string;
  documents: string;
  documentsOk: boolean;
  status: string;
}

export const ngoVerificationQueue: NgoRow[] = [
  { id: 1, name: "Friendicoes SECA", city: "Delhi", appliedOn: "10 Jan 2025", documents: "All submitted", documentsOk: true, status: "Pending" },
  { id: 2, name: "CARE India", city: "Mumbai", appliedOn: "12 Jan 2025", documents: "PAN missing", documentsOk: false, status: "Incomplete" },
  { id: 3, name: "Animal Aid Unlimited", city: "Udaipur", appliedOn: "13 Jan 2025", documents: "All submitted", documentsOk: true, status: "Pending" },
];

export const ngoSidebarLinks = [
  { label: "Overview", icon: "LayoutDashboard" },
  { label: "Incoming Alerts", icon: "Bell" },
  { label: "My Fleet", icon: "Truck" },
  { label: "Animal Profiles", icon: "PawPrint" },
  { label: "Analytics", icon: "BarChart3" },
] as const;
