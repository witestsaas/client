export type InputProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function Input({
  label,
  type = "text",
  value,
  onChange,
  onFocus,
  onBlur,
}: InputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1 text-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full rounded-md border border-border bg-muted text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 placeholder-muted-foreground"
      />
    </div>
  );
}
