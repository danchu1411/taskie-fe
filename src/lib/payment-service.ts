import api from './api';

export interface InvoiceRequest {
  orderId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate: string;
  userEmail: string;
  userName: string;
}

export interface InvoiceResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Send invoice email to user after successful payment
 * 
 * @param data Invoice request data
 * @returns Promise resolving to invoice response
 * @throws Error if request fails
 */
export async function sendInvoice(data: InvoiceRequest): Promise<InvoiceResponse> {
  try {
    const response = await api.post<InvoiceResponse>('/payments/send-invoice', data);
    return response.data;
  } catch (error: any) {
    // Re-throw with more context
    if (error.response) {
      throw new Error(
        `Failed to send invoice: ${error.response.data?.error || error.response.statusText}`
      );
    } else if (error.request) {
      throw new Error('Failed to send invoice: No response from server');
    } else {
      throw new Error(`Failed to send invoice: ${error.message}`);
    }
  }
}

/**
 * Send invoice email with retry logic
 * 
 * @param data Invoice request data
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @returns Promise resolving to invoice response
 * @throws Error if all retry attempts fail
 */
export async function sendInvoiceWithRetry(
  data: InvoiceRequest,
  maxRetries = 3
): Promise<InvoiceResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendInvoice(data);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Invoice send attempt ${attempt}/${maxRetries} failed:`, error);

      // Don't retry on client errors (400, 401)
      const status = (error as any)?.response?.status;
      if (status === 400 || status === 401) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = 1000 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError || new Error('Failed to send invoice after all retry attempts');
}

/**
 * Create invoice request data from payment details
 * 
 * @param planId Subscription plan ID
 * @param planName Subscription plan name
 * @param amount Payment amount
 * @param userEmail User email address
 * @param userName User name
 * @returns Invoice request data
 */
export function createInvoiceData(
  planId: string,
  planName: string,
  amount: number,
  userEmail: string,
  userName: string
): InvoiceRequest {
  return {
    orderId: `taskie-${Date.now()}`,
    planId,
    planName,
    amount,
    currency: 'VND',
    paymentMethod: 'Momo',
    transactionDate: new Date().toISOString(),
    userEmail,
    userName,
  };
}
