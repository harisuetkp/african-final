import { useEffect } from 'react';

export default function SEOHead({ 
  title = 'Afrinnect - African Dating & Cultural Connection',
  description = 'Connect with African singles worldwide. Find meaningful relationships based on shared heritage, culture, and values.',
  image = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/f08d25426_ChatGPTImageDec16202511_09_07AM.png',
  url = 'https://afrinnect-658a9066.base44.app',
  type = 'website',
  keywords = 'african dating, black dating, african singles, cultural dating, diaspora dating'
}) {
  useEffect(() => {
    // Set title
    document.title = title;

    // Set meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: 'Afrinnect' },
      { name: 'robots', content: 'index, follow' },
      
      // Open Graph
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: 'Afrinnect' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      
      // Mobile
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
      { name: 'theme-color', content: '#7c3aed' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
    ];

    metaTags.forEach(({ name, property, content }) => {
      const attr = name ? 'name' : 'property';
      const value = name || property;
      
      let meta = document.querySelector(`meta[${attr}="${value}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, value);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

    // Structured data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'Afrinnect',
      'description': description,
      'url': url,
      'applicationCategory': 'SocialNetworkingApplication',
      'operatingSystem': 'Web',
      'offers': {
        '@type': 'Offer',
        'category': 'Dating & Relationships',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '1200'
      }
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);

  }, [title, description, image, url, type, keywords]);

  return null;
}