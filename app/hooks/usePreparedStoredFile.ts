"use client";

import { useCallback, useRef, useState } from "react";

import { compressStoredFile, type MediaKind } from "@/utils/file-upload/compressWithAgent";

export type PreparationStatus = "idle" | "optimizing" | "ready" | "failed";

export function usePreparedStoredFile(mediaKind: MediaKind, onError: (message: string) => void) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<PreparationStatus>("idle");
  const revision = useRef(0);

  const selectFile = useCallback((source: File) => {
    const currentRevision = ++revision.current;
    setFile(null);
    setStatus("optimizing");
    void compressStoredFile(source, mediaKind)
      .then((compressed) => {
        if (revision.current !== currentRevision) return;
        setFile(compressed);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (revision.current !== currentRevision) return;
        setStatus("failed");
        onError(error instanceof Error ? error.message : "File could not be optimized. Please try again.");
      });
  }, [mediaKind, onError]);

  const clear = useCallback(() => {
    revision.current += 1;
    setFile(null);
    setStatus("idle");
  }, []);

  return { clear, file, selectFile, status };
}
