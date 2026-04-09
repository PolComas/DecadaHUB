interface PaginationProps {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, hasNext, hasPrev, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-bar">
      <button
        className="ghost-button"
        disabled={!hasPrev}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        Anterior
      </button>
      <span className="pagination-info">
        Página {page + 1} de {totalPages}
      </span>
      <button
        className="ghost-button"
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Siguiente
      </button>
    </div>
  );
}
