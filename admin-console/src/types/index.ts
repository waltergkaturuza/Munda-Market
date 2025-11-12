export interface Farm {
  farm_id: number;
  owner_user_id: number;
  farm_name: string;
  location: string;
  total_area_hectares: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  status: string;
  created_at: string;
}

export interface Crop {
  crop_id: number;
  crop_name: string;
  unit: string;
  perishability_days: number;
  base_price_usd_per_kg: number;
  cold_chain_required: boolean;
}

export interface Order {
  order_id: number;
  buyer_user_id: number;
  crop_id: number;
  quantity_kg: number;
  unit_price_usd: number;
  total_amount_usd: number;
  status: string;
  delivery_date?: string;
  created_at: string;
  buyer_name?: string;
  crop_name?: string;
}

export interface Payout {
  payout_id: number;
  farmer_user_id: number;
  amount_usd: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_reference?: string;
  created_at: string;
  processed_at?: string;
  farmer_name?: string;
}

export interface AuditLog {
  audit_id: number;
  user_id?: number;
  action: string;
  entity?: string;
  entity_id?: number;
  description?: string;
  ip_address?: string;
  ts: string;
  user_name?: string;
}

export interface KYCSubmission {
  user_id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  status: string;
  verification_documents?: string;
  created_at: string;
  is_verified: boolean;
}

export interface PricingRule {
  rule_id: number;
  crop_id: number;
  min_quantity_kg?: number;
  max_quantity_kg?: number;
  markup_percentage: number;
  priority: number;
  active: boolean;
  crop_name?: string;
}

export interface Message {
  message_id: number;
  recipient_user_id: number;
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  message_body: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sent_at?: string;
  delivered_at?: string;
  recipient_name?: string;
  recipient_phone?: string;
}

export interface DashboardStats {
  total_farmers: number;
  active_farmers: number;
  total_buyers: number;
  active_buyers: number;
  total_orders: number;
  orders_pending: number;
  orders_in_transit: number;
  orders_delivered_today: number;
  total_revenue_usd: number;
  revenue_this_month_usd: number;
  pending_payouts_usd: number;
  pending_kyc_count: number;
}

