"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <nav className="border-b border-line px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">devsprint</span>
        <div className="flex gap-6 items-center">
          <Link href="/login" className="text-sm text-slate hover:text-ink">
            Log in
          </Link>
          <Link href="/signup">
            <Button className="w-auto px-4 py-1.5 text-sm">Sign up</Button>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-xl text-center mb-14">
          <p className="font-mono text-xs text-forest mb-4">
            boards · lists · cards · live sync
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-tight">
            Sprint planning that stays in sync with your team
          </h1>
          <p className="text-slate text-base mb-8">
            Create boards, track work across lists, and see updates the
            moment your teammates make them — no refresh needed.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/signup" className="w-36">
              <Button>Get started</Button>
            </Link>
            <Link href="/login" className="w-36">
              <Button variant="secondary">Log in</Button>
            </Link>
          </div>
        </div>

        <BoardPreview />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mt-16 text-center">
          <Feature
            title="Real-time sync"
            desc="Every card, list, and move updates live for everyone on the board."
          />
          <Feature
            title="Drag to reorder"
            desc="Move cards between lists and reorder priorities in one motion."
          />
          <Feature
            title="Built for teams"
            desc="Shared boards, member access, and clear ownership on every card."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="font-medium text-sm mb-1.5">{title}</p>
      <p className="text-sm text-slate">{desc}</p>
    </div>
  );
}

function BoardPreview() {
  const columns = [
    { title: "Backlog", cards: ["Set up CI pipeline", "Write API docs"] },
    { title: "In Progress", cards: ["Auth middleware", "Board UI"] },
    { title: "Done", cards: ["Project schema"] },
  ];

  return (
    <div className="flex gap-3 border border-line rounded-lg p-4 bg-paper shadow-sm">
      {columns.map((col) => (
        <div key={col.title} className="w-36">
          <p className="text-xs font-medium text-slate mb-2 px-0.5">
            {col.title}
          </p>
          <div className="flex flex-col gap-1.5">
            {col.cards.map((card) => (
              <div
                key={card}
                className="border border-line rounded px-2 py-1.5 text-xs bg-paper"
              >
                {card}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
