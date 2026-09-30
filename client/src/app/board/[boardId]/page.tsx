"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
   useDroppable,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { getSocket } from "@/lib/socket";

interface CardItem {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  position: number;
}

interface ListItem {
  id: string;
  title: string;
  position: number;
  cards: CardItem[];
}

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;

  const [lists, setLists] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListTitle, setNewListTitle] = useState("");

  function loadLists() {
    api
      .get(`/lists/board/${boardId}`)
      .then((res) => setLists(res.data.lists))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }

 useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadLists();

    const socket = getSocket();
    socket.emit("join-board", boardId);

    socket.on("card:created", ({ card }: { card: CardItem & { listId: string } }) => {
      setLists((prev) =>
        prev.map((list) =>
          list.id === card.listId
            ? { ...list, cards: [...list.cards, card] }
            : list
        )
      );
    });

    socket.on("list:created", ({ list }: { list: ListItem }) => {
      setLists((prev) => [...prev, { ...list, cards: [] }]);
    });

    socket.on("card:updated", ({ card }: { card: CardItem & { listId: string } }) => {
      setLists((prev) =>
        prev.map((list) =>
          list.id === card.listId
            ? {
                ...list,
                cards: list.cards.map((c) => (c.id === card.id ? card : c)),
              }
            : list
        )
      );
    });

    socket.on("card:deleted", ({ cardId, listId }: { cardId: string; listId: string }) => {
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, cards: list.cards.filter((c) => c.id !== cardId) }
            : list
        )
      );
    });

    return () => {
      socket.emit("leave-board", boardId);
      socket.off("card:created");
      socket.off("list:created");
      socket.off("card:updated");
      socket.off("card:deleted");
    };
  }, [boardId]);

    async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    await api.post("/lists", { title: newListTitle, boardId });
    setNewListTitle("");
  }

   async function handleCreateCard(listId: string, title: string, priority: string) {
    await api.post("/cards", { title, listId, priority });
  }
    const sensors = useSensors(useSensor(PointerSensor));

    function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCardId = active.id as string;
    const overId = over.id as string;

    let sourceListId = "";
    let targetListId = "";
    let targetPosition = 0;

    for (const list of lists) {
      const activeIndex = list.cards.findIndex((c) => c.id === activeCardId);
      if (activeIndex !== -1) sourceListId = list.id;

      const overIndex = list.cards.findIndex((c) => c.id === overId);
      if (overIndex !== -1) {
        targetListId = list.id;
        targetPosition = overIndex;
      }
    }

    if (!targetListId) {
      const droppedOnList = lists.find((l) => l.id === overId);
      if (droppedOnList) {
        targetListId = droppedOnList.id;
        targetPosition = 0;
      }
    }

    if (!sourceListId || !targetListId) return;
    setLists((prev) => {
      const sourceList = prev.find((l) => l.id === sourceListId)!;
      const movedCard = sourceList.cards.find((c) => c.id === activeCardId)!;

      return prev.map((list) => {
        if (list.id === sourceListId && list.id === targetListId) {
          const withoutMoved = list.cards.filter((c) => c.id !== activeCardId);
          const insertAt = withoutMoved.findIndex((c) => c.id === overId);
          withoutMoved.splice(insertAt, 0, movedCard);
          return { ...list, cards: withoutMoved };
        }
        if (list.id === sourceListId) {
          return { ...list, cards: list.cards.filter((c) => c.id !== activeCardId) };
        }
        if (list.id === targetListId) {
          const newCards = [...list.cards];
          newCards.splice(targetPosition, 0, movedCard);
          return { ...list, cards: newCards };
        }
        return list;
      });
    });

    api.patch(`/cards/${activeCardId}`, {
      listId: targetListId,
      position: targetPosition,
    });
  }
    async function handleUpdatePriority(cardId: string, priority: string) {
    await api.patch(`/cards/${cardId}`, { priority });
  }

  async function handleDeleteCard(cardId: string) {
    await api.delete(`/cards/${cardId}`);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate">
        Loading...
      </div>
    );
  }

    return (
    <div className="flex-1 flex flex-col">
      <Navbar />
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto px-6 py-8">
          <div className="flex gap-4 items-start">
            {lists.map((list) => (
              <DroppableList key={list.id} listId={list.id} title={list.title}>
                <SortableContext
                  items={list.cards.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {list.cards.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onDelete={handleDeleteCard}
                      onPriorityChange={handleUpdatePriority}
                    />
                  ))}
                </SortableContext>
                <NewCardForm onCreate={(title, priority) => handleCreateCard(list.id, title, priority)} />
              </DroppableList>
            ))}

            <form onSubmit={handleCreateList} className="w-72 shrink-0">
              <input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="+ Add list"
                className="w-full border border-line rounded px-3 py-2 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
              />
            </form>
          </div>
        </div>
      </DndContext>
    </div>
  );
}

function NewCardForm({
  onCreate,
}: {
  onCreate: (title: string, priority: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title, priority);
    setTitle("");
    setPriority("medium");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="+ Add card"
        className="w-full border border-line rounded px-3 py-2 text-sm bg-paper focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
      />
      {title && (
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full border border-line rounded px-2 py-1 text-xs bg-paper focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
      )}
    </form>
  );
}
function DroppableList({
  listId,
  title,
  children,
}: {
  listId: string;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: listId });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-lg p-1 transition-colors ${
        isOver ? "bg-forest/5" : ""
      }`}
    >
      <p className="font-medium text-sm mb-3 px-1">{title}</p>
      <div className="flex flex-col gap-2 mb-3">{children}</div>
    </div>
  );
}
function SortableCard({
  card,
  onDelete,
  onPriorityChange,
}: {
  card: CardItem;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-3 cursor-grab active:cursor-grabbing">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm">{card.title}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="text-slate hover:text-amber text-xs"
          >
            ✕
          </button>
        </div>
        <select
          value={card.priority}
          onChange={(e) => onPriorityChange(card.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`inline-block text-xs font-mono px-1.5 py-0.5 rounded mt-2 border-0 cursor-pointer ${
            card.priority === "high" ? "bg-amber/10 text-amber" : "bg-slate/10 text-slate"
          }`}
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </Card>
    </div>
  );
}