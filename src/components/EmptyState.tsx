import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "mx-auto flex max-w-sm flex-col items-center rounded-2xl border border-border/40 bg-card/30 px-6 py-12 text-center",
      className,
    )}
  >
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-secondary/40">
      <Icon className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.75} />
    </div>
    <p className="font-display text-base font-semibold text-foreground sm:text-lg">{title}</p>
    {description && (
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
    )}
    {actionLabel && actionHref && (
      <Link
        to={actionHref}
        className="mt-5 inline-flex items-center rounded-full border border-[hsl(var(--gold)/0.35)] bg-[hsl(var(--gold)/0.08)] px-4 py-2 text-sm font-medium text-[hsl(var(--gold-light))] transition-colors hover:bg-[hsl(var(--gold)/0.14)]"
      >
        {actionLabel}
      </Link>
    )}
    {actionLabel && onAction && !actionHref && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center rounded-full border border-[hsl(var(--gold)/0.35)] bg-[hsl(var(--gold)/0.08)] px-4 py-2 text-sm font-medium text-[hsl(var(--gold-light))] transition-colors hover:bg-[hsl(var(--gold)/0.14)]"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
