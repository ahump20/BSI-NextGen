import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  mobileResponsive?: boolean;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  className = '',
  striped = false,
  hoverable = true,
  compact = false,
  loading = false,
  emptyMessage = 'No data available',
  mobileResponsive = true,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const baseStyles = 'w-full border-collapse';
  const responsiveStyles = mobileResponsive ? 'overflow-x-auto' : '';

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={responsiveStyles}>
      <table className={`${baseStyles} ${className}`}>
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`
                  ${compact ? 'px-3 py-2' : 'px-6 py-3'}
                  text-${column.align || 'left'}
                  text-xs font-semibold text-gray-700 uppercase tracking-wider
                  ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
                  ${column.className || ''}
                `}
                onClick={() => column.sortable && requestSort(String(column.key))}
              >
                <div className="flex items-center justify-between">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <span className="ml-2">
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      ) : (
                        <span className="text-gray-400">⇅</span>
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''}
                ${hoverable ? 'hover:bg-blue-50 transition-colors' : ''}
              `}
            >
              {columns.map((column) => {
                const value = row[column.key as keyof T];
                const rendered = column.render
                  ? column.render(value, row, rowIndex)
                  : value;

                return (
                  <td
                    key={String(column.key)}
                    className={`
                      ${compact ? 'px-3 py-2' : 'px-6 py-4'}
                      text-${column.align || 'left'}
                      text-sm text-gray-900
                      ${column.className || ''}
                    `}
                  >
                    {rendered}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
