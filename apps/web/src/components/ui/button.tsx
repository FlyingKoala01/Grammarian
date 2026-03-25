import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f3ec] disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-[#17120f]",
  {
    variants: {
      variant: {
        default:
          "bg-amber-700 px-5 py-3 text-white shadow-[0_14px_35px_rgba(180,83,9,0.28)] hover:bg-amber-800 dark:bg-[#9f561c] dark:text-[#fff7ef] dark:shadow-[0_18px_40px_rgba(66,28,8,0.4)] dark:hover:bg-[#b76524]",
        outline:
          "border border-slate-300 bg-white/70 px-5 py-3 text-slate-900 hover:border-amber-700 hover:text-amber-800 dark:border-white/12 dark:bg-white/5 dark:text-stone-100 dark:hover:border-[#c98a57] dark:hover:text-[#f6d8b1]",
        ghost:
          "px-4 py-3 text-slate-700 hover:bg-slate-100 dark:text-stone-200 dark:hover:bg-white/8",
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
