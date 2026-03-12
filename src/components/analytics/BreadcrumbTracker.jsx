import { useEffect, useRef } from 'react';

// Circular buffer for breadcrumbs
const MAX_BREADCRUMBS = 20;
let breadcrumbs = [];

export const addBreadcrumb = (category, message, data = null) => {
  const crumb = {
    timestamp: new Date().toISOString(),
    category,
    message,
    data
  };
  
  breadcrumbs.push(crumb);
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
};

export const getBreadcrumbs = () => [...breadcrumbs];

export function useBreadcrumbs() {
  useEffect(() => {
    // Track clicks
    const handleClick = (e) => {
      try {
        let target = e.target;
        // Find nearest interactive element
        while (target && target !== document.body) {
          if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.onclick) {
            const label = target.innerText || target.ariaLabel || target.className;
            addBreadcrumb('ui.click', `Clicked ${target.tagName.toLowerCase()}`, {
              label: label.substring(0, 50),
              classes: target.className
            });
            break;
          }
          target = target.parentElement;
        }
      } catch (err) {
        // Silent fail
      }
    };

    // Track console logs (optional, can be noisy)
    /*
    const originalLog = console.log;
    console.log = (...args) => {
      addBreadcrumb('console', args.map(a => String(a)).join(' ').substring(0, 100));
      originalLog(...args);
    };
    */

    window.addEventListener('click', handleClick, true);
    
    return () => {
      window.removeEventListener('click', handleClick, true);
      // console.log = originalLog;
    };
  }, []);
}