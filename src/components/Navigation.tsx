import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Text, InlineStack } from '@shopify/polaris';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'dashboard',
      content: 'Dashboard',
      url: '/',
    },
    {
      id: 'settings',
      content: 'Settings',
      url: '/settings',
    },
  ];

  const selected = tabs.findIndex((tab) => tab.url === location.pathname);

  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #e1e3e5' }}>
      <div style={{ padding: '0 20px' }}>
        <InlineStack gap="400" align="space-between">
          <Text variant="headingMd" as="h1">
            StockPulse
          </Text>
          <Tabs
            tabs={tabs}
            selected={selected >= 0 ? selected : 0}
            onSelect={(index) => {
              navigate(tabs[index].url);
            }}
          />
        </InlineStack>
      </div>
    </div>
  );
}

