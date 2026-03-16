/**
 * SEO Component
 * Dynamic meta tags for each page
 */

import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

const env = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env ?? {};

const DEFAULT_TITLE = 'RommZ - Nền tảng tìm phòng trọ và bạn cùng phòng hàng đầu Việt Nam';
const DEFAULT_DESCRIPTION = 'RommZ giúp bạn tìm phòng trọ, căn hộ cho thuê và bạn cùng phòng phù hợp. Tin đăng xác thực, giá tốt, khu vực Hà Nội, HCM, Đà Nẵng.';
const DEFAULT_SITE_URL = 'https://rommz.site';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = '/og-image.png',
  url,
  type = 'website',
  noindex = false,
}: SEOProps) {
  const siteUrl = env.VITE_SITE_URL
    || (typeof window !== 'undefined' ? window.location.origin : DEFAULT_SITE_URL);
  const pageTitle = title ? `${title} | RommZ` : DEFAULT_TITLE;
  const pageUrl = url ? `${siteUrl}${url}` : siteUrl;
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  useEffect(() => {
    // Update document title
    document.title = pageTitle;

    // Helper to update meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update meta tags
    updateMeta('description', description);
    if (keywords) updateMeta('keywords', keywords);
    updateMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    updateMeta('og:title', pageTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:url', pageUrl, true);
    updateMeta('og:image', imageUrl, true);
    updateMeta('og:type', type, true);

    // Twitter
    updateMeta('twitter:title', pageTitle, true);
    updateMeta('twitter:description', description, true);
    updateMeta('twitter:image', imageUrl, true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    // Cleanup: Reset to defaults when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [pageTitle, description, keywords, pageUrl, imageUrl, type, noindex]);

  return null;
}

/**
 * Structured data for room listings (JSON-LD)
 */
interface RoomStructuredDataProps {
  room: {
    id: string;
    title: string;
    description?: string;
    price: number;
    address: string;
    city: string;
    images?: string[];
    landlord?: {
      name: string;
    };
  };
}

export function RoomStructuredData({ room }: RoomStructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = `room-${room.id}-structured-data`;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: room.title,
      description: room.description || `Phòng cho thuê tại ${room.address}, ${room.city}`,
      image: room.images?.[0] || '',
      offers: {
        '@type': 'Offer',
        price: room.price,
        priceCurrency: 'VND',
        availability: 'https://schema.org/InStock',
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      brand: {
        '@type': 'Organization',
        name: 'RommZ',
      },
    };

    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById(`room-${room.id}-structured-data`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [room]);

  return null;
}

/**
 * Breadcrumb structured data
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'breadcrumb-structured-data';

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${DEFAULT_SITE_URL}${item.url}`,
      })),
    };

    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('breadcrumb-structured-data');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [items]);

  return null;
}
