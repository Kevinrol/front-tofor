export interface ProductItem {
  id: string;
  name: string;
  description: string;
  stock: number;
  wholesalePrice: number | null;
  discountPercent: number | null;
  finalPrice: number;
  salesCount: number;
  status: 'in_stock' | 'low_stock' | 'almost_out';
  category: string;
  iconType: 'notebook' | 'pencil' | 'backpack' | 'case' | 'compass';
}

export interface MonthData {
  month: string;
  shortMonth: string;
  salesUnits: number;
  stockEntries: number;
  percentageBadge?: number;
  campaignInfo?: {
    name: string;
    sales: number;
    exchanges: number;
  };
}

export interface DayRevenue {
  day: string;
  amount: number;
  segments: number; // visual stack height 1-6
  isHighlighted?: boolean;
}

export interface CategoryShare {
  id: string;
  name: string;
  percentage: number;
  color: string;
}

export interface SchoolStageData {
  id: string;
  stage: string;
  percentage: number;
  color: string;
}
