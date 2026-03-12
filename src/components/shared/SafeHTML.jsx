import React from 'react';
import DOMPurify from 'dompurify';

export default function SafeHTML({ html, className = '', allowLinks = false }) {
  const config = allowLinks ? {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  } : {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  };

  const sanitized = DOMPurify.sanitize(html, config);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}