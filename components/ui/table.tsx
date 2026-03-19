"use client";

import React, { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onSort?: (key: string, direction: SortDirection) => void;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  caption?: string;
  stickyHeader?: boolean;
  striped?: boolean;
  onRowClick?: (row: T) => void;
}

// ── Sort Icon ──────────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <span className="inline-flex flex-col gap-px ml-1 flex-shrink-0" aria-hidden="true">
      <svg
        className="w-3 h-3"
        viewBox="0 0 12 12"
        fill="none"
        style={{ opacity: direction === "asc" ? 1 : 0.3 }}
      >
        <path d="M6 2L10 8H2L6 2Z" fill="currentColor" />
      </svg>
      <svg
        className="w-3 h-3 -mt-1"
        viewBox="0 0 12 12"
        fill="none"
        style={{ opacity: direction === "desc" ? 1 : 0.3 }}
      >
        <path d="M6 10L2 4H10L6 10Z" fill="currentColor" />
      </svg>
    </span>
  );
}

// ── Table Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 rounded animate-pulse"
                style={{
                  background: "var(--color-surface-2)",
                  width: j === 0 ? "60%" : j === columns - 1 ? "40%" : "80%",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Table Component ────────────────────────────────────────────────────────

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onSort,
  defaultSortKey,
  defaultSortDirection = null,
  loading = false,
  emptyMessage = "No data to display.",
  caption,
  stickyHeader = false,
  striped = false,
  onRowClick,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDirection);

  function handleSort(key: string) {
    let next: SortDirection;
    if (sortKey !== key) {
      next = "asc";
    } else if (sortDir === "asc") {
      next = "desc";
    } else if (sortDir === "desc") {
      next = null;
    } else {
      next = "asc";
    }
    setSortKey(next === null ? null : key);
    setSortDir(next);
    onSort?.(key, next);
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)" }}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          style={{ borderCollapse: "collapse" }}
        >
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}
          <thead
            style={{
              background: "var(--color-surface)",
              position: stickyHeader ? "sticky" : undefined,
              top: stickyHeader ? 0 : undefined,
              zIndex: stickyHeader ? 10 : undefined,
            }}
          >
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const dir: SortDirection = isSorted ? sortDir : null;
                const alignClass =
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                    ? "text-right"
                    : "text-left";

                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 text-xs font-semibold tracking-wide uppercase ${alignClass}`}
                    style={{
                      color: "var(--color-text-muted)",
                      width: col.width,
                      cursor: col.sortable ? "pointer" : undefined,
                      userSelect: col.sortable ? "none" : undefined,
                      whiteSpace: "nowrap",
                    }}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    aria-sort={
                      isSorted
                        ? dir === "asc"
                          ? "ascending"
                          : "descending"
                        : col.sortable
                        ? "none"
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (col.sortable) {
                        (e.currentTarget as HTMLTableCellElement).style.color =
                          "var(--color-text)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (col.sortable) {
                        (e.currentTarget as HTMLTableCellElement).style.color =
                          "var(--color-text-muted)";
                      }
                    }}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {col.header}
                      {col.sortable && <SortIcon direction={dir} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody style={{ background: "white" }}>
            {loading ? (
              <TableSkeleton columns={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: "var(--color-text-subtle)" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={keyExtractor(row, i)}
                  style={{
                    borderBottom:
                      i < data.length - 1 ? "1px solid var(--color-border)" : undefined,
                    background: striped && i % 2 === 1 ? "var(--color-surface)" : "white",
                    cursor: onRowClick ? "pointer" : undefined,
                  }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onMouseEnter={(e) => {
                    if (onRowClick) {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        "var(--color-surface)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onRowClick) {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        striped && i % 2 === 1 ? "var(--color-surface)" : "white";
                    }
                  }}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left";
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${alignClass}`}
                        style={{ color: "var(--color-text)", verticalAlign: "middle" }}
                      >
                        {col.cell(row, i)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Simple static table wrappers for quick use ─────────────────────────────

export function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${className}`}
      style={{ color: "var(--color-text-muted)" }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 text-sm ${className}`}
      style={{ color: "var(--color-text)", verticalAlign: "middle" }}
    >
      {children}
    </td>
  );
}

export default Table;
