export interface DashboardData {
  metrics: {
    productsWithDemand: number;
    buyersWaiting: number;
    revenueRecovered: number;
  };
  products: ProductWithDemand[];
}

export interface ProductWithDemand {
  id: string;
  title: string;
  imageUrl?: string;
  waiting: number;
  notified: number;
  recoveredRevenue: number;
  revenueOpportunity: number;
  restockPriority: 'ASAP' | 'SOON';
}

