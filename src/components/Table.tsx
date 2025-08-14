import React from "react";

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

const Table: React.FC<TableProps> = ({
  children,
  className = "min-w-full divide-y divide-gray-200",
  ...props
}) => (
  <table className={className} {...props}>
    {children}
  </table>
);

export default Table;
