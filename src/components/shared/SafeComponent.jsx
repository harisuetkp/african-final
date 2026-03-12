import React from 'react';

/**
 * Wrapper component that catches errors in child components
 * preventing full page crashes
 */
export default function SafeComponent({ 
  children, 
  fallback = null,
  componentName = 'Component'
}) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return fallback || (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">
          {componentName} failed to load
        </p>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.error(`Error in ${componentName}:`, error);
    setHasError(true);
    return fallback;
  }
}