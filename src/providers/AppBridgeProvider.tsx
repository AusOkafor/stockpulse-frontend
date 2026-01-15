import { useEffect, useState } from 'react';
import { Provider as ShopifyAppBridgeProvider } from '@shopify/app-bridge-react';

/**
 * App Bridge Provider
 * Required for embedded Shopify apps
 * 
 * In development: Allows bypass with DEV_SHOP env var
 * In production: Requires shop and host from URL (from OAuth callback)
 */
export function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ shop: boolean; host: boolean; apiKey: boolean } | null>(
    null,
  );
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  useEffect(() => {
    // Initialize App Bridge config from query params
    // shop and host come from OAuth callback redirect
    const searchParams = new URLSearchParams(window.location.search);
    const shopParam = searchParams.get('shop');
    const hostParam = searchParams.get('host');
    const shop = shopParam || window.sessionStorage.getItem('shop') || undefined;
    const host = hostParam || window.sessionStorage.getItem('host') || undefined;
    const apiKey =
      import.meta.env.VITE_SHOPIFY_API_KEY ||
      import.meta.env.VITE_API_KEY ||
      '';

    if (shopParam) {
      window.sessionStorage.setItem('shop', shopParam);
    }
    if (hostParam) {
      window.sessionStorage.setItem('host', hostParam);
    }
    
    // In development, allow bypass
    if (isDevelopment && !shop && !host) {
      console.warn('[DEV MODE] App Bridge not initialized - using mock mode');
      setIsInitialized(true);
      return;
    }

    // Production: shop and host are required (from OAuth callback)
    if (!shop || !host || !apiKey) {
      console.error('[ERROR] Missing required App Bridge parameters:', {
        shop,
        host,
        apiKey: !!apiKey,
      });
      setDebugInfo({ shop: !!shop, host: !!host, apiKey: !!apiKey });
      setIsInitialized(true);
      return;
    }

    // Initialize App Bridge config
    setConfig({
      apiKey,
      host,
      forceRedirect: true,
    });
    setDebugInfo({ shop: true, host: true, apiKey: true });
    setIsInitialized(true);
  }, [isDevelopment]);

  // Show loading while initializing
  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  // Development mode: Allow render without App Bridge (with warning)
  if (isDevelopment && !config) {
    console.warn('[DEV MODE] Running without App Bridge - use DEV_SHOP for mock shop');
    return <>{children}</>;
  }

  // Production mode: Require App Bridge config
  if (!config) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>App Bridge Not Initialized</h1>
        <p>This app must be accessed through the Shopify Admin.</p>
        <p>Shop and host parameters are required.</p>
        {debugInfo && (
          <p style={{ marginTop: '1rem', color: '#6d7175' }}>
            Debug: shop={debugInfo.shop ? 'yes' : 'no'} host={debugInfo.host ? 'yes' : 'no'} apiKey=
            {debugInfo.apiKey ? 'yes' : 'no'}
          </p>
        )}
      </div>
    );
  }

  return (
    <ShopifyAppBridgeProvider config={config}>
      {children}
    </ShopifyAppBridgeProvider>
  );
}

