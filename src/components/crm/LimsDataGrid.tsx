import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** LabKey-style data grid chrome: toolbar + sticky table + empty state. */
export function LimsDataGrid({
  toolbar,
  children,
  empty,
  isEmpty,
  className,
  footer,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  empty?: ReactNode;
  isEmpty?: boolean;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden border border-border bg-card", className)}>
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2.5">
          {toolbar}
        </div>
      ) : null}
      {isEmpty ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          {empty ?? "No records match the current filters."}
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
      {footer && !isEmpty ? (
        <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function LimsGridTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={cn("w-full caption-bottom text-sm", className)}>
      {children}
    </table>
  );
}

export function LimsGridHead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-[1] bg-card [&_tr]:border-b">
      {children}
    </thead>
  );
}

export function LimsGridTh({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "h-9 px-3 text-left align-middle text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function LimsGridBody({ children }: { children: ReactNode }) {
  return <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
}

export function LimsGridRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        "border-b border-border/80 transition-colors hover:bg-muted/40",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function LimsGridTd({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-3 py-2 align-middle text-sm", className)}>{children}</td>
  );
}
