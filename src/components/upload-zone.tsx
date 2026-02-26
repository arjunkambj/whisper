"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconUpload } from "@tabler/icons-react";
import { formatFileSize } from "@/lib/format";
import { toast } from "sonner";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
];

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export function UploadZone({ onFilesAdded }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndPass = useCallback(
    (fileList: FileList | File[]) => {
      const valid: File[] = [];
      for (const file of Array.from(fileList)) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`Unsupported file type: ${file.type} (${file.name})`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(
            `${file.name} too large (${formatFileSize(file.size)}). Max 25MB.`
          );
          continue;
        }
        valid.push(file);
      }
      if (valid.length > 0) onFilesAdded(valid);
    },
    [onFilesAdded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        validateAndPass(e.dataTransfer.files);
      }
    },
    [validateAndPass]
  );

  return (
    <Card
      className={`border-2 border-dashed transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <CardContent className="flex flex-col items-center gap-2 py-4">
        <IconUpload className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop audio files, or click to browse
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndPass(e.target.files);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground">
          MP3, WAV, M4A, OGG, FLAC, WEBM, MP4 — max 25MB each
        </p>
      </CardContent>
    </Card>
  );
}
