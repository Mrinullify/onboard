import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "default" | "lg";
}

/**
 * Simple Avatar component.
 * Shows the image if `src` is provided, otherwise displays `fallback` (initials) or a generic icon.
 */
export default function Avatar({ src, alt = "Avatar", fallback, size = "default", className, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    default: "h-12 w-12 text-sm",
    lg: "h-20 w-20 text-base",
  }[size];

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-muted",
        sizeClasses,
        className,
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            // fallback to initials if image fails to load
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      ) : null}
      {/* Show fallback if no image or image failed to load */}
      {(!src || !src?.trim()) && (
        <span className={cn("flex h-full w-full items-center justify-center font-medium text-muted-foreground", size === "lg" && "text-xl")}>"{fallback?.trim() ?? "?"}"</span>
      )}
    </div>
  );
}
