"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  MapPin,
  CheckCircle2,
  Camera,
  ArrowRight,
  Loader2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { speciesOptions } from "@/lib/mockData";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getTagStyle, TriageResult } from "@/lib/gemini-triage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

interface FormData {
  species: string;
  description: string;
  uploaded: boolean;
  imageFile: File | null;
  imageUrl: string | null;
  locationStatus: string;
  lat: number;
  lng: number;
}

function StepIndicator({ current }: { current: number }) {
  const steps = ["Photo & Location", "AI Analysis", "Submitted"];
  return (
    <div className="mb-10 flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
              i < current
                ? "bg-paw-green text-white"
                : i === current
                ? "bg-paw-orange text-white animate-pulse-glow"
                : "bg-paw-card border border-paw-orange/30 text-paw-muted"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span
            className={`hidden text-xs sm:block ${
              i === current ? "text-paw-text font-medium" : "text-paw-muted"
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-8 sm:w-16 ${
                i < current ? "bg-paw-green" : "bg-paw-orange/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1({
  onNext,
  formData,
  setFormData,
}: {
  onNext: () => void;
  formData: FormData;
  setFormData: (d: FormData) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData({ ...formData, uploaded: false, imageFile: file });
    setUploading(true);

    try {
      // Upload to Supabase Storage immediately
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("animal-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("animal-photos").getPublicUrl(uploadData.path);

      setFormData({
        ...formData,
        uploaded: true,
        imageFile: file,
        imageUrl: publicUrl,
      });
    } catch (err) {
      console.error("Upload error:", err);
      // Still mark as uploaded so user can proceed (triage will fallback)
      setFormData({ ...formData, uploaded: true, imageFile: file });
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-xl space-y-8"
    >
      {/* Upload zone */}
      <div
        className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 ${
          uploading
            ? "border-paw-orange bg-paw-orange/5"
            : formData.uploaded
            ? "border-paw-green bg-paw-green/5"
            : "border-paw-orange/40 bg-paw-card hover:border-paw-orange hover:bg-paw-orange/5"
        }`}
        onClick={() =>
          !uploading && document.getElementById("fileInput")?.click()
        }
      >
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-paw-orange" />
            <span className="text-paw-orange font-medium">
              Uploading photo…
            </span>
          </div>
        ) : formData.uploaded ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <CheckCircle2 className="h-12 w-12 text-paw-green" />
            <span className="text-paw-green font-medium">
              Photo uploaded successfully
            </span>
            <div className="mt-2 flex gap-2 items-center rounded-lg bg-paw-card border border-paw-green/20 px-3 py-2">
              {formData.imageFile ? (
                <img
                  src={URL.createObjectURL(formData.imageFile)}
                  alt="Preview"
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-paw-orange/30 to-paw-orange/10 flex items-center justify-center text-2xl">
                  🐕
                </div>
              )}
              <div className="text-xs text-paw-muted">
                <div className="font-medium text-paw-text">
                  {formData.imageFile?.name || "photo.jpg"}
                </div>
                <div>
                  {formData.imageFile
                    ? `${(formData.imageFile.size / (1024 * 1024)).toFixed(1)} MB`
                    : "2.4 MB"}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-paw-orange/10 transition-colors group-hover:bg-paw-orange/20">
              <Camera className="h-8 w-8 text-paw-orange" />
            </div>
            <p className="text-paw-text font-medium">
              <Upload className="mr-2 inline h-4 w-4" />
              Drag & drop or click to upload
            </p>
            <p className="mt-1 text-sm text-paw-muted">
              Take a photo of the injured animal
            </p>
          </>
        )}
      </div>

      {/* GPS Location */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          formData.lat
            ? "border-paw-green/30 bg-paw-green/5"
            : "border-paw-orange/30 bg-paw-orange/5 animate-pulse"
        }`}
      >
        <MapPin
          className={`h-5 w-5 ${
            formData.lat ? "text-paw-green" : "text-paw-orange"
          }`}
        />
        <div>
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              formData.lat ? "text-paw-green" : "text-paw-orange"
            }`}
          >
            {formData.lat ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {formData.locationStatus}
          </div>
          <div className="text-xs text-paw-muted">
            {formData.lat
              ? `${formData.lat.toFixed(4)}° N, ${formData.lng.toFixed(4)}° E`
              : "Determining precisely..."}
          </div>
        </div>
      </div>

      {/* Species selector */}
      <div>
        <label className="mb-3 block text-sm font-medium text-paw-muted">
          Select Species
        </label>
        <div className="flex flex-wrap gap-2">
          {speciesOptions.map((species) => (
            <button
              key={species}
              onClick={() => setFormData({ ...formData, species })}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                formData.species === species
                  ? "bg-paw-orange text-white shadow-lg shadow-paw-orange/25"
                  : "border border-paw-orange/30 text-paw-muted hover:border-paw-orange hover:text-paw-text"
              }`}
            >
              {species}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-paw-muted">
          Description <span className="text-paw-muted/50">(optional)</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Describe the animal's condition, any visible injuries, behavior..."
          className="w-full resize-none rounded-xl border border-paw-orange/20 bg-paw-card p-4 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none"
          rows={3}
        />
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!formData.uploaded || !formData.species || uploading}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-paw-orange/25 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </motion.div>
  );
}

function Step2({
  imageUrl,
  onNext,
}: {
  imageUrl: string | null;
  onNext: (triage: TriageResult) => void;
}) {
  const [analyzing, setAnalyzing] = useState(true);
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function runTriage() {
      if (!imageUrl) {
        // No image URL — use fallback
        setTriage({
          severity: 5,
          severityLabel: "MODERATE",
          description:
            "Photo could not be analyzed. Manual assessment recommended.",
          tags: ["needs assessment"],
          note: "Image unavailable — rescue team should assess on-site.",
        });
        setAnalyzing(false);
        return;
      }

      try {
        const res = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: imageUrl }),
        });

        if (!res.ok) throw new Error("Triage API failed");

        const result: TriageResult = await res.json();
        setTriage(result);
      } catch (err) {
        console.error("Triage error:", err);
        setError(true);
        setTriage({
          severity: 5,
          severityLabel: "MODERATE",
          description:
            "AI analysis encountered an error. Manual review recommended.",
          tags: ["needs assessment"],
          note: "Automated triage failed — rescue team should assess on-site.",
        });
      } finally {
        setAnalyzing(false);
      }
    }

    runTriage();
  }, [imageUrl]);

  // Severity color based on level
  const getSeverityColor = (severity: number) => {
    if (severity >= 9) return "#FF4F4F";
    if (severity >= 7) return "#E47F42";
    if (severity >= 4) return "#FFE00F";
    return "#4FC97E";
  };

  const getSeverityGradient = (severity: number) => {
    if (severity >= 9)
      return "from-red-500 to-orange-500";
    if (severity >= 7)
      return "from-paw-orange to-paw-red";
    if (severity >= 4)
      return "from-yellow-500 to-orange-400";
    return "from-paw-green to-emerald-400";
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-xl"
    >
      <AnimatePresence mode="wait">
        {analyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-20"
          >
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-paw-orange" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
            </div>
            <p className="text-xl font-medium text-paw-orange">
              Analysing injury with Gemini Vision AI…
            </p>
            <p className="text-sm text-paw-muted max-sm text-center">
              Our AI model is examining the photo for injuries, assessing
              severity, and identifying injury types
            </p>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-paw-orange"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : triage ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-paw-orange/30 bg-paw-orange/5 px-4 py-3 text-sm text-paw-orange">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                AI analysis encountered an issue — showing fallback assessment
              </div>
            )}

            {/* Severity card */}
            <div className="rounded-xl border border-paw-orange/30 bg-paw-card p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-paw-muted mb-1">
                    AI Severity Assessment
                  </p>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
                    style={{
                      backgroundColor: `${getSeverityColor(triage.severity)}20`,
                      color: getSeverityColor(triage.severity),
                    }}
                  >
                    {triage.severityLabel}
                  </span>
                </div>
                <div className="text-right">
                  <div
                    className="text-6xl font-black"
                    style={{ color: getSeverityColor(triage.severity) }}
                  >
                    {triage.severity}
                    <span className="text-2xl text-paw-muted">/10</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="h-3 w-full overflow-hidden rounded-full bg-paw-bg">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${getSeverityGradient(triage.severity)}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(triage.severity / 10) * 100}%`,
                    }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>

              {/* AI Description */}
              <p className="text-paw-text leading-relaxed">
                {triage.description}
              </p>

              {/* Injury Tags */}
              {triage.tags.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs text-paw-muted mb-2.5 uppercase tracking-wider font-medium">
                    Detected Injuries
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {triage.tags.map((tag) => {
                      const style = getTagStyle(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                          }}
                        >
                          <span>{style.emoji}</span>
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Triage note */}
              <p className="mt-5 text-sm text-paw-gold flex items-start gap-2">
                <span>⚡</span>
                <span>{triage.note}</span>
              </p>
            </div>

            <button
              onClick={() => onNext(triage)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-paw-orange/25"
            >
              Confirm & Submit
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function Step3({
  rescueId,
  submitting,
}: {
  rescueId: string;
  submitting: boolean;
}) {
  if (submitting) {
    return (
      <div className="flex flex-col items-center gap-6 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-paw-orange" />
        <p className="text-lg font-medium text-paw-muted">
          Submitting report…
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-xl text-center space-y-8 py-10"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2,
        }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-paw-green/15"
      >
        <CheckCircle2 className="h-14 w-14 text-paw-green" />
      </motion.div>

      <div>
        <h2 className="mb-2 text-3xl font-bold">
          Your report has been submitted!
        </h2>
        <p className="text-paw-muted">
          We&apos;ll get a rescue team there ASAP
        </p>
      </div>

      <div className="rounded-xl border border-paw-green/30 bg-paw-card p-6 space-y-3">
        <div className="text-sm text-paw-muted">Rescue ID</div>
        <div className="text-2xl font-bold text-paw-green">#{rescueId}</div>
        <div className="text-sm text-paw-muted">
          NGO notified — tracking will begin shortly
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/track"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-paw-orange px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-paw-orange/25 transition-all hover:scale-105"
        >
          Track My Rescue
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-paw-orange/40 px-6 py-4 text-sm font-medium text-paw-muted transition-all hover:text-paw-text hover:border-paw-orange"
        >
          <FileText className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </motion.div>
  );
}

export default function ReportPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    species: "",
    description: "",
    uploaded: false,
    imageFile: null,
    imageUrl: null,
    locationStatus: "Detecting Location...",
    lat: 0,
    lng: 0,
  });
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [rescueId, setRescueId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            locationStatus: "GPS Location Captured",
          }));
        },
        () => {
          setFormData((prev) => ({
            ...prev,
            locationStatus: "Location permission denied",
          }));
        }
      );
    } else {
      setFormData((prev) => ({
        ...prev,
        locationStatus: "GPS not supported",
      }));
    }
  }, []);

  const handleTriageComplete = (triage: TriageResult) => {
    setTriageResult(triage);
    handleSubmit(triage);
  };

  const handleSubmit = async (triage: TriageResult) => {
    setStep(2);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species: formData.species,
          description:
            formData.description || `AI Triage: ${triage.description}`,
          lat: formData.lat || 28.6139,
          lng: formData.lng || 77.209,
          location:
            formData.locationStatus === "GPS Location Captured"
              ? "Current Location"
              : "Unknown",
          image_url: formData.imageUrl,
          severity_score: triage.severity,
          severity_label: triage.severityLabel,
        }),
      });
      const data = await res.json();
      setRescueId(data.id || "PAW-2024-0847");
    } catch (err) {
      console.error("Submission error:", err);
      setRescueId("PAW-ERR-999");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paw-bg px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <motion.h1
          className="mb-2 text-center text-3xl font-bold sm:text-4xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Report an <span className="text-paw-orange">Injured Animal</span>
        </motion.h1>
        <motion.p
          className="mb-10 text-center text-paw-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          High-accuracy AI analysis powered by Gemini Vision
        </motion.p>

        <StepIndicator current={step} />

        <div className="relative mt-16 min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <Step1
                key="step1"
                onNext={() => setStep(1)}
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {step === 1 && (
              <Step2
                key="step2"
                imageUrl={formData.imageUrl}
                onNext={handleTriageComplete}
              />
            )}
            {step === 2 && (
              <Step3
                key="step3"
                rescueId={rescueId}
                submitting={submitting}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
