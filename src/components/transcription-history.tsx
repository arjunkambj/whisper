"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconGripVertical,
  IconLanguage,
  IconLoader,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatFileSize,
  formatRelativeTime,
  formatTimestamp,
} from "@/lib/format";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Transcription = {
  _id: Id<"transcriptions">;
  _creationTime: number;
  fileName: string;
  fileSize: number;
  text: string;
  segments: { text: string; startSecond: number; endSecond: number }[];
  transliteratedText?: string;
  language?: string;
  durationInSeconds?: number;
  position: number;
};

function SortableCard({
  t,
  onDelete,
  deleting,
  onTransliterate,
  transliterating,
}: {
  t: Transcription;
  onDelete: (e: React.MouseEvent, id: Id<"transcriptions">) => void;
  deleting: boolean;
  onTransliterate: (e: React.MouseEvent, t: Transcription) => void;
  transliterating: boolean;
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: t._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50 z-10" : ""}
    >
      <Card
        className="h-full hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => router.push(`/transcription/${t._id}`)}
      >
        <CardHeader className="pb-1">
          <div className="flex items-start justify-between  gap-2">
            <div className="min-w-0 flex-1 ">
              <CardTitle className="text-sm pb-2 font-medium truncate">
                {t.fileName}
              </CardTitle>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(t.fileSize)}
                </Badge>
                {t.language && (
                  <Badge variant="secondary" className="text-xs">
                    {t.language}
                  </Badge>
                )}
                {t.durationInSeconds != null && (
                  <Badge variant="secondary" className="text-xs">
                    {formatTimestamp(t.durationInSeconds)}
                  </Badge>
                )}
                {t.transliteratedText && (
                  <Badge variant="default" className="text-xs">
                    Translated
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(t._creationTime)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {t.transliteratedText || t.text}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={!!t.transliteratedText || transliterating}
                onClick={(e) => onTransliterate(e, t)}
              >
                {transliterating ? (
                  <IconLoader className="size-4 animate-spin" />
                ) : (
                  <IconLanguage className="size-4" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="size-7"
                disabled={deleting}
                onClick={(e) => onDelete(e, t._id)}
              >
                {deleting ? (
                  <IconLoader className="size-4 animate-spin" />
                ) : (
                  <IconTrash className="size-4" />
                )}
              </Button>
              <button
                type="button"
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
                {...attributes}
                {...listeners}
              >
                <IconGripVertical className="size-4" />
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

export function TranscriptionHistory() {
  const transcriptions = useQuery(api.transcriptions.list);
  const removeMutation = useMutation(api.transcriptions.remove);
  const reorderMutation = useMutation(api.transcriptions.reorder);
  const saveTransliterationMutation = useMutation(
    api.transcriptions.saveTransliteration,
  );
  const [deletingId, setDeletingId] = useState<Id<"transcriptions"> | null>(
    null,
  );
  const [transliteratingIds, setTransliteratingIds] = useState<
    Set<Id<"transcriptions">>
  >(new Set());
  const [filter, setFilter] = useState<"all" | "translated" | "original">(
    "all",
  );

  const filtered = (transcriptions ?? []).filter((t) => {
    if (filter === "translated") return !!t.transliteratedText;
    if (filter === "original") return !t.transliteratedText;
    return true;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDelete = async (
    e: React.MouseEvent,
    id: Id<"transcriptions">,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await removeMutation({ id });
      toast.success("Transcription deleted");
    } catch {
      toast.error("Failed to delete transcription");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTransliterate = async (e: React.MouseEvent, t: Transcription) => {
    e.preventDefault();
    e.stopPropagation();
    if (transliteratingIds.has(t._id) || t.transliteratedText) return;

    setTransliteratingIds((prev) => {
      const next = new Set(prev);
      next.add(t._id);
      return next;
    });
    try {
      const res = await fetch("/api/transliterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t.text, segments: t.segments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await saveTransliterationMutation({
        id: t._id,
        transliteratedText: data.text,
        transliteratedSegments: data.segments ?? [],
      });
      toast.success("Transliteration saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Transliteration failed",
      );
    } finally {
      setTransliteratingIds((prev) => {
        const next = new Set(prev);
        next.delete(t._id);
        return next;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !transcriptions) return;

    const oldIndex = transcriptions.findIndex((t) => t._id === active.id);
    const newIndex = transcriptions.findIndex((t) => t._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderMutation({
      id: active.id as Id<"transcriptions">,
      newPosition: transcriptions[newIndex].position,
    });
  };

  if (transcriptions === undefined) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {["a", "b", "c", "d"].map((key) => (
            <Skeleton key={key} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (transcriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No transcriptions yet. Upload an audio file to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">History</h2>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="translated">Translated</TabsTrigger>
            <TabsTrigger value="original">Original</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filtered.map((t) => t._id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((t) => (
              <SortableCard
                key={t._id}
                t={t}
                onDelete={handleDelete}
                deleting={deletingId === t._id}
                onTransliterate={handleTransliterate}
                transliterating={transliteratingIds.has(t._id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
