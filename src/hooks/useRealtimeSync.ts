import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

interface TableWatch {
  table: string;
  filter?: string; // PostgREST filter format, e.g. "client_id=eq.abc-123"
}

/**
 * Subscribes to Supabase Realtime postgres_changes on the given tables.
 * Calls `onUpdate` (debounced) whenever any watched row changes.
 *
 * Requirements (run once in Supabase):
 *   ALTER PUBLICATION supabase_realtime ADD TABLE <tablename>;
 *   ALTER TABLE <tablename> REPLICA IDENTITY FULL;
 *   (see querys/016_realtime_replica_identity.sql)
 */
export function useRealtimeSync(
  watches: TableWatch[],
  onUpdate: () => void,
  debounceMs = 1500,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Stable key from the watches config so the effect re-runs if tables/filters change
  const watchKey = watches.map((w) => `${w.table}:${w.filter ?? "*"}`).join("|");

  useEffect(() => {
    if (!supabase || watches.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        onUpdateRef.current();
      }, debounceMs);
    };

    const channelName = `sync:${watchKey}`;
    let channel = supabase.channel(channelName);

    for (const { table, filter } of watches) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        trigger,
      );
    }

    channel.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(`[Realtime] ${channelName} — ${status}`, err ?? "");
      }
    });

    const client = supabase;
    return () => {
      if (timer) clearTimeout(timer);
      void client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchKey, debounceMs]);
}
