import { cn } from "@/utils/cn";
import React from "react";

interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
    type?: "button" | "submit" | "reset";
    variant: "primary" | "secondary" | "tertiary" | "outline" | "dark-outline" | "link";
    size?: "sm" | "md" | "lg" | "xl";
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ type, variant, size, icon, iconPosition = "right", disabled, children, className, ...props }) => {
    return (
        <button
            type={type || "button"}
            className={
                cn(
                    "inline-flex w-auto max-w-full gap-2 justify-center items-center px-4 py-2 rounded-full cursor-pointer font-semibold sm:px-8 lg:px-12",
                    variant === "primary" && "bg-primary dark:bg-accent text-white hover:bg-primary/80 dark:hover:bg-accent/80 transition-all",
                    variant === "secondary" && "bg-accent dark:bg-primary text-white hover:bg-accent/80 transition-all",
                    variant === "tertiary" && "bg-white text-primary hover:text-white hover:bg-accent/80 transition-all",
                    variant === "outline" && "border border-accent text-accent hover:bg-accent/10 transition-all",
                    variant === "dark-outline" && "border border-primary text-primary dark:border-white dark:text-white hover:bg-primary/10 transition-all",
                    variant === "link" && "px-4 text-accent hover:underline transition-all",
                    size === "sm" && "text-sm",
                    size === "md" && "text-md",
                    size === "lg" && "text-lg",
                    size === "xl" && "text-xl",
                    className,
                )
            }
            {...props}
            disabled={disabled}
        >
            {icon && iconPosition === "left" &&
                <span
                    className={
                        cn(
                            "flex items-center justify-center w-4 h-4",
                            variant === "primary" && "text-white",
                            variant === "secondary" && "text-white",
                            variant === "outline" && "text-accent",
                            variant === "link" && "text-accent",
                        )
                    }
                >
                    {icon}
                </span>
            }
            {children}
            {icon && iconPosition === "right" &&
                <span
                    className={
                        cn(
                            "w-4 h-4",
                            variant === "primary" && "text-white",
                            variant === "secondary" && "text-white",
                            variant === "outline" && "text-accent",
                            variant === "link" && "text-accent",
                        )
                    }
                >
                    {icon}
                </span>
            }
        </button>
    )
}