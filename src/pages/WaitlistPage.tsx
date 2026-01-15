import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Text,
  Badge,
  InlineStack,
  BlockStack,
  Button,
  EmptyState,
  Toast,
  Frame,
  Banner,
} from '@shopify/polaris';
import { api } from '../api/client';

interface WaitlistItem {
  id: string;
  channel: string;
  status: string;
  contactMasked: string;
  requestedAt: string;
  recoveredRevenue: number | null;
}

interface WaitlistData {
  product: {
    id: string;
    title: string;
    image: string | null;
  };
  waitlist: WaitlistItem[];
  summary: {
    totalWaiting: number;
    totalNotified: number;
    totalRecoveredRevenue: number;
  };
}

interface PlanData {
  tier: string;
  monthlyNotifyLimit: number;
  notificationsUsedThisMonth: number;
  usageResetAt: string | null;
}

export function WaitlistPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const search = location.search || '';
  const [data, setData] = useState<WaitlistData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null);
  const [notifyingIds, setNotifyingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (productId) {
      fetchWaitlistData();
      fetchPlan();
    }
  }, [productId]);

  const fetchWaitlistData = async () => {
    if (!productId) return;

    try {
      const response = await api.get<WaitlistData>(`/demand/product/${productId}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch waitlist data:', error);
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

  const handleNotify = async (demandRequestId: string) => {
    // Optimistic UI update
    setNotifyingIds((prev) => new Set(prev).add(demandRequestId));

    try {
      await api.post(`/demand/${demandRequestId}/notify`);
      
      // Refresh data to get updated status
      await fetchWaitlistData();
      
      setToast({ content: 'Customer notified successfully' });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to notify customer';
      setToast({ content: errorMessage, error: true });
    } finally {
      setNotifyingIds((prev) => {
        const next = new Set(prev);
        next.delete(demandRequestId);
        return next;
      });
    }
  };

  if (loading) {
    return <Page title="Waitlist">Loading...</Page>;
  }

  if (!data) {
    return (
      <Page title="Waitlist">
        <EmptyState
          heading="Waitlist not found"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          action={{
            content: 'Back to Dashboard',
            onAction: () => navigate(`/${search}`),
          }}
        >
          <Text variant="bodyMd" as="p">
            Unable to load waitlist data for this product.
          </Text>
        </EmptyState>
      </Page>
    );
  }

  const rows = data.waitlist.map((item) => [
    item.contactMasked,
    (
      <Badge key={`channel-${item.id}`} tone={item.channel === 'EMAIL' ? 'info' : 'success'}>
        {item.channel}
      </Badge>
    ) as any,
    (
      <Badge
        key={`status-${item.id}`}
        tone={
          item.status === 'CONVERTED'
            ? 'success'
            : item.status === 'NOTIFIED'
              ? 'attention'
              : 'info'
        }
      >
        {item.status === 'CONVERTED'
          ? 'Converted'
          : item.status === 'NOTIFIED'
            ? 'Notified'
            : 'Waiting'}
      </Badge>
    ) as any,
    new Date(item.requestedAt).toLocaleDateString(),
    item.recoveredRevenue ? `$${item.recoveredRevenue.toLocaleString()}` : '—',
    item.status === 'PENDING' ? (
      <Button
        key={`notify-${item.id}`}
        size="slim"
        loading={notifyingIds.has(item.id)}
        onClick={() => handleNotify(item.id)}
        disabled={
          plan
            ? plan.notificationsUsedThisMonth >= plan.monthlyNotifyLimit
            : false
        }
      >
        Notify
      </Button>
    ) : (
      <Badge key={`sent-${item.id}`} tone="info">
        Sent
      </Badge>
    ) as any,
  ]);

  return (
    <Frame>
      {toast && (
        <Toast
          content={toast.content}
          error={toast.error}
          onDismiss={() => setToast(null)}
        />
      )}
      <Page
        title={`Waitlist — ${data.product.title}`}
        subtitle="Customers waiting for this product"
        backAction={{
          content: 'Dashboard',
          onAction: () => navigate(`/${search}`),
        }}
      >
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
            {/* Summary Cards */}
            <InlineStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">
                    Waiting
                  </Text>
                  <Text variant="heading2xl" as="p">
                    {data.summary.totalWaiting}
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Customers waiting to be notified
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">
                    Notified
                  </Text>
                  <Text variant="heading2xl" as="p">
                    {data.summary.totalNotified}
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Customers who received alerts
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">
                    Revenue Recovered
                  </Text>
                  <Text variant="heading2xl" as="p">
                    ${data.summary.totalRecoveredRevenue.toLocaleString()}
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    From converted customers
                  </Text>
                </BlockStack>
              </Card>
            </InlineStack>

            {/* Limit Warning Banner */}
            {plan &&
              plan.notificationsUsedThisMonth >= plan.monthlyNotifyLimit && (
                <Card>
                  <Banner tone="warning">
                    Monthly notification limit reached ({plan.notificationsUsedThisMonth}/
                    {plan.monthlyNotifyLimit}). Upgrade to Pro for unlimited notifications.
                  </Banner>
                </Card>
              )}

            {/* Waitlist Table */}
            {data.waitlist.length === 0 ? (
              <Card>
                <EmptyState
                  heading="No waitlist entries"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text variant="bodyMd" as="p">
                    No customers have requested to be notified for this product yet.
                  </Text>
                </EmptyState>
              </Card>
            ) : (
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Customer Waitlist
                  </Text>
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                    headings={['Customer', 'Channel', 'Status', 'Requested', 'Revenue', 'Actions']}
                    rows={rows}
                  />
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
    </Frame>
  );
}

