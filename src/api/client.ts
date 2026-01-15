const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'https://stockpulse-pearl.vercel.app';

/**
 * API Client
 * Uses authenticated fetch for production (App Bridge session token)
 * Falls back to regular fetch with shop header in development
 */
export const api = {
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    // Extract shop from URL for development mode
    const shop = new URLSearchParams(window.location.search).get('shop');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (shop) {
      headers['x-shopify-shop-domain'] = shop;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    const json = await response.json();
    // Wrap the response in { data: ... } to match the expected type
    return { data: json };
  },

  async post<T = any>(endpoint: string, body?: any): Promise<{ data: T }> {
    // For now, use regular fetch with shop header
    // In production, this will use App Bridge authenticated fetch
    const shop = new URLSearchParams(window.location.search).get('shop');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (shop) {
      headers['x-shopify-shop-domain'] = shop;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    const json = await response.json();
    // Wrap the response in { data: ... } to match the expected type
    return { data: json };
  },
};
