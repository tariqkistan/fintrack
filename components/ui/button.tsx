import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-violet-500/40 void-glow-border",
  secondary:
    "bg-transparent text-zinc-300 border border-white/10 hover:bg-white/5 hover:text-white",
  danger:
    "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20",
  ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
  white: "bg-white text-black hover:bg-zinc-100 border-0 font-semibold",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  disabled,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
