import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  glow = false,
}: {
  className?: string;
  children: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl void-glass p-5",
        glow && "void-glow-border",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-sm font-medium text-zinc-400", className)}>
      {children}
    </h3>
  );
}

export function CardValue({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("mt-1 text-2xl font-semibold tracking-tight text-white", className)}>
      {children}
    </p>
  );
}
