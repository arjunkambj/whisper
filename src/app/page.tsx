"use client";

import { useCallback, useState } from "react";
import { UploadZone } from "@/components/upload-zone";
import { UploadProgress } from "@/components/upload-progress";
import { TranscriptionHistory } from "@/components/transcription-history";
import type { UploadJob, TranscriptionResult } from "@/lib/types";

export default function Page() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);

  const handleFilesAdded = useCallback((files: File[]) => {
    const newJobs: UploadJob[] = files.map((file) => ({
      clientId: crypto.randomUUID(),
      file,
      status: "uploading" as const,
    }));

    setJobs((prev) => [...newJobs, ...prev]);

    for (const job of newJobs) {
      const formData = new FormData();
      formData.append("audio", job.file);

      fetch("/api/ai", { method: "POST", body: formData })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Transcription failed");
          }
          const result: TranscriptionResult = await res.json();
          setJobs((prev) =>
            prev.map((j) =>
              j.clientId === job.clientId
                ? { ...j, status: "done" as const, result }
                : j
            )
          );
        })
        .catch((err) => {
          setJobs((prev) =>
            prev.map((j) =>
              j.clientId === job.clientId
                ? {
                    ...j,
                    status: "error" as const,
                    error:
                      err instanceof Error
                        ? err.message
                        : "Transcription failed",
                  }
                : j
            )
          );
        });
    }
  }, []);

  const handleDismiss = useCallback((clientId: string) => {
    setJobs((prev) => prev.filter((j) => j.clientId !== clientId));
  }, []);

  return (
    <main className="w-full px-6 lg:px-10 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Whisper</h1>

      <div className="max-w-2xl mx-auto">
        <UploadZone onFilesAdded={handleFilesAdded} />
      </div>

      <UploadProgress jobs={jobs} onDismiss={handleDismiss} />

      <TranscriptionHistory />
    </main>
  );
}
