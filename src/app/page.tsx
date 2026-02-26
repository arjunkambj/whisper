"use client";

import { useQuery } from "convex-helpers/react/cache";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { TranscriptionHistory } from "@/components/transcription-history";
import { UploadProgress } from "@/components/upload-progress";
import { UploadZone } from "@/components/upload-zone";
import type { TranscriptionResult, UploadJob } from "@/lib/types";
import { api } from "../../convex/_generated/api";

export default function Page() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const transcriptions = useQuery(api.transcriptions.list);

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      const filtered = files.filter((file) => {
        const exists = transcriptions?.some(
          (t) => t.fileName === file.name && t.fileSize === file.size,
        );
        if (exists) {
          toast.error(`"${file.name}" has already been transcribed`);
          return false;
        }
        return true;
      });

      if (filtered.length === 0) return;

      const newJobs: UploadJob[] = filtered.map((file) => ({
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
                  : j,
              ),
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
                  : j,
              ),
            );
          });
      }
    },
    [transcriptions],
  );

  const handleDismiss = useCallback((clientId: string) => {
    setJobs((prev) => prev.filter((j) => j.clientId !== clientId));
  }, []);

  return (
    <main className="w-full px-6 lg:px-10 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Whisper</h1>
        <ThemeToggle />
      </div>

      <div className="max-w-2xl mx-auto">
        <UploadZone onFilesAdded={handleFilesAdded} />
      </div>

      <UploadProgress jobs={jobs} onDismiss={handleDismiss} />

      <TranscriptionHistory />
    </main>
  );
}
