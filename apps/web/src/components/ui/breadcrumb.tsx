import * as React from "react";

import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav">
>(({ className, ...props }, ref) => (
  <nav
    aria-label="breadcrumb"
    className={cn("w-full", className)}
    ref={ref}
    {...props}
  />
));

Breadcrumb.displayName = "Breadcrumb";

export const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    className={cn(
      "flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-stone-400",
      className,
    )}
    ref={ref}
    {...props}
  />
));

BreadcrumbList.displayName = "BreadcrumbList";

export const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li className={cn("inline-flex items-center gap-1.5", className)} ref={ref} {...props} />
));

BreadcrumbItem.displayName = "BreadcrumbItem";

type BreadcrumbLinkProps =
  | ({
      as?: "button";
    } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  | ({
      as: "a";
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>);

export const BreadcrumbLink = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  BreadcrumbLinkProps
>(({ as = "button", className, ...props }, ref) => {
  const classes = cn(
    "inline-flex items-center rounded-md px-1 py-0.5 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-stone-100",
    className,
  );

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
      type="button"
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
});

BreadcrumbLink.displayName = "BreadcrumbLink";

export const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    aria-current="page"
    className={cn("font-medium text-slate-950 dark:text-stone-100", className)}
    ref={ref}
    {...props}
  />
));

BreadcrumbPage.displayName = "BreadcrumbPage";

export const BreadcrumbSeparator = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ children, className, ...props }, ref) => (
  <li
    aria-hidden="true"
    className={cn("text-slate-400 dark:text-stone-500", className)}
    ref={ref}
    {...props}
  >
    {children ?? <ChevronRight className="h-4 w-4" />}
  </li>
));

BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
