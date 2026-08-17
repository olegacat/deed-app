import { fetchPackagePdfBlob, type FillPdfRequest } from "@/lib/fill-pdf";
import { useCallback, useEffect, useRef, useState } from "react";

export function usePackagePdfPreview(payload: FillPdfRequest) {
  const payloadKey = JSON.stringify(payload);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedKeyRef.current && fetchedKeyRef.current !== payloadKey) {
      setStale(true);
    }
  }, [payloadKey]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await fetchPackagePdfBlob(payload);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      fetchedKeyRef.current = payloadKey;
      setStale(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF preview failed.");
    } finally {
      setLoading(false);
    }
  }, [payload, payloadKey]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return { url, loading, error, stale, refresh };
}
