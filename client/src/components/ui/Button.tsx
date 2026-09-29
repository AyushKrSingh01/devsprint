import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const base = "w-full py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-forest text-white hover:bg-forest-hover"
      : "border border-line text-ink hover:bg-line/30";

  return <button className={`${base} ${styles} ${className ?? ""}`} {...props} />;
}
