"use client";

// =============================================================
// MapplsMap — Reusable Mappls (MapmyIndia) map component
// Loads the SDK via CDN script tag, initialises the map in a
// stable div with a unique id, and exposes the map instance
// through an onMapReady callback.
// =============================================================

import { useEffect, useRef, useState, useCallback } from "react";

const MAPPLS_SDK_BASE = "https://sdk.mappls.com/map/sdk/web?v=3.0";
const SDK_LOAD_KEY = "__mapplsSdkLoaded";

interface MapplsMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMapReady?: (map: mappls.Map) => void;
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(apiKey: string): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    // Already loaded
    if (
      typeof window !== "undefined" &&
      (window as unknown as Record<string, unknown>)[SDK_LOAD_KEY]
    ) {
      resolve();
      return;
    }

    const existing = document.getElementById("mappls-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "mappls-sdk";
    script.src = `${MAPPLS_SDK_BASE}&access_token=${apiKey}`;
    script.async = true;
    script.onload = () => {
      (window as unknown as Record<string, unknown>)[SDK_LOAD_KEY] = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Mappls SDK failed to load"));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

let counter = 0;

export default function MapplsMap({
  center,
  zoom = 14,
  className = "",
  onMapReady,
}: MapplsMapProps) {
  // Stable unique container id per instance
  const [containerId] = useState(() => `mappls-map-${++counter}`);
  const mapRef = useRef<mappls.Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const initMap = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_MAPPLS_KEY;

    if (!apiKey) {
      setErrorMsg(
        "Mappls API key not found. Add NEXT_PUBLIC_MAPPLS_KEY to your .env.local"
      );
      setStatus("error");
      return;
    }

    try {
      await loadSdk(apiKey);

      // Poll until the container div exists in the DOM
      let attempts = 0;
      await new Promise<void>((resolve, reject) => {
        const check = () => {
          const container = document.getElementById(containerId);
          if (container) return resolve();
          if (++attempts > 50) return reject(new Error("Container not found"));
          setTimeout(check, 100);
        };
        check();
      });

      // Don't double-init
      if (mapRef.current) return;

      // Small grace period to ensure Mappls is fully initialised
      await new Promise((r) => setTimeout(r, 300));

      const map = new window.mappls.Map(containerId, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        zoomControl: true,
        location: false,
        search: false,
        clickableIcons: false,
      });

      mapRef.current = map;
      setStatus("ready");

      // Mappls triggers `load` when tiles finish rendering.
      // Use a small timeout as a reliable fallback because the event
      // can fire synchronously before addListener is set up.
      const notify = () => {
        if (onMapReadyRef.current) onMapReadyRef.current(map);
      };

      if (typeof map.addListener === "function") {
        map.addListener("load", notify);
        // Also fire after 1.5s in case load already fired
        setTimeout(notify, 1500);
      } else {
        // Fallback: fire after tiles have a chance to render
        setTimeout(notify, 1500);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to initialise map";
      setErrorMsg(msg);
      setStatus("error");
      sdkPromise = null; // allow retry
    }
  }, [containerId, zoom]); // removed center.lat/lng to prevent flickering re-init

  useEffect(() => {
    initMap();
    return () => {
      mapRef.current = null;
    };
  }, [initMap]);

  if (status === "error") {
    return (
      <div
        className={`flex items-center justify-center bg-paw-card border border-paw-orange/20 rounded-xl ${className}`}
      >
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-3">🗺️</div>
          <div className="text-paw-orange font-semibold mb-2">
            Map Unavailable
          </div>
          <div className="text-sm text-paw-muted">{errorMsg}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-paw-card rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-paw-orange border-t-transparent" />
            <span className="text-sm text-paw-muted">Loading map…</span>
          </div>
        </div>
      )}
      {/* The container MUST be a stable id string, not a React ref element */}
      <div
        id={containerId}
        className="w-full h-full"
        style={{ minHeight: "300px" }}
      />
    </div>
  );
}
