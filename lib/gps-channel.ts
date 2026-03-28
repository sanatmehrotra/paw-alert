// =============================================================
// PawAlert — GPS Realtime Channel (Supabase Broadcast)
// Ephemeral GPS + stage streaming — no DB writes, in-memory
// =============================================================

import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface GpsPayload {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

export interface StagePayload {
  stageIndex: number;
  stageId: string;
  timestamp: number;
}

/** Create (or join) a Supabase Realtime broadcast channel for a rescue ID. */
export function createGpsChannel(rescueId: string): RealtimeChannel {
  const channelName = `gps:${rescueId.replace("#", "")}`;
  return supabase.channel(channelName, {
    config: { broadcast: { self: false } },
  });
}

/** Driver broadcasts their current GPS position. */
export async function broadcastLocation(
  channel: RealtimeChannel,
  payload: GpsPayload
): Promise<void> {
  await channel.send({
    type: "broadcast",
    event: "location",
    payload,
  });
}

/** Driver broadcasts a mission stage update. */
export async function broadcastStage(
  channel: RealtimeChannel,
  payload: StagePayload
): Promise<void> {
  await channel.send({
    type: "broadcast",
    event: "stage",
    payload,
  });
}

/** Tracker subscribes to GPS updates from the driver. Returns unsubscribe fn. */
export function subscribeToLocation(
  channel: RealtimeChannel,
  callback: (payload: GpsPayload) => void
): () => void {
  channel
    .on("broadcast", { event: "location" }, ({ payload }) => {
      callback(payload as GpsPayload);
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/** Tracker subscribes to stage updates from the driver. Attaches to existing channel. */
export function subscribeToStage(
  channel: RealtimeChannel,
  callback: (payload: StagePayload) => void
): void {
  channel.on("broadcast", { event: "stage" }, ({ payload }) => {
    callback(payload as StagePayload);
  });
}

/**
 * Subscribe to GPS broadcasts for multiple rescue IDs simultaneously.
 * Used by NGO Live Map to track all active vans.
 * Returns a cleanup function that unsubscribes all channels.
 */
export function subscribeToMultipleRescues(
  rescueIds: string[],
  onLocation: (rescueId: string, payload: GpsPayload) => void
): () => void {
  const channels: RealtimeChannel[] = rescueIds.map((id) => {
    const channelName = `gps:${id.replace("#", "")}`;
    const ch = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    ch
      .on("broadcast", { event: "location" }, ({ payload }) => {
        onLocation(id, payload as GpsPayload);
      })
      .subscribe();
    return ch;
  });

  return () => {
    channels.forEach((ch) => ch.unsubscribe());
  };
}
