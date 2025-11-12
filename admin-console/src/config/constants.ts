export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_VERSION = '/api/v1';
export const API_URL = `${API_BASE_URL}${API_VERSION}`;

export const TOKEN_KEY = 'munda_admin_token';
export const REFRESH_TOKEN_KEY = 'munda_admin_refresh_token';
export const USER_KEY = 'munda_admin_user';

export const APP_NAME = 'Munda Market';
export const APP_DESCRIPTION = 'Digital marketplace for fresh produce';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  FARMERS: '/farmers',
  BUYERS: '/buyers',
  ORDERS: '/orders',
  INVENTORY: '/inventory',
  PRICING: '/pricing',
  PAYMENTS: '/payments',
  PAYOUTS: '/payouts',
  MESSAGING: '/messaging',
  AUDIT_LOGS: '/audit-logs',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  KYC: '/kyc',
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  OPS: 'OPS',
  FINANCE: 'FINANCE',
} as const;

export const USER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
} as const;

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  ALLOCATED: 'ALLOCATED',
  DISPATCHED: 'DISPATCHED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  QC_PASSED: 'QC_PASSED',
  QC_FAILED: 'QC_FAILED',
} as const;

