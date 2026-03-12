// ============================================================
// PawAlert — In-memory data store (singleton for dev session)
// ============================================================

export interface Report {
  id: string;
  species: string;
  description: string;
  lat: number;
  lng: number;
  severity: number;
  severityLabel: string;
  status: "pending" | "accepted" | "dispatched" | "completed";
  createdAt: string;
  location: string;
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  status: "RESCUED" | "UNDER TREATMENT" | "RECOVERING" | "AVAILABLE FOR ADOPTION" | "ADOPTED";
  rescueDate: string;
  location: string;
  shelter: string;
  imageEmoji: string;
}

export interface NgoEntry {
  id: number;
  name: string;
  city: string;
  appliedOn: string;
  documents: string;
  documentsOk: boolean;
  status: "Pending" | "Verified" | "Rejected" | "Incomplete";
}

// ---- Seeded data ----

const seededReports: Report[] = [
  { id: "PAW-2024-0844", species: "Dog", description: "Limping, possible leg fracture", lat: 28.5700, lng: 77.2100, severity: 9, severityLabel: "CRITICAL", status: "accepted", createdAt: new Date(Date.now() - 3 * 60000).toISOString(), location: "Lajpat Nagar, Delhi" },
  { id: "PAW-2024-0845", species: "Cow", description: "Injured horn, bleeding", lat: 28.6519, lng: 77.1910, severity: 7, severityLabel: "HIGH", status: "pending", createdAt: new Date(Date.now() - 8 * 60000).toISOString(), location: "Karol Bagh, Delhi" },
  { id: "PAW-2024-0846", species: "Cat", description: "Malnourished, lethargic", lat: 28.5921, lng: 77.0460, severity: 5, severityLabel: "MODERATE", status: "pending", createdAt: new Date(Date.now() - 14 * 60000).toISOString(), location: "Dwarka Sector 10" },
  { id: "PAW-2024-0847", species: "Bird", description: "Broken wing", lat: 28.7325, lng: 77.1197, severity: 3, severityLabel: "LOW", status: "pending", createdAt: new Date(Date.now() - 22 * 60000).toISOString(), location: "Rohini" },
];

const seededAnimals: Animal[] = [
  { id: "PAW-DOG-0291", name: "Bruno", species: "Dog", breed: "Mixed", age: "~2 yrs", gender: "Male", status: "UNDER TREATMENT", rescueDate: "14 Jan 2025", location: "Lajpat Nagar, Delhi", shelter: "Friendicoes SECA", imageEmoji: "🐕" },
  { id: "PAW-DOG-0285", name: "Coco", species: "Dog", breed: "Indie", age: "~1 yr", gender: "Female", status: "AVAILABLE FOR ADOPTION", rescueDate: "08 Jan 2025", location: "Sarojini Nagar, Delhi", shelter: "Friendicoes SECA", imageEmoji: "🐕" },
  { id: "PAW-CAT-0102", name: "Whiskers", species: "Cat", breed: "Tabby Mix", age: "~3 yrs", gender: "Male", status: "RECOVERING", rescueDate: "10 Jan 2025", location: "Connaught Place, Delhi", shelter: "CARE India", imageEmoji: "🐈" },
  { id: "PAW-COW-0058", name: "Ganga", species: "Cow", breed: "Desi", age: "~5 yrs", gender: "Female", status: "UNDER TREATMENT", rescueDate: "12 Jan 2025", location: "Karol Bagh, Delhi", shelter: "Animal Aid Unlimited", imageEmoji: "🐄" },
  { id: "PAW-DOG-0299", name: "Lucky", species: "Dog", breed: "Lab Mix", age: "~4 yrs", gender: "Male", status: "ADOPTED", rescueDate: "01 Jan 2025", location: "Vasant Kunj, Delhi", shelter: "Friendicoes SECA", imageEmoji: "🐕" },
  { id: "PAW-BRD-0034", name: "Chirpy", species: "Bird", breed: "Pigeon", age: "Unknown", gender: "Unknown", status: "AVAILABLE FOR ADOPTION", rescueDate: "11 Jan 2025", location: "Rohini, Delhi", shelter: "Wildlife SOS", imageEmoji: "🐦" },
];

const seededNgos: NgoEntry[] = [
  { id: 1, name: "Friendicoes SECA", city: "Delhi", appliedOn: "10 Jan 2025", documents: "All submitted", documentsOk: true, status: "Pending" },
  { id: 2, name: "CARE India", city: "Mumbai", appliedOn: "12 Jan 2025", documents: "PAN missing", documentsOk: false, status: "Incomplete" },
  { id: 3, name: "Animal Aid Unlimited", city: "Udaipur", appliedOn: "13 Jan 2025", documents: "All submitted", documentsOk: true, status: "Pending" },
];

// ---- Singleton store ----

class Store {
  reports: Report[] = [...seededReports];
  animals: Animal[] = [...seededAnimals];
  ngos: NgoEntry[] = [...seededNgos];
  private reportCounter = 848;

  getReports() {
    return [...this.reports].sort((a, b) => b.severity - a.severity);
  }

  addReport(data: { species: string; description: string; lat: number; lng: number; location?: string }): Report {
    const severity = Math.floor(Math.random() * 8) + 2; // 2-9
    const labels: Record<string, string> = { "9": "CRITICAL", "8": "CRITICAL", "7": "HIGH", "6": "HIGH", "5": "MODERATE", "4": "MODERATE", "3": "LOW", "2": "LOW" };
    const report: Report = {
      id: `PAW-2024-${String(this.reportCounter++).padStart(4, "0")}`,
      species: data.species,
      description: data.description,
      lat: data.lat,
      lng: data.lng,
      severity,
      severityLabel: labels[String(severity)] || "MODERATE",
      status: "pending",
      createdAt: new Date().toISOString(),
      location: data.location || `${data.lat.toFixed(4)}° N, ${data.lng.toFixed(4)}° E`,
    };
    this.reports.unshift(report);
    return report;
  }

  getAnimals() {
    return [...this.animals];
  }

  getStats() {
    return {
      totalRescues: 847 + this.reports.length - seededReports.length,
      activeNgos: 34,
      pendingVerifications: this.ngos.filter((n) => n.status === "Pending").length,
      animalsInShelters: this.animals.filter((a) => a.status !== "ADOPTED").length,
    };
  }

  updateNgoStatus(ngoId: number, action: "approve" | "reject") {
    const ngo = this.ngos.find((n) => n.id === ngoId);
    if (!ngo) return null;
    ngo.status = action === "approve" ? "Verified" : "Rejected";
    return ngo;
  }

  updateReportStatus(reportId: string, status: Report["status"]) {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) return null;
    report.status = status;
    return report;
  }
}

// Global singleton (survives HMR in dev)
const globalForStore = globalThis as unknown as { __pawAlertStore?: Store };
export const store = globalForStore.__pawAlertStore ?? new Store();
globalForStore.__pawAlertStore = store;
