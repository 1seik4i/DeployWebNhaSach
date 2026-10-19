import { useEffect, useState, useMemo } from 'react';
import './ListPagination.css';

export function useListPagination<T>(items: T[], resetKey: string, pageSize = 10) {
  const [requestedPage, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [resetKey]);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);
  return { 
    page, 
    totalPages, 
    setPage, 
    pageSize,
    startIndex,
    endIndex,
    totalItems: items.length,
    items: items.slice(startIndex, startIndex + pageSize) 
  };
}

export function getPaginationRange(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | 'ellipsis')[] = [];
  const showLeftEllipsis = currentPage > 4;
  const showRightEllipsis = currentPage < totalPages - 3;

  if (!showLeftEllipsis && showRightEllipsis) {
    for (let i = 1; i <= 5; i++) items.push(i);
    items.push('ellipsis');
    items.push(totalPages);
  } else if (showLeftEllipsis && !showRightEllipsis) {
    items.push(1);
    items.push('ellipsis');
    for (let i = totalPages - 4; i <= totalPages; i++) items.push(i);
  } else {
    items.push(1);
    items.push('ellipsis');
    items.push(currentPage - 1);
    items.push(currentPage);
    items.push(currentPage + 1);
    items.push('ellipsis');
    items.push(totalPages);
  }

  return items;
}

export function ListPagination({ 
  page, 
  totalPages, 
  onChange, 
  vi,
  className
}: {
  page: number; 
  totalPages: number; 
  onChange: (page: number) => void; 
  vi: boolean;
  className?: string;
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const currentPage = Math.min(Math.max(1, page), safeTotalPages);
  const range = useMemo(() => getPaginationRange(currentPage, safeTotalPages), [currentPage, safeTotalPages]);

  return (
    <nav className={`list-pagination ${className || ''}`} aria-label={vi ? 'Phân trang danh sách' : 'List pagination'}>
      <button 
        type="button" 
        className="list-pagination-prev"
        disabled={currentPage <= 1} 
        onClick={() => onChange(currentPage - 1)}
      >
        {vi ? 'Trang trước' : 'Previous'}
      </button>

      <div className="list-pagination-numbers">
        {range.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="list-pagination-ellipsis" aria-hidden="true">
                ...
              </span>
            );
          }
          return (
            <button
              key={item}
              type="button"
              className={`list-pagination-btn ${item === currentPage ? 'is-active' : ''}`}
              aria-label={`${vi ? 'Trang' : 'Page'} ${item}`}
              aria-current={item === currentPage ? 'page' : undefined}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          );
        })}
      </div>

      <button 
        type="button" 
        className="list-pagination-next"
        disabled={currentPage >= safeTotalPages} 
        onClick={() => onChange(currentPage + 1)}
      >
        {vi ? 'Trang sau' : 'Next'}
      </button>

      <span className="list-pagination-info" aria-live="polite">
        {vi ? 'Trang' : 'Page'} {currentPage}/{safeTotalPages}
      </span>
    </nav>
  );
}
