import apiClient from './client';

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  support_email: string;
  support_phone: string;
  currency: string;
  timezone: string;
  language: string;
}

export interface SecuritySettings {
  session_timeout: number;
  max_login_attempts: number;
  password_min_length: number;
  require_strong_password: boolean;
  two_factor_enabled: boolean;
  ip_whitelist: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  whatsapp_notifications: boolean;
  order_alerts: boolean;
  payout_alerts: boolean;
  kyc_alerts: boolean;
  low_inventory_alerts: boolean;
  daily_reports: boolean;
}

export interface PaymentSettings {
  stripe_live: boolean;
  ecocash_enabled: boolean;
  zipit_enabled: boolean;
  bank_transfer_enabled: boolean;
  min_order_amount: number;
  max_order_amount: number;
  delivery_fee_base: number;
  delivery_fee_per_kg: number;
  service_fee_percentage: number;
}

export interface PricingSettings {
  auto_adjust_pricing: boolean;
  default_markup: number;
  bulk_discount_enabled: boolean;
  price_floor_protection: boolean;
  dynamic_pricing_enabled: boolean;
}

export interface AllSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  payments: PaymentSettings;
  pricing: PricingSettings;
}

export const settingsApi = {
  getAll: async (): Promise<AllSettings> => {
    const response = await apiClient.get<AllSettings>('/admin/settings');
    return response.data;
  },

  getGeneral: async (): Promise<GeneralSettings> => {
    const response = await apiClient.get<GeneralSettings>('/admin/settings/general');
    return response.data;
  },

  updateGeneral: async (settings: GeneralSettings): Promise<void> => {
    await apiClient.put('/admin/settings/general', settings);
  },

  getSecurity: async (): Promise<SecuritySettings> => {
    const response = await apiClient.get<SecuritySettings>('/admin/settings/security');
    return response.data;
  },

  updateSecurity: async (settings: SecuritySettings): Promise<void> => {
    await apiClient.put('/admin/settings/security', settings);
  },

  getNotifications: async (): Promise<NotificationSettings> => {
    const response = await apiClient.get<NotificationSettings>('/admin/settings/notifications');
    return response.data;
  },

  updateNotifications: async (settings: NotificationSettings): Promise<void> => {
    await apiClient.put('/admin/settings/notifications', settings);
  },

  getPayments: async (): Promise<PaymentSettings> => {
    const response = await apiClient.get<PaymentSettings>('/admin/settings/payments');
    return response.data;
  },

  updatePayments: async (settings: PaymentSettings): Promise<void> => {
    await apiClient.put('/admin/settings/payments', settings);
  },

  getPricing: async (): Promise<PricingSettings> => {
    const response = await apiClient.get<PricingSettings>('/admin/settings/pricing');
    return response.data;
  },

  updatePricing: async (settings: PricingSettings): Promise<void> => {
    await apiClient.put('/admin/settings/pricing', settings);
  },

  clearCache: async (): Promise<void> => {
    await apiClient.post('/admin/settings/cache/clear');
  },

  healthCheck: async () => {
    const response = await apiClient.get('/admin/settings/health');
    return response.data;
  },
};

