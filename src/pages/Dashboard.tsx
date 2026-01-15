import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Text,
  Badge,
  Button,
  InlineStack,
  BlockStack,
  EmptyState,
} from '@shopify/polaris';
import { ViewIcon } from '@shopify/polaris-icons';
import { api } from '../api/client';
import type { DashboardData } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Page title="Dashboard">Loading...</Page>;
  }

  if (!data) {
    return <Page title="Dashboard">Failed to load dashboard data</Page>;
  }

  // Check if there's no demand data
  const hasNoDemand = data.metrics.productsWithDemand === 0 && data.products.length === 0;

  const rows = data.products.map((product) => [
    (
      <InlineStack key={`product-${product.id}`} gap="200" align="start">
        <img
          src={product.imageUrl || '/placeholder.png'}
          alt={product.title}
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'cover',
            borderRadius: '4px',
          }}
        />
        <Text variant="bodyMd" as="p" fontWeight="medium">
          {product.title}
        </Text>
      </InlineStack>
    ) as any,
    product.waiting.toString(),
    product.notified.toString(),
    `$${product.recoveredRevenue.toLocaleString()}`,
    `$${product.revenueOpportunity.toLocaleString()}`,
    (
      <InlineStack key={`priority-${product.id}`} gap="200">
        <Badge tone={product.restockPriority === 'ASAP' ? 'critical' : 'warning'}>
          {`Restock ${product.restockPriority === 'ASAP' ? 'ASAP' : 'Soon'}`}
        </Badge>
        <Button
          variant="plain"
          icon={ViewIcon}
          onClick={() => navigate(`/waitlist/${product.id}`)}
        >
          View waitlist
        </Button>
      </InlineStack>
    ) as any,
  ]);

  return (
    <Page
      title="Dashboard"
      subtitle="Track demand and recover revenue from out-of-stock products"
    >
      <Layout>
        <Layout.Section>
          {hasNoDemand ? (
            <Card>
              <EmptyState
                heading="No demand detected yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                action={{
                  content: 'Preview waitlist widget',
                  onAction: () => {
                    // TODO: Implement preview functionality
                    console.log('Preview waitlist widget');
                  },
                }}
                secondaryAction={{
                  content: 'See how it works',
                  onAction: () => {
                    // TODO: Implement help/documentation
                    console.log('See how it works');
                  },
                }}
              >
                <Text variant="bodyMd" as="p">
                  We'll automatically track customers who request out-of-stock products.
                </Text>
              </EmptyState>
            </Card>
          ) : (
            <BlockStack gap="400">
              {/* Key Metrics Cards */}
              <InlineStack gap="400">
                <Card>
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="start">
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#FF7F00',
                          marginTop: '6px',
                        }}
                      />
                      <Text variant="headingMd" as="h3">
                        Products with Demand
                      </Text>
                    </InlineStack>
                    <Text variant="heading2xl" as="p">
                      {data.metrics.productsWithDemand}
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Out-of-stock products customers want right now.
                    </Text>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingMd" as="h3">
                      Buyers Waiting
                    </Text>
                    <Text variant="heading2xl" as="p">
                      {data.metrics.buyersWaiting}
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Customers ready to purchase once restocked.
                    </Text>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingMd" as="h3">
                      Revenue Recovered
                    </Text>
                    <Text variant="heading2xl" as="p">
                      ${data.metrics.revenueRecovered.toLocaleString()}
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Confirmed sales from restock alerts
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="p">
                      From notified waitlists
                    </Text>
                  </BlockStack>
                </Card>
              </InlineStack>

              {/* Products with Demand Table */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    Products with Demand
                  </Text>
                  <DataTable
                    columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'numeric', 'text']}
                    headings={[
                      'PRODUCT',
                      'WAITING',
                      'NOTIFIED',
                      'RECOVERED REVENUE',
                      'REVENUE OPPORTUNITY',
                      'RESTOCK PRIORITY',
                    ]}
                    rows={rows}
                  />
                </BlockStack>
              </Card>
            </BlockStack>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

