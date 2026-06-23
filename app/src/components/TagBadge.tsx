import { Link } from "react-router";
import { cn } from "@/lib/utils";

export type TagBadgeVariant = "default" | "large" | "filter" | "cloud";
export type TagBadgeState = "inactive" | "active" | "disabled";

interface TagBadgeProps {
  name: string;
  color: string;
  count?: number;
  variant?: TagBadgeVariant;
  state?: TagBadgeState;
  href?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  as?: "button" | "span";
}

export default function TagBadge({
  name,
  color,
  count,
  variant = "default",
  state = "inactive",
  href,
  onClick,
  className,
  as = "button",
}: TagBadgeProps) {
  const isActive = state === "active";
  const isDisabled = state === "disabled";

  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-full border-2 border-black font-bold transition-all duration-150 ease-out select-none cursor-pointer";

  const sizeClasses = {
    default: "h-7 px-3.5 text-xs tracking-wide",
    large: "h-8 px-4 text-[13px] tracking-wide",
    filter: "h-7 px-3.5 text-xs tracking-wide",
    cloud: "px-4 py-1.5 text-sm tracking-wide",
  };

  const stateClasses = isDisabled
    ? "opacity-40 cursor-not-allowed shadow-none translate-x-0 translate-y-0"
    : isActive
      ? "shadow-[3px_3px_0px_#000000] translate-x-0 translate-y-0"
      : "shadow-[2px_2px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] hover:-translate-x-px hover:-translate-y-px";

  const textColor = isActive ? "#ffffff" : color;
  const bgColor = isActive
    ? color
    : isDisabled
      ? `${color}1A`
      : `${color}26`;

  const style: React.CSSProperties = {
    backgroundColor: bgColor,
    color: isActive ? "#ffffff" : isDisabled ? "#9ca3af" : textColor,
  };

  const content = (
    <>
      <span>{name}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-bold",
            isActive ? "bg-white/20 text-white" : "bg-black/10 text-black/70"
          )}
        >
          {count}
        </span>
      )}
    </>
  );

  if (href && !isDisabled) {
    return (
      <Link
        to={href}
        className={cn(baseClasses, sizeClasses[variant], stateClasses, className)}
        style={style}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </Link>
    );
  }

  if (as === "span") {
    return (
      <span
        className={cn(baseClasses, sizeClasses[variant], stateClasses, className)}
        style={{ ...style, ...{ backgroundColor: bgColor, color: isActive ? "#ffffff" : isDisabled ? "#9ca3af" : textColor } }}
        onClick={!isDisabled ? onClick : undefined}
        role={onClick ? "button" : undefined}
        tabIndex={onClick && !isDisabled ? 0 : undefined}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(baseClasses, sizeClasses[variant], stateClasses, className)}
      style={{ ...style, ...{ backgroundColor: bgColor, color: isActive ? "#ffffff" : isDisabled ? "#9ca3af" : textColor } }}
    >
      {content}
    </button>
  );
}
