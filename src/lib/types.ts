export interface TranscriptionResult {
  id: string;
  text: string;
  segments: { text: string; startSecond: number; endSecond: number }[];
  language?: string;
  durationInSeconds?: number;
  fileName: string;
  fileSize: number;
}

export interface UploadJob {
  clientId: string;
  file: File;
  status: "uploading" | "done" | "error";
  result?: TranscriptionResult;
  error?: string;
}
