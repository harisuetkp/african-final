import React, { Suspense } from 'react';
import LoadingSkeleton from './LoadingSkeleton';

// Lazy route wrapper with loading fallback
export default function LazyRoute({ component: Component, fallback = <LoadingSkeleton />, ...props }) {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}