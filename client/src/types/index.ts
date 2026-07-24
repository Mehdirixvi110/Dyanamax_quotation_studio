// ===== Base Types =====

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

// ===== Cost Library =====

export interface Category {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RateTier {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  rateTierId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  name: string;
  fullName: string | null;
  createdAt: string;
}

export interface ItemRate {
  id: string;
  itemId: string;
  rateTierId: string;
  brandId: string | null;
  rate: number;
  isActive: boolean;
  rateTier?: RateTier;
  brand?: Brand;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  unitId: string;
  isActive: boolean;
  category?: Category;
  unit?: Unit;
  rates?: ItemRate[];
  createdAt: string;
  updatedAt: string;
}

// ===== Customers =====

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Quotations =====

export type QuotationStatus =
  | 'draft'
  | 'published'
  | 'client_viewed'
  | 'client_submitted'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'archived';

export interface Quotation {
  id: string;
  referenceNumber: string;
  title: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  currencyId: string;
  status: QuotationStatus;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  taxPercent: number;
  taxApplication: 'on_total' | 'on_line_items' | 'none';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  notes: string | null;
  termsAndConditions: string | null;
  expiryDays: number;
  publishedAt: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  currentVersion: number;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  itemId: string | null;
  title: string;
  description: string | null;
  unitName: string;
  quantity: number;
  sortOrder: number;
  isSelected: boolean;
  rates?: QuotationItemRate[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItemRate {
  id: string;
  quotationItemId: string;
  rateTierId: string;
  brandId: string | null;
  brandName: string | null;
  rate: number;
  isSelected: boolean;
  createdAt: string;
}

// ===== Settings =====

export interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  logoUrl: string | null;
  stampUrl: string | null;
  signatureUrl: string | null;
  defaultCurrency: string;
  defaultTaxPercent: number;
  defaultExpiryDays: number;
  termsAndConditions: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Dashboard =====

export interface DashboardStats {
  totalQuotations: number;
  totalItems: number;
  totalCustomers: number;
  totalRevenue: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  conversionRate: number;
}

export interface MonthlyActivity {
  month: string;
  quotations: number;
  revenue: number;
}
