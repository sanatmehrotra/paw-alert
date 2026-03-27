// =============================================================
// PawAlert — GPS Realtime Channel (Supabase Broadcast)
// Ephemeral GPS streaming — no DB writes, purely in-memory
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

/**
 * Create (or join) a Supabase Realtime broadcast channel for a rescue ID.
 * Both the driver and the tracker call this with the same rescueId.
 */
export function createGpsChannel(rescueId: string): RealtimeChannel {
  const channelName = `gps:${rescueId.replace("#", "")}`;
  return supabase.channel(channelName, {
    config: { broadcast: { self: false } },
  });
}

/**
 * Driver broadcasts their current GPS position.
 */
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

/**
 * Tracker subscribes to GPS updates from the driver.
 * Returns an unsubscribe function.
 */
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
