import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, pageSize = 10, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pages: Array<number | '...'> = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--site-border)' }}>
      <p className="text-xs" style={{ color: 'var(--site-muted)' }}>
        Showing <span className="font-mono-tabular">{start}-{end}</span> of <span className="font-mono-tabular">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-40"
          style={{ borderColor: 'var(--site-border)', color: 'var(--site-text)' }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="px-1 text-xs" style={{ color: 'var(--site-muted)' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold"
              style={
                p === currentPage
                  ? { backgroundColor: 'var(--site-accent)', borderColor: 'var(--site-accent)', color: 'var(--site-accent-contrast)' }
                  : { borderColor: 'var(--site-border)', color: 'var(--site-text)' }
              }
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-40"
          style={{ borderColor: 'var(--site-border)', color: 'var(--site-text)' }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, pageSize = 10): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
