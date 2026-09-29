import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, ...props }: InputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm text-slate mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className="w-full border border-line rounded px-3 py-2 text-ink bg-paper focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
        {...props}
      />
    </div>
  );
}
