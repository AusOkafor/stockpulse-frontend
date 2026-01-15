import { useEffect, useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Checkbox,
  Toast,
  Frame,
  Banner,
  ProgressBar,
  InlineStack,
  Badge,
} from '@shopify/polaris';
import { api } from '../api/client';

interface SettingsData {
  autoNotifyOnRestock: boolean;
}

interface PlanData {
  tier: string;
  monthlyNotifyLimit: number;
  notificationsUsedThisMonth: number;
  usageResetAt: string | null;
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchPlan();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get<SettingsData>('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setToast({ content: 'Failed to load settings', error: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlan = async () => {
    try {
      const response = await api.get<{ plan: PlanData }>('/plan');
      setPlan(response.data.plan);
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!settings) return;

    // Prevent enabling auto-notify on FREE plan
    if (checked && plan?.tier === 'FREE') {
      setToast({
        content: 'Auto-notify is only available on Pro plan. Upgrade to enable this feature.',
        error: true,
      });
      return;
    }

    setSaving(true);
    try {
      const response = await api.post<SettingsData>('/settings', {
        autoNotifyOnRestock: checked,
      });
      setSettings(response.data);
      setToast({ content: 'Settings saved successfully' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setToast({ content: 'Failed to save settings', error: true });
    } finally {
      setSaving(false);
    }
  };

  const isFreePlan = plan?.tier === 'FREE';
  const usagePercentage = plan
    ? Math.min((plan.notificationsUsedThisMonth / plan.monthlyNotifyLimit) * 100, 100)
    : 0;
  const isLimitReached = plan
    ? plan.notificationsUsedThisMonth >= plan.monthlyNotifyLimit
    : false;

  if (loading) {
    return <Page title="Settings">Loading...</Page>;
  }

  return (
    <Frame>
      {toast && (
        <Toast
          content={toast.content}
          error={toast.error}
          onDismiss={() => setToast(null)}
        />
      )}
      <Page title="Settings">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Plan & Usage
                </Text>
                {plan && (
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="bodyMd" as="p">
                        Current Plan
                      </Text>
                      <Badge tone={isFreePlan ? 'info' : 'success'}>
                        {plan.tier}
                      </Badge>
                    </InlineStack>
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="bodyMd" as="p">
                          Monthly Notifications
                        </Text>
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          {plan.notificationsUsedThisMonth} / {plan.monthlyNotifyLimit}
                        </Text>
                      </InlineStack>
                      <ProgressBar progress={usagePercentage} size="small" />
                      {isLimitReached && (
                        <Banner tone="warning">
                          Monthly notification limit reached. Upgrade to Pro for unlimited
                          notifications.
                        </Banner>
                      )}
                    </BlockStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Notifications
                </Text>
                <Checkbox
                  label="Auto-notify customers when products are restocked"
                  checked={settings?.autoNotifyOnRestock || false}
                  onChange={handleToggle}
                  disabled={saving || isFreePlan}
                  helpText={
                    isFreePlan
                      ? 'Upgrade to Pro to enable auto-notify when products are restocked.'
                      : 'Customers will automatically receive a restock notification when inventory becomes available.'
                  }
                />
                {isFreePlan && (
                  <Banner tone="info">
                    Auto-notify is a Pro feature. Upgrade to automatically notify customers
                    when products are restocked.
                  </Banner>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}

