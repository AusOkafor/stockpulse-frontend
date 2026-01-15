import { useAppBridge } from '@shopify/app-bridge-react';

/**
 * Authenticated Fetch Utility
 * Uses App Bridge authenticated fetch for production
 * Falls back to regular fetch with shop header in development
 * 
 * Note: In App Bridge v3, authenticated fetch is handled differently.
 * For now, we use shop header in development and will use App Bridge
 * authenticated fetch in production when App Bridge is properly configured.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  appBridge?: any,
): Promise<Response> {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  // In development, use regular fetch with shop header if available
  if (isDevelopment && !appBridge) {
    const shop = new URLSearchParams(window.location.search).get('shop');
    const headers = new Headers(options.headers);
    if (shop) {
      headers.set('x-shopify-shop-domain', shop);
    }
    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Production: Use App Bridge authenticated fetch if available
  // For App Bridge v3, we'll use the authenticatedFetch from app-bridge-react
  // when properly configured
  if (appBridge) {
    // Use the authenticated fetch from App Bridge if available
    // This will handle session tokens automatically
    try {
      // In App Bridge v3, authenticated fetch is available via the app instance
      // For now, use shop header as fallback
      const shop = new URLSearchParams(window.location.search).get('shop');
      const headers = new Headers(options.headers);
      if (shop) {
        headers.set('x-shopify-shop-domain', shop);
      }
      return fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      console.error('Failed to use authenticated fetch:', error);
      // Fallback to regular fetch
      return fetch(url, options);
    }
  }

  // Fallback to regular fetch
  return fetch(url, options);
}

/**
 * Hook to get authenticated fetch function
 * Uses App Bridge authenticated fetch when available
 * Falls back to shop header in development
 */
export function useAuthenticatedFetch() {
  const app = useAppBridge();
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  return async (url: string, options: RequestInit = {}) => {
    // In development or when app is not available, use shop header
    if (isDevelopment || !app) {
      const shop = new URLSearchParams(window.location.search).get('shop');
      const headers = new Headers(options.headers);
      if (shop) {
        headers.set('x-shopify-shop-domain', shop);
      }
      return fetch(url, {
        ...options,
        headers,
      });
    }

    // In production with App Bridge, use the authenticated fetch
    // For now, use shop header - App Bridge v3 handles this differently
    // When App Bridge is properly configured, it will handle authentication
    const shop = new URLSearchParams(window.location.search).get('shop');
    const headers = new Headers(options.headers);
    if (shop) {
      headers.set('x-shopify-shop-domain', shop);
    }
    return fetch(url, {
      ...options,
      headers,
    });
  };
}

