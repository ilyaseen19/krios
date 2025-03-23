import React from 'react';
import './Table.css';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((data: T) => React.ReactNode);
  cell?: (data: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  tableClassName?: string;
  emptyMessage?: string;
  onRowClick?: (data: T) => void;
  rowClassName?: (data: T) => string;
}

const Table = <T extends object>({ 
  columns, 
  data, 
  className = '', 
  tableClassName = '',
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName
}: TableProps<T>) => {
  return (
    <div className={`table-container ${className}`}>
      <table className={`data-table ${tableClassName}`}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={rowClassName ? rowClassName(row) : ''}
              >
                {columns.map((column, colIndex) => {
                  const cellContent = typeof column.accessor === 'function' 
                    ? column.accessor(row)
                    : column.cell 
                      ? column.cell(row) 
                      : row[column.accessor as keyof T];
                  
                  return (
                    <td key={colIndex} className={column.className}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="empty-table-message">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
<tfoot className="table-footer">
<tr>
{columns.map((col, index) => (
<td key={index} className="footer-cell">{col.footer || ''}</td>
))}
</tr>
</tfoot>
      </table>
    </div>
  );
};

export default Table;