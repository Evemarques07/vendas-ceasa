import React from "react";

export const TableBody = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...props}>{children}</tbody>
);

export const TableCell = ({
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
  <td {...props}>{children}</td>
);

export const TableHead = ({
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
  <th {...props}>{children}</th>
);

export const TableHeader = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead {...props}>{children}</thead>
);

export const TableRow = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props}>{children}</tr>;
