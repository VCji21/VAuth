import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string[];
};

export function Input({ label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="field" htmlFor={inputId}>
      <span className="label">{label}</span>
      <input id={inputId} className="input" aria-invalid={!!error?.length} {...props} />
      {error?.[0] ? <span className="field-error">{error[0]}</span> : null}
    </label>
  );
}
