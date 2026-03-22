import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-amber-700 px-5 py-3 text-white shadow-[0_14px_35px_rgba(180,83,9,0.28)] hover:bg-amber-800",
        outline:
          "border border-slate-300 px-5 py-3 text-slate-900 hover:border-amber-700 hover:text-amber-800",
        ghost: "px-4 py-3 text-slate-700 hover:bg-slate-100",
      },
      size: {
        default: "",
        sm: "px-4 py-2",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

type ButtonElement = HTMLButtonElement | HTMLAnchorElement;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof buttonVariants> & {
    as?: "button" | "a";
  };

export const Button = React.forwardRef<ButtonElement, ButtonProps>(
  ({ as = "button", className, size, variant, ...props }, ref) => {
    const classes = cn(buttonVariants({ size, variant }), className);

    if (as === "a") {
      return (
        <a
          className={classes}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }

    return (
      <button
        className={classes}
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  },
);

Button.displayName = "Button";

