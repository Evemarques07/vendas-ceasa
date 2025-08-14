// src/components/ui/button.tsx

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot"; // 1. Importe o Slot
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "../Loading"; // Assumindo que você tem este componente

// 2. Adicione a prop `asChild` à interface
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
  asChild?: boolean; // A prop chave para mesclagem
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      asChild = false, // 3. Receba a prop `asChild`
      ...props
    },
    ref
  ) => {
    // 4. Determine se o componente será um botão ou um Slot
    const Comp = asChild ? Slot : "button";

    // Suas classes de estilo continuam exatamente as mesmas
    const baseClasses = [
      "inline-flex items-center justify-center rounded-md font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
    ];

    const variantClasses = {
      primary: "bg-primary-600 text-white hover:bg-primary-700",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
      ghost: "text-gray-700 hover:bg-gray-100",
      danger: "bg-red-600 text-white hover:bg-red-700",
    };

    const sizeClasses = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-11 px-8",
    };

    // 5. Use o <Comp> em vez de <button> diretamente
    if (asChild) {
      // Quando for Slot, não renderize múltiplos filhos!
      return (
        <Comp
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
          ref={ref}
          disabled={disabled || isLoading}
          {...props}
        />
      );
    }
    // Caso padrão (button)
    return (
      <Comp
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button };
