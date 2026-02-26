"use client";

import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconEdit,
  IconLanguage,
  IconLoader2,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  formatFileSize,
  formatRelativeTime,
  formatTimestamp,
} from "@/lib/format";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function TranscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const transcription = useQuery(api.transcriptions.getById, {
    id: id as Id<"transcriptions">,
  });
  const updateMutation = useMutation(api.transcriptions.update);
  const removeMutation = useMutation(api.transcriptions.remove);
  const saveTransliterationMutation = useMutation(
    api.transcriptions.saveTransliteration,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeMutation({ id: id as Id<"transcriptions"> });
      toast.success("Transcription deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete transcription");
      setIsDeleting(false);
    }
  };

  if (isDeleting || transcription === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </main>
    );
  }

  if (transcription === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          Back
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Transcription not found.</p>
            <Link
              href="/"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Go home
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const hasTransliteration = !!transcription.transliteratedText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription.text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleEdit = () => {
    setEditText(transcription.text);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation({
        id: transcription._id,
        text: editText,
        segments: [],
      });
      setIsEditing(false);
      toast.success("Transcription saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText("");
  };

  const handleTransliterate = async () => {
    setIsTransliterating(true);
    try {
      const res = await fetch("/api/transliterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcription.text,
          segments: transcription.segments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await saveTransliterationMutation({
        id: transcription._id,
        transliteratedText: data.text,
        transliteratedSegments: data.segments ?? [],
      });
      toast.success("Transliterated to romanized Hindi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transliteration failed");
    } finally {
      setIsTransliterating(false);
    }
  };

  const renderSegments = (
    segments: { text: string; startSecond: number; endSecond: number }[],
    fallbackText: string,
  ) =>
    segments.length > 0 ? (
      <div className="space-y-2">
        {segments.map((seg) => (
          <div
            key={`${seg.startSecond}-${seg.endSecond}-${seg.text}`}
            className="flex gap-3 text-sm"
          >
            <span className="text-muted-foreground font-mono text-xs shrink-0 pt-0.5">
              {formatTimestamp(seg.startSecond)}
            </span>
            <p>{seg.text}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm whitespace-pre-wrap break-words leading-7">
        {fallbackText}
      </p>
    );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col h-screen overflow-hidden">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <IconArrowLeft className="size-4" />
        Back
      </Link>

      <Card className="flex flex-col min-h-0 flex-1">
        <CardHeader className="shrink-0">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-semibold">
              {transcription.fileName}
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              {!isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <IconCopy className="size-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <IconEdit className="size-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTransliterate}
                    disabled={isTransliterating}
                  >
                    {isTransliterating ? (
                      <IconLoader2 className="size-4 mr-1 animate-spin" />
                    ) : (
                      <IconLanguage className="size-4 mr-1" />
                    )}
                    Transliterate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <IconTrash className="size-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <IconCheck className="size-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <IconX className="size-4 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(transcription.fileSize)}
            </Badge>
            {transcription.language && (
              <Badge variant="secondary" className="text-xs">
                {transcription.language}
              </Badge>
            )}
            {transcription.durationInSeconds != null && (
              <Badge variant="secondary" className="text-xs">
                {formatTimestamp(transcription.durationInSeconds)}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(transcription._creationTime)}
            </span>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 flex-1 min-h-0 overflow-y-auto">
          {isEditing ? (
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[300px] h-full font-mono text-sm"
            />
          ) : (
            <Tabs defaultValue="original">
              <TabsList>
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger
                  value="transliterated"
                  disabled={!hasTransliteration}
                >
                  Transliterated
                </TabsTrigger>
              </TabsList>
              <TabsContent value="original" className="mt-4">
                <p className="text-sm whitespace-pre-wrap break-words leading-7">
                  {transcription.text}
                </p>
              </TabsContent>
              <TabsContent value="transliterated" className="mt-4">
                {hasTransliteration &&
                  renderSegments(
                    transcription.transliteratedSegments ?? [],
                    transcription.transliteratedText ?? "",
                  )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
