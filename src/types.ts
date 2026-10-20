export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
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
}
