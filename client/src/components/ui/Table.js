import React from 'react';
import './Table.css';

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowKey = 'id',
  className = '',
}) => {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="table-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`table-wrapper ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align || 'left' }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row[rowKey] || index}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Search and Filter Bar
export const TableToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  children,
}) => {
  return (
    <div className="table-toolbar">
      <div className="table-toolbar-left">
        <div className="table-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
        {filters && <div className="table-filters">{filters}</div>}
      </div>
      {children && <div className="table-toolbar-right">{children}</div>}
    </div>
  );
};

// Pagination
export const TablePagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="table-pagination">
      <span className="pagination-info">
        Showing {startItem}-{endItem} of {totalItems}
      </span>
      <div className="pagination-buttons">
        <button
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          return (
            <button
              key={pageNum}
              className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Table;
