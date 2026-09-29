"use client";

import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <nav className="border-b border-line px-6 py-4 flex items-center justify-between">
      <span className="font-mono text-sm font-semibold">devsprint</span>
      <button
        onClick={handleLogout}
        className="text-sm text-slate hover:text-ink"
      >
        Log out
      </button>
    </nav>
  );
}
