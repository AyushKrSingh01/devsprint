"use client";

import { useEffect, useState } from "react";
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

    return () => {
      socket.emit("leave-board", boardId);
      socket.off("card:created");
    };
  }, [boardId]);

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const res = await api.post("/lists", { title: newListTitle, boardId });
    setLists((prev) => [...prev, { ...res.data.list, cards: [] }]);
    setNewListTitle("");
  }

   async function handleCreateCard(listId: string, title: string, priority: string) {
    await api.post("/cards", { title, listId, priority });
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
      <div className="flex-1 overflow-x-auto px-6 py-8">
        <div className="flex gap-4 items-start">
          {lists.map((list) => (
            <div key={list.id} className="w-72 shrink-0">
              <p className="font-medium text-sm mb-3 px-1">{list.title}</p>
              <div className="flex flex-col gap-2 mb-3">
                {list.cards.map((card) => (
                  <Card key={card.id} className="p-3">
                    <p className="text-sm">{card.title}</p>
                    <span
                      className={`inline-block text-xs font-mono px-1.5 py-0.5 rounded mt-2 ${
                        card.priority === "high"
                          ? "bg-amber/10 text-amber"
                          : "bg-slate/10 text-slate"
                      }`}
                    >
                      {card.priority}
                    </span>
                  </Card>
                ))}
              </div>
              <NewCardForm onCreate={(title, priority) => handleCreateCard(list.id, title, priority)} />
            </div>
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