import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-primary">
        {label}
      </label>
      <input
        id={inputId}
        className={`min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-primary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
