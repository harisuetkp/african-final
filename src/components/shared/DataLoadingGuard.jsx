import React from 'react';
import { Loader2 } from 'lucide-react';
import EmptyState from './EmptyState';

export default function DataLoadingGuard({
  isLoading,
  error,
  data,
  emptyMessage = 'No data available',
  emptyIcon,
  children,
  loadingComponent
}) {
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={40} />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={emptyIcon}
        title="Error loading data"
        description={error.message || 'Something went wrong'}
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyMessage}
        description="There's nothing here yet"
      />
    );
  }

  return <>{children}</>;
}