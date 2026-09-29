import { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-paper border border-line rounded-lg p-8 ${className ?? ""}`}>
      {children}
    </div>
  );
}
