"use client";

import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize } from "@/lib/format";
import type { UploadJob } from "@/lib/types";

interface UploadProgressProps {
  jobs: UploadJob[];
  onDismiss: (clientId: string) => void;
}

export function UploadProgress({ jobs, onDismiss }: UploadProgressProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <Card key={job.clientId}>
          <CardContent className="flex items-center gap-3 py-3">
            {job.status === "uploading" && (
              <>
                <IconLoader2 className="size-5 text-muted-foreground animate-spin shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {job.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Transcribing...
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {formatFileSize(job.file.size)}
                </Badge>
              </>
            )}

            {job.status === "done" && job.result && (
              <>
                <IconCheck className="size-5 text-green-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {job.file.name}
                  </p>
                </div>
                <Link
                  href={`/transcription/${job.result.id}`}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  View
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => onDismiss(job.clientId)}
                >
                  <IconX className="size-4" />
                </Button>
              </>
            )}

            {job.status === "error" && (
              <>
                <IconX className="size-5 text-destructive shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {job.file.name}
                  </p>
                  <p className="text-xs text-destructive">
                    {job.error ?? "Transcription failed"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => onDismiss(job.clientId)}
                >
                  <IconX className="size-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
