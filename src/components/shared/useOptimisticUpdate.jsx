import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function useOptimisticUpdate(queryKey, mutationFn) {
  const queryClient = useQueryClient();
  const [optimisticData, setOptimisticData] = useState(null);

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      if (variables.optimisticUpdate) {
        queryClient.setQueryData(queryKey, variables.optimisticUpdate);
        setOptimisticData(variables.optimisticUpdate);
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setOptimisticData(null);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey });
      setOptimisticData(null);
    }
  });

  return { ...mutation, optimisticData };
}