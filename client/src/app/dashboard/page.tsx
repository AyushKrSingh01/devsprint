"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface Board {
  id: string;
  title: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    api
      .get("/boards")
      .then((res) => setBoards(res.data.boards))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await api.post("/boards", { title: newTitle });
      setBoards((prev) => [res.data.board, ...prev]);
      setNewTitle("");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold mb-6">Your boards</h1>

        <form onSubmit={handleCreateBoard} className="flex gap-2 mb-8">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New board title"
            className="flex-1 border border-line rounded px-3 py-2 bg-paper focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
          />
          <Button type="submit" disabled={creating} className="w-auto px-4">
            {creating ? "Creating..." : "Create"}
          </Button>
        </form>

        {boards.length === 0 ? (
          <p className="text-slate text-sm">
            No boards yet — create one above to get started.
          </p>
        ) : (
          <div className="grid gap-3">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => router.push(`/board/${board.id}`)}
                className="text-left"
              >
                <Card className="hover:border-forest transition-colors">
                  <p className="font-medium">{board.title}</p>
                  <p className="text-xs text-slate mt-1">
                    Created {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
