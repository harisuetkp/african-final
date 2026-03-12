import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCallback } from 'react';

export function useInfinitePagination(entityName, filters = {}, options = {}) {
  const {
    pageSize = 20,
    sortBy = '-created_date',
    enableRefetch = true,
    refetchInterval = 60000
  } = options;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: [entityName, filters, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const skip = pageParam * pageSize;
        
        // Pass skip as the 4th argument (standard Base44 SDK filter signature)
        const results = await base44.entities[entityName].filter(
          filters,
          sortBy,
          pageSize + 1, // Fetch one extra to check if more exists
          skip
        );

        const hasMore = results.length > pageSize;
        const items = hasMore ? results.slice(0, pageSize) : results;

        return {
          items,
          nextPage: hasMore ? pageParam + 1 : null,
          hasMore
        };
      } catch (error) {
        console.error(`Failed to fetch ${entityName}:`, error);
        return {
          items: [],
          nextPage: null,
          hasMore: false
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    refetchInterval: enableRefetch ? refetchInterval : false,
    staleTime: options.staleTime || 120000,
    retry: options.retry || 1,
    retryDelay: options.retryDelay || 5000,
    enabled: options.enabled !== false
  });

  const allItems = data?.pages.flatMap(page => page.items) || [];

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    items: allItems,
    loadMore,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    isLoading,
    error,
    refetch
  };
}