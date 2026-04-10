import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchClientDetail } from "../lib/api";
import { toMessage } from "../lib/errors";
import { useRealtimeSync } from "./useRealtimeSync";
import type { ClientDetail } from "../types";

export function useClientDetail(clientId: string | undefined) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    setDetailError(null);
    try {
      const response = await fetchClientDetail(clientId);
      setDetail(response);
    } catch (error) {
      setDetailError(toMessage(error));
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;
    void loadDetail().then(() => {
      if (cancelled) setDetail(null);
    });
    return () => {
      cancelled = true;
    };
  }, [loadDetail]);

  // Auto-refresh when another user changes data for this client
  const watches = useMemo(() => {
    if (!clientId) return [];
    const filter = `client_id=eq.${clientId}`;
    return [
      { table: "email_threads",  filter },
      { table: "email_messages", filter },
      { table: "action_items",   filter },
      { table: "transcripts",    filter },
      { table: "ai_insights",    filter },
      { table: "meetings",       filter },
    ];
  }, [clientId]);

  useRealtimeSync(watches, loadDetail);

  return { detail, setDetail, isLoading, detailError, setDetailError, loadDetail };
}
