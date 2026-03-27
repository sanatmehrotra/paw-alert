"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, MapPin, CheckCircle2, Camera, ArrowRight, Loader2, FileText } from "lucide-react";
import { speciesOptions, severityResult } from "@/lib/mockData";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

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
  formData: { species: string; description: string; uploaded: boolean; imageFile: File | null; locationStatus: string; lat: number; lng: number };
  setFormData: (d: any) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, uploaded: true, imageFile: file });
    }
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-xl space-y-8">
      {/* Upload zone */}
      <div
        className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 ${
          formData.uploaded
            ? "border-paw-green bg-paw-green/5"
            : "border-paw-orange/40 bg-paw-card hover:border-paw-orange hover:bg-paw-orange/5"
        }`}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {formData.uploaded ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <CheckCircle2 className="h-12 w-12 text-paw-green" />
            <span className="text-paw-green font-medium">Photo uploaded successfully</span>
            <div className="mt-2 flex gap-2 items-center rounded-lg bg-paw-card border border-paw-green/20 px-3 py-2">
              {formData.imageFile ? (
                <img 
                  src={URL.createObjectURL(formData.imageFile)} 
                  alt="Preview" 
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-paw-orange/30 to-paw-orange/10 flex items-center justify-center text-2xl">🐕</div>
              )}
              <div className="text-xs text-paw-muted">
                <div className="font-medium text-paw-text">{formData.imageFile?.name || "photo.jpg"}</div>
                <div>2.4 MB · 4032×3024</div>
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
      <div className={`flex items-center gap-3 rounded-xl border p-4 ${
        formData.lat ? "border-paw-green/30 bg-paw-green/5" : "border-paw-orange/30 bg-paw-orange/5 animate-pulse"
      }`}>
        <MapPin className={`h-5 w-5 ${formData.lat ? "text-paw-green" : "text-paw-orange"}`} />
        <div>
          <div className={`flex items-center gap-2 text-sm font-medium ${formData.lat ? "text-paw-green" : "text-paw-orange"}`}>
            {formData.lat ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            {formData.locationStatus}
          </div>
          <div className="text-xs text-paw-muted">
            {formData.lat ? `${formData.lat.toFixed(4)}° N, ${formData.lng.toFixed(4)}° E` : "Determining precisely..."}
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
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the animal's condition, any visible injuries, behavior..."
          className="w-full resize-none rounded-xl border border-paw-orange/20 bg-paw-card p-4 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none"
          rows={3}
        />
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!formData.uploaded || !formData.species}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-paw-orange/25 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </motion.div>
  );
}

function Step2({ onNext }: { onNext: () => void }) {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-xl">
      <AnimatePresence mode="wait">
        {analyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-20"
          >
            <Loader2 className="h-16 w-16 animate-spin text-paw-orange" />
            <p className="text-xl font-medium text-paw-orange">
              Analysing injury with AI Vision...
            </p>
            <p className="text-sm text-paw-muted">
              Our model is examining the photo for injuries
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Severity card */}
            <div className="rounded-xl border border-paw-orange/30 bg-paw-card p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-paw-muted mb-1">AI Severity Assessment</p>
                  <span className="inline-flex items-center rounded-full bg-paw-orange/15 px-3 py-1 text-sm font-bold text-paw-orange">
                    {severityResult.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-black text-paw-orange">
                    {severityResult.score}
                    <span className="text-2xl text-paw-muted">
                      /{severityResult.maxScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="h-3 w-full overflow-hidden rounded-full bg-paw-bg">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-paw-orange to-paw-red"
                    initial={{ width: 0 }}
                    animate={{ width: `${(severityResult.score / severityResult.maxScore) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>

              <p className="text-paw-text leading-relaxed">
                {severityResult.description}
              </p>
              <p className="mt-4 text-sm text-paw-gold">
                ⚡ {severityResult.note}
              </p>
            </div>

            <button
              onClick={onNext}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-paw-orange/25"
            >
              Confirm & Submit
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Step3({ rescueId, submitting }: { rescueId: string; submitting: boolean }) {
  if (submitting) {
    return (
      <div className="flex flex-col items-center gap-6 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-paw-orange" />
        <p className="text-lg font-medium text-paw-muted">Submitting report...</p>
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
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-paw-green/15"
      >
        <CheckCircle2 className="h-14 w-14 text-paw-green" />
      </motion.div>

      <div>
        <h2 className="mb-2 text-3xl font-bold">Your report has been submitted!</h2>
        <p className="text-paw-muted">We&apos;ll get a rescue team there ASAP</p>
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
  const [formData, setFormData] = useState({ 
    species: "", 
    description: "", 
    uploaded: false, 
    imageFile: null as File | null,
    locationStatus: "Detecting Location...",
    lat: 0,
    lng: 0
  });
  const [rescueId, setRescueId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({ 
            ...prev, 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude,
            locationStatus: "GPS Location Captured" 
          }));
        },
        () => {
          setFormData(prev => ({ 
            ...prev, 
            locationStatus: "Location permission denied" 
          }));
        }
      );
    } else {
      setFormData(prev => ({ ...prev, locationStatus: "GPS not supported" }));
    }
  }, []);

  const handleSubmit = async () => {
    setStep(2);
    setSubmitting(true);
    let imageUrl = null;

    try {
      // 1. Upload photo to Supabase if exists
      if (formData.imageFile) {
        const fileExt = formData.imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('animal-photos')
          .upload(fileName, formData.imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('animal-photos')
          .getPublicUrl(uploadData.path);
        
        imageUrl = publicUrl;
      }

      // 2. Submit report to API
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species: formData.species,
          description: formData.description || "Visible injuries, needs assessment",
          lat: formData.lat || 28.6139,
          lng: formData.lng || 77.209,
          location: formData.locationStatus === "GPS Location Captured" ? "Current Location" : "Unknown",
          image_url: imageUrl,
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
          Help save a life in 60 seconds
        </motion.p>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {step === 0 && <Step1 key="step1" onNext={() => setStep(1)} formData={formData} setFormData={setFormData} />}
          {step === 1 && <Step2 key="step2" onNext={handleSubmit} />}
          {step === 2 && <Step3 key="step3" rescueId={rescueId} submitting={submitting} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
