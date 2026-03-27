"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Phone, ArrowRight, Loader2, AlertCircle,
  CheckCircle2, Upload, Building2, MapPin, FileText,
  Eye, EyeOff, PawPrint,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
};

interface AccountData {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

interface OrgData {
  orgName: string;
  description: string;
  city: string;
  workingZone: string;
  address: string;
}

interface DocData {
  panFile: File | null;
  panUrl: string | null;
  aadhaarFile: File | null;
  aadhaarUrl: string | null;
  awbiFile: File | null;
  awbiUrl: string | null;
}

/* ── Step Indicator ── */
function StepIndicator({ current }: { current: number }) {
  const steps = ["Account", "Organisation", "Documents", "Submitted"];
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-10">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all
                ${i < current ? "bg-paw-green text-white"
                : i === current ? "bg-paw-orange text-white animate-pulse-glow"
                : "bg-paw-card border border-paw-orange/30 text-paw-muted"}`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`hidden sm:block text-[10px] font-medium
              ${i === current ? "text-paw-text" : "text-paw-muted"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-6 sm:w-12 mb-4 ${i < current ? "bg-paw-green" : "bg-paw-orange/20"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Input helper ── */
function Input({
  label, type = "text", value, onChange, placeholder, required, icon: Icon, rightEl,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  rightEl?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-paw-muted mb-1.5">
        {label} {required && <span className="text-paw-red">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-paw-muted" />}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} ${rightEl ? "pr-10" : "pr-4"} py-3 rounded-xl border border-paw-orange/20 bg-paw-bg text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none transition-colors text-sm`}
        />
        {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
      </div>
    </div>
  );
}

/* ── File Upload helper ── */
function FileUpload({
  label, hint, required, file, url, uploading, accept, onPick,
}: {
  label: string; hint: string; required?: boolean;
  file: File | null; url: string | null;
  uploading: boolean; accept?: string;
  onPick: (f: File) => void;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  const done = !!url;

  return (
    <div>
      <label className="block text-sm font-medium text-paw-muted mb-1.5">
        {label} {required && <span className="text-paw-red">*</span>}
      </label>
      <div
        onClick={() => !uploading && document.getElementById(id)?.click()}
        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-all
          ${done ? "border-paw-green/40 bg-paw-green/5"
          : uploading ? "border-paw-orange/40 bg-paw-orange/5"
          : "border-paw-orange/30 bg-paw-card hover:border-paw-orange hover:bg-paw-orange/5"}`}
      >
        <input id={id} type="file" accept={accept || "image/*,.pdf"} className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); }} />

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
          ${done ? "bg-paw-green/20" : "bg-paw-orange/10"}`}>
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-paw-orange" />
          ) : done ? (
            <CheckCircle2 className="h-5 w-5 text-paw-green" />
          ) : (
            <Upload className="h-5 w-5 text-paw-orange" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium truncate ${done ? "text-paw-green" : "text-paw-text"}`}>
            {uploading ? "Uploading…" : done ? (file?.name || "Uploaded ✓") : "Click to upload"}
          </div>
          <div className="text-xs text-paw-muted">{hint}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: Account ── */
function Step1({
  data, setData, onNext, error,
}: {
  data: AccountData;
  setData: (d: AccountData) => void;
  onNext: () => void;
  error: string;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const valid =
    data.email && data.password.length >= 8 &&
    data.password === data.confirmPassword && data.phone;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit"
      className="space-y-5">
      <Input label="Email Address" type="email" required
        icon={Mail} value={data.email}
        onChange={v => setData({ ...data, email: v })}
        placeholder="ngo@example.org" />

      <Input label="Password (min 8 chars)" type={showPwd ? "text" : "password"} required
        icon={Lock} value={data.password}
        onChange={v => setData({ ...data, password: v })}
        placeholder="••••••••"
        rightEl={
          <button type="button" onClick={() => setShowPwd(p => !p)}>
            {showPwd
              ? <EyeOff className="h-4 w-4 text-paw-muted" />
              : <Eye className="h-4 w-4 text-paw-muted" />}
          </button>
        } />

      <Input label="Confirm Password" type={showPwd ? "text" : "password"} required
        icon={Lock} value={data.confirmPassword}
        onChange={v => setData({ ...data, confirmPassword: v })}
        placeholder="••••••••" />
      {data.confirmPassword && data.password !== data.confirmPassword && (
        <p className="text-xs text-paw-red -mt-3">Passwords do not match</p>
      )}

      <Input label="Phone Number" type="tel" required
        icon={Phone} value={data.phone}
        onChange={v => setData({ ...data, phone: v })}
        placeholder="+91 98765 43210" />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-paw-red/20 bg-paw-red/10 px-4 py-3 text-sm text-paw-red">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button onClick={onNext} disabled={!valid}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-paw-orange py-3.5 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-paw-orange/25 disabled:opacity-40 disabled:cursor-not-allowed">
        Continue <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </motion.div>
  );
}

/* ── Step 2: Organisation ── */
function Step2({
  data, setData, onNext, onBack,
}: {
  data: OrgData;
  setData: (d: OrgData) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = data.orgName && data.city && data.address;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit"
      className="space-y-5">
      <Input label="Organisation Name" required icon={Building2}
        value={data.orgName} onChange={v => setData({ ...data, orgName: v })}
        placeholder="e.g. Friendicoes SECA" />

      <div>
        <label className="block text-sm font-medium text-paw-muted mb-1.5">
          Description <span className="text-paw-red">*</span>
        </label>
        <textarea value={data.description}
          onChange={e => setData({ ...data, description: e.target.value })}
          placeholder="Briefly describe your organisation's mission and animal rescue activities…"
          rows={3}
          className="w-full resize-none rounded-xl border border-paw-orange/20 bg-paw-bg px-4 py-3 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none transition-colors" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="City" required icon={MapPin}
          value={data.city} onChange={v => setData({ ...data, city: v })}
          placeholder="New Delhi" />
        <Input label="Working Zone / Area"
          value={data.workingZone} onChange={v => setData({ ...data, workingZone: v })}
          placeholder="South Delhi, Noida…" />
      </div>

      <div>
        <label className="block text-sm font-medium text-paw-muted mb-1.5">
          Office Address <span className="text-paw-red">*</span>
        </label>
        <textarea value={data.address}
          onChange={e => setData({ ...data, address: e.target.value })}
          placeholder="Full office/shelter address including PIN code"
          rows={2}
          className="w-full resize-none rounded-xl border border-paw-orange/20 bg-paw-bg px-4 py-3 text-sm text-paw-text placeholder:text-paw-muted/50 focus:border-paw-orange focus:outline-none transition-colors" />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 rounded-xl border border-paw-orange/30 py-3 text-sm font-medium text-paw-muted transition-all hover:border-paw-orange hover:text-paw-text">
          Back
        </button>
        <button onClick={onNext} disabled={!valid}
          className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-paw-orange py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-paw-orange/25 disabled:opacity-40 disabled:cursor-not-allowed">
          Continue <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Step 3: Documents ── */
function Step3({
  data, setData, userId, onNext, onBack, submitting,
}: {
  data: DocData;
  setData: (d: DocData) => void;
  userId: string;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const uploadDoc = async (file: File, field: "pan" | "aadhaar" | "awbi") => {
    setUploading(p => ({ ...p, [field]: true }));
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${field}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("ngo-documents")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      // Store path (admin will generate signed URL when viewing)
      const url = path;
      if (field === "pan") setData({ ...data, panFile: file, panUrl: url });
      else if (field === "aadhaar") setData({ ...data, aadhaarFile: file, aadhaarUrl: url });
      else setData({ ...data, awbiFile: file, awbiUrl: url });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(p => ({ ...p, [field]: false }));
    }
  };

  const valid = data.panUrl && data.aadhaarUrl;
  const anyUploading = Object.values(uploading).some(Boolean);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit"
      className="space-y-5">
      <div className="rounded-xl border border-paw-orange/15 bg-paw-orange/5 px-4 py-3 text-sm text-paw-muted">
        📎 Documents are stored securely and only visible to PawAlert admins.
      </div>

      <FileUpload
        label="PAN Card" hint="JPG, PNG or PDF — max 5 MB" required
        file={data.panFile} url={data.panUrl}
        uploading={!!uploading.pan}
        onPick={f => uploadDoc(f, "pan")} />

      <FileUpload
        label="Aadhaar Card" hint="JPG, PNG or PDF — of authorised signatory" required
        file={data.aadhaarFile} url={data.aadhaarUrl}
        uploading={!!uploading.aadhaar}
        onPick={f => uploadDoc(f, "aadhaar")} />

      <FileUpload
        label="AWBI Registration Certificate" hint="Optional — Animal Welfare Board of India"
        file={data.awbiFile} url={data.awbiUrl}
        uploading={!!uploading.awbi}
        onPick={f => uploadDoc(f, "awbi")} />

      <div className="flex gap-3">
        <button onClick={onBack} disabled={anyUploading || submitting}
          className="flex-1 rounded-xl border border-paw-orange/30 py-3 text-sm font-medium text-paw-muted transition-all hover:border-paw-orange hover:text-paw-text disabled:opacity-40">
          Back
        </button>
        <button onClick={onNext}
          disabled={!valid || anyUploading || submitting}
          className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-paw-orange py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-paw-orange/25 disabled:opacity-40 disabled:cursor-not-allowed">
          {submitting
            ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
            : <> Submit Application <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></>}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Step 4: Submitted ── */
function Step4({ applicationId }: { applicationId: string }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible"
      className="text-center space-y-8 py-6">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-paw-green/15">
        <CheckCircle2 className="h-14 w-14 text-paw-green" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
        <p className="text-paw-muted">Your organisation's verification request has been sent to PawAlert admins.</p>
      </div>

      <div className="rounded-xl border border-paw-green/30 bg-paw-green/5 p-6 space-y-3 text-left">
        <div className="text-xs text-paw-muted uppercase tracking-wider font-medium">Application ID</div>
        <div className="text-2xl font-bold text-paw-green font-mono">#{applicationId}</div>
        <div className="text-sm text-paw-muted">
          Our team will review your documents within <strong className="text-paw-text">24–48 hours</strong>.
          You will be able to sign in once your application is approved.
        </div>
      </div>

      <div className="rounded-xl border border-paw-orange/15 bg-paw-card p-4 text-sm text-paw-muted space-y-2 text-left">
        <div className="font-medium text-paw-text">What happens next?</div>
        <ol className="space-y-1.5 list-decimal list-inside">
          <li>Admin reviews your documents</li>
          <li>You receive an approval notification</li>
          <li>Sign in at <span className="text-paw-orange">/ngo/login</span> to access the dashboard</li>
        </ol>
      </div>

      <Link href="/"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-paw-orange/40 px-8 py-3 text-sm font-medium text-paw-muted transition-all hover:text-paw-text hover:border-paw-orange">
        <FileText className="h-4 w-4" /> Return to Home
      </Link>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function NgoRegisterPage() {
  const [step, setStep] = useState(0);
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [userId, setUserId] = useState("");

  const [account, setAccount] = useState<AccountData>({
    email: "", password: "", confirmPassword: "", phone: "",
  });
  const [org, setOrg] = useState<OrgData>({
    orgName: "", description: "", city: "", workingZone: "", address: "",
  });
  const [docs, setDocs] = useState<DocData>({
    panFile: null, panUrl: null,
    aadhaarFile: null, aadhaarUrl: null,
    awbiFile: null, awbiUrl: null,
  });

  // Step 1 → sign up with Supabase Auth
  const handleAccountNext = async () => {
    setAuthError("");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { phone: account.phone, role: "ngo" } },
      });

      if (error) { setAuthError(error.message); return; }
      if (!data.user) { setAuthError("Sign-up failed. Please try again."); return; }

      setUserId(data.user.id);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 → submit full application
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/ngo-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: account.email,
          phone: account.phone,
          org_name: org.orgName,
          description: org.description,
          city: org.city,
          working_zone: org.workingZone,
          address: org.address,
          pan_url: docs.panUrl,
          aadhaar_url: docs.aadhaarUrl,
          awbi_url: docs.awbiUrl,
        }),
      });

      const data = await res.json();
      setApplicationId(data.id || "NGO-ERR-0000");
      setStep(3);
    } catch (err) {
      console.error("Application submit error:", err);
      setApplicationId("NGO-ERR-0000");
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paw-bg px-4 py-12">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paw-green/15">
            <PawPrint className="h-6 w-6 text-paw-green" />
          </div>
          <div>
            <div className="text-xs text-paw-muted">PawAlert</div>
            <div className="text-lg font-bold">NGO Registration</div>
          </div>
        </div>

        <div className="rounded-2xl border border-paw-orange/20 bg-paw-card p-6 sm:p-8">
          {step < 3 && (
            <>
              <StepIndicator current={step} />
              <div className="mb-6">
                <h1 className="text-xl font-bold">
                  {["Create Your Account", "Organisation Details", "Upload Documents", ""][step]}
                </h1>
                <p className="text-sm text-paw-muted mt-1">
                  {[
                    "Set up your NGO admin account",
                    "Tell us about your organisation",
                    "Required for verification — stored securely",
                    "",
                  ][step]}
                </p>
              </div>
            </>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <Step1 key="s1" data={account} setData={setAccount}
                onNext={handleAccountNext} error={authError} />
            )}
            {step === 1 && (
              <Step2 key="s2" data={org} setData={setOrg}
                onNext={() => setStep(2)} onBack={() => setStep(0)} />
            )}
            {step === 2 && (
              <Step3 key="s3" data={docs} setData={setDocs}
                userId={userId}
                onNext={handleSubmit} onBack={() => setStep(1)}
                submitting={submitting} />
            )}
            {step === 3 && (
              <Step4 key="s4" applicationId={applicationId} />
            )}
          </AnimatePresence>

          {step < 3 && (
            <div className="mt-6 pt-5 border-t border-paw-orange/10 text-center text-xs text-paw-muted">
              Already registered?{" "}
              <Link href="/ngo/login" className="text-paw-orange hover:underline">
                Sign in here
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
