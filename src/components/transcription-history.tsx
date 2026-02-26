"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex-helpers/react/cache";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatTimestamp,
  formatFileSize,
  formatRelativeTime,
} from "@/lib/format";
import { IconTrash, IconGripVertical } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Transcription = {
  _id: Id<"transcriptions">;
  _creationTime: number;
  fileName: string;
  fileSize: number;
  text: string;
  language?: string;
  durationInSeconds?: number;
  position: number;
};

function SortableCard({
  t,
  onDelete,
}: {
  t: Transcription;
  onDelete: (e: React.MouseEvent, id: Id<"transcriptions">) => void;
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
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">
                {t.fileName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(t._creationTime)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {t.text}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={(e) => onDelete(e, t._id)}
              >
                <IconTrash className="size-4" />
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDelete = async (
    e: React.MouseEvent,
    id: Id<"transcriptions">
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeMutation({ id });
      toast.success("Transcription deleted");
    } catch {
      toast.error("Failed to delete transcription");
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
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
      <h2 className="text-lg font-semibold">History</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={transcriptions.map((t) => t._id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {transcriptions.map((t) => (
              <SortableCard key={t._id} t={t} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
