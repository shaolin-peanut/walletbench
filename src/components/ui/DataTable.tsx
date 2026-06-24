"use client";

type Align = "left" | "right" | "center";

export interface ColumnDef<T> {
  key: string;
  label: string;
  align?: Align;
  render?: (row: T, value: unknown) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyText?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyText = "No data",
  className = "",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={`wb-panel ${className}`.trim()}>
        <p className="text-data text-wb-muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`wb-panel overflow-x-auto ${className}`.trim()}>
      <table
        className={`wb-table${columns.some((c) => c.align === "right") ? " wb-table--right" : ""}${columns.some((c) => c.align === "center") ? " wb-table--center" : ""}`.trim()}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${col.className ?? ""} ${col.align ? `text-${col.align}` : ""}`.trim()}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={rowKey(row, idx)}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`${col.className ?? ""} ${col.align ? `text-${col.align}` : ""}`.trim()}
                >
                  {col.render
                    ? col.render(row, (row as Record<string, unknown>)[col.key])
                    : String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
