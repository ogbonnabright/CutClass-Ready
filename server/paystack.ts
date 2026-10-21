import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export const paystackService = {
  isConfigured(): boolean {
    return Boolean(PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_'));
  },

  /**
   * Initializes a transaction with Paystack API
   * Endpoint: POST https://api.paystack.co/transaction/initialize
   */
  async initializeTransaction(params: {
    email: string;
    amountKobo: number; // Amount in Kobo (e.g. ₦28,000 = 2,800,000 Kobo)
    planId: string;
    memberId: string;
    callbackUrl?: string;
  }): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    if (!this.isConfigured()) {
      // In sandbox/development when PAYSTACK_SECRET_KEY is not set:
      const mockRef = `pstk_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        authorization_url: `https://checkout.paystack.com/mock/${mockRef}`,
        access_code: `mock_code_${mockRef}`,
        reference: mockRef,
      };
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        currency: 'NGN',
        callback_url: params.callbackUrl,
        metadata: {
          planId: params.planId,
          memberId: params.memberId,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Failed to initialize Paystack payment.');
    }

    return data.data;
  },

  /**
   * Genuine Paystack verification
   * Endpoint: GET https://api.paystack.co/transaction/verify/:reference
   */
  async verifyTransaction(reference: string): Promise<{
    verified: boolean;
    status: string;
    amount: number;
    currency: string;
    customerEmail: string;
    channel: string;
    planId?: string;
    memberId?: string;
  }> {
    if (!reference) {
      throw new Error('Transaction reference is required for Paystack verification.');
    }

    // If live Paystack secret key is configured, call official verification API
    if (this.isConfigured()) {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Payment verification failed at Paystack gateway.');
      }

      const tx = data.data;
      const isSuccessful = tx.status === 'success';

      return {
        verified: isSuccessful,
        status: tx.status,
        amount: tx.amount / 100, // Convert from Kobo to Naira
        currency: tx.currency,
        customerEmail: tx.customer?.email || '',
        channel: tx.channel || 'card',
        planId: tx.metadata?.planId,
        memberId: tx.metadata?.memberId,
      };
    }

    // In local test mode without secret key, reject invalid references, only allow explicit test references
    if (reference.startsWith('pstk_test_')) {
      return {
        verified: true,
        status: 'success',
        amount: 28000,
        currency: 'NGN',
        customerEmail: 'test@cutclass.app',
        channel: 'card',
      };
    }

    throw new Error(
      'Paystack API secret key is not configured in backend environment (.env PAYSTACK_SECRET_KEY=sk_test_...). Live transaction cannot be verified.'
    );
  },

  /**
   * Verify Webhook Signature using HMAC SHA512
   */
  verifyWebhookSignature(rawBody: string, signatureHeader?: string): boolean {
    if (!this.isConfigured()) return true;
    if (!signatureHeader) return false;

    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    return hash === signatureHeader;
  },
};
