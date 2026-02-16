// ============================================================================
// EJLOG WMS - usePagination Hook
// Hook per gestione paginazione
// ============================================================================

import { useState, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export const usePagination = ({
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
}: UsePaginationOptions = {}) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const skip = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const take = pageSize;

  const goToPage = (newPage: number) => {
    setPage(newPage);
  };

  const nextPage = () => {
    setPage((prev) => prev + 1);
  };

  const previousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const changePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset a prima pagina
  };

  const reset = () => {
    setPage(initialPage);
    setPageSize(initialPageSize);
  };

  return {
    page,
    pageSize,
    skip,
    take,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    reset,
  };
};
