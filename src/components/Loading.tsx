import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary-600",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({
  message = "Carregando...",
  className,
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8",
        className
      )}
    >
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}
