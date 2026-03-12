import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function usePagination(entityName, filters = {}, pageSize = 50) {
  const [lastId, setLastId] = useState(null);

  const fetchPage = async ({ pageParam = null }) => {
    const query = {
      ...filters,
      ...(pageParam ? { id: { $lt: pageParam } } : {})
    };

    const results = await base44.entities[entityName].filter(
      query,
      '-created_date',
      pageSize + 1 // Fetch one extra to determine if there's a next page
    );

    const hasMore = results.length > pageSize;
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: [entityName, filters],
    queryFn: fetchPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30000,
    cacheTime: 300000
  });

  const allItems = data?.pages.flatMap(page => page.items) || [];

  return {
    items: allItems,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    isLoading,
    error
  };
}

export function useOptimizedQuery(entityName, filters = {}, options = {}) {
  const {
    pageSize = 50,
    sortBy = '-created_date',
    enableRefetch = true,
    refetchInterval = 30000
  } = options;

  return useInfiniteQuery({
    queryKey: [entityName, filters, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam * pageSize;
      const results = await base44.entities[entityName].filter(
        filters,
        sortBy,
        pageSize
      );

      return {
        items: results,
        nextPage: results.length === pageSize ? pageParam + 1 : null
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchInterval: enableRefetch ? refetchInterval : false,
    staleTime: 30000,
    cacheTime: 300000
  });
}