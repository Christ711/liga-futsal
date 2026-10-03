import type { ComponentProps } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Lista desplegable nativa con etiqueta y mensaje, con el mismo aspecto que
 * `FormField`. En el celular abre el selector del sistema, más cómodo que uno propio.
 */
export function SelectField({
  name,
  id = name,
  label,
  error,
  options,
  className,
  ...selectProps
}: Omit<ComponentProps<"select">, "children"> & {
  name: string;
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}) {
  const messageId = `${id}-message`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? messageId : undefined}
        className={cn(
          "h-11 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className,
        )}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={messageId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
