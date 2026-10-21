export interface PaymentMethodSummary {
  brand: 'mastercard' | 'visa' | 'verve' | 'card';
  last4: string;
  expMonth: string;
  expYear: string;
  cardholderName?: string;
  bank?: string;
}

export interface UserSubscription {
  planId: string;
  planName: string;
  price: string;
  priceNum: number;
  period: string;
  credits: number;
  status: 'active' | 'trialing' | 'canceled';
  activatedAt: string;
  nextBillingDate: string;
  paymentMethod: PaymentMethodSummary;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  haircutCredits?: number;
  subscription?: UserSubscription | null;
}

export interface Plan {
  id: string;
  number: string;
  name: string;
  credits: number;
  price: string;
  priceNum: number;
  period: string;
  description: string;
  badge?: string;
  isPopular?: boolean;
  features?: string[];
}
