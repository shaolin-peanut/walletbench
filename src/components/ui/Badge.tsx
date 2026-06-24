"use client";

type BadgeVariant = "default" | "green" | "red" | "amber" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  title?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
  title,
}: BadgeProps) {
  return (
    <span
      className={`wb-badge wb-badge--${variant} ${className}`.trim()}
      role="status"
      title={title}
    >
      {children}
    </span>
  );
}
