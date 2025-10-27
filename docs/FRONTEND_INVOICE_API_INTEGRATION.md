# Invoice Email API Integration Guide

## Tổng quan

Tài liệu này mô tả cách tích hợp API gửi email hóa đơn điện tử vào frontend Taskie. API sẽ tự động gửi email hóa đơn sau khi người dùng thanh toán subscription thành công.

## API Endpoint

### Base URL
```
Production: https://your-api-domain.com/api
Development: http://localhost:3000/api
```

### Endpoint
```
POST /api/payments/send-invoice
```

### Authentication
**Required**: Bearer Token trong header `Authorization`

```
Authorization: Bearer <access_token>
```

## Request Format

### Headers
```typescript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>"
}
```

### Request Body
```typescript
{
  orderId: string;        // Unique order ID (e.g., "taskie-1698384000000")
  planId: string;         // Plan ID (e.g., "monthly")
  planName: string;       // Plan name (e.g., "Gói Premium")
  amount: number;         // Payment amount
  currency: string;       // Currency code (e.g., "VND")
  paymentMethod: string; // Payment method (e.g., "Momo")
  transactionDate: string; // ISO 8601 timestamp (e.g., "2025-10-27T10:30:00Z")
  userEmail: string;     // User email address
  userName: string;       // User full name
}
```

### Example Request
```json
{
  "orderId": "taskie-1698384000000",
  "planId": "monthly",
  "planName": "Gói Premium",
  "amount": 30000,
  "currency": "VND",
  "paymentMethod": "Momo",
  "transactionDate": "2025-10-27T10:30:00Z",
  "userEmail": "user@example.com",
  "userName": "Nguyen Van A"
}
```

## Response Format

### Success Response (200 OK)
```typescript
{
  success: true;
  message: "Invoice sent successfully";
  timestamp: string; // ISO 8601 timestamp
}
```

**Example:**
```json
{
  "success": true,
  "message": "Invoice sent successfully",
  "timestamp": "2025-10-27T10:30:15Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "path": "orderId",
      "message": "Order ID không được để trống",
      "code": "too_small"
    }
  ]
}
```

#### 401 Unauthorized - Invalid/Missing Token
```json
{
  "message": "Unauthorized"
}
```

#### 500 Internal Server Error - Server Error
```json
{
  "success": false,
  "error": "Failed to send invoice email",
  "timestamp": "2025-10-27T10:30:15Z"
}
```

## Frontend Integration

### TypeScript Types

```typescript
interface InvoiceRequest {
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

interface InvoiceResponse {
  success: boolean;
  message: string;
  timestamp: string;
}
```

### Integration Example

```typescript
// src/services/paymentService.ts

import api from './api'; // Your API instance with interceptor

export const sendInvoice = async (data: InvoiceRequest): Promise<InvoiceResponse> => {
  try {
    const response = await api.post('/payments/send-invoice', data);
    return response.data;
  } catch (error) {
    console.error('Failed to send invoice:', error);
    throw error;
  }
};
```

### Usage in Payment Flow

```typescript
// src/features/payment/SubscriptionPage.tsx

import { sendInvoice } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';

const handlePaymentSuccess = async () => {
  setShowPayment(false);
  
  // Save premium status to localStorage
  localStorage.setItem('taskie_premium_status', 'active');
  localStorage.setItem('taskie_premium_plan', JSON.stringify({
    planId: selectedPlan?.id,
    planName: selectedPlan?.name,
    subscribedAt: new Date().toISOString()
  }));
  
  // Send invoice email
  const invoiceData = {
    orderId: `taskie-${Date.now()}`,
    planId: selectedPlan?.id || '',
    planName: selectedPlan?.name || '',
    amount: selectedPlan?.price || 0,
    currency: 'VND',
    paymentMethod: 'Momo',
    transactionDate: new Date().toISOString(),
    userEmail: user?.email || '',
    userName: user?.name || ''
  };

  try {
    await sendInvoice(invoiceData);
    console.log('✓ Invoice email sent successfully');
  } catch (error) {
    console.error('⚠ Failed to send invoice email:', error);
    // Don't block the flow if email fails
    // You may want to show a notification to the user
  }
  
  setShowSuccess(true);
  
  setTimeout(() => {
    setShowSuccess(false);
    onNavigate('/today');
  }, 2000);
};
```

### Complete React Component Example

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sendInvoice } from '@/services/paymentService';

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface Props {
  selectedPlan: Plan | null;
  showPayment: boolean;
  setShowPayment: (show: boolean) => void;
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
}

export const SubscriptionPage: React.FC<Props> = ({
  selectedPlan,
  showPayment,
  setShowPayment,
  showSuccess,
  setShowSuccess
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePaymentSuccess = async () => {
    try {
      // 1. Hide payment modal
      setShowPayment(false);
      
      // 2. Save premium status to localStorage
      localStorage.setItem('taskie_premium_status', 'active');
      localStorage.setItem('taskie_premium_plan', JSON.stringify({
        planId: selectedPlan?.id,
        planName: selectedPlan?.name,
        subscribedAt: new Date().toISOString()
      }));
      
      // 3. Send invoice email
      if (selectedPlan && user?.email && user?.name) {
        const invoiceData = {
          orderId: `taskie-${Date.now()}`,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: selectedPlan.price,
          currency: 'VND',
          paymentMethod: 'Momo',
          transactionDate: new Date().toISOString(),
          userEmail: user.email,
          userName: user.name
        };

        try {
          await sendInvoice(invoiceData);
          console.log('✓ Invoice email sent successfully');
        } catch (error) {
          console.error('⚠ Failed to send invoice email:', error);
          // Optionally show toast notification
          // toast.error('Could not send invoice email');
        }
      }
      
      // 4. Show success message
      setShowSuccess(true);
      
      // 5. Navigate to today page after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/today');
      }, 2000);
      
    } catch (error) {
      console.error('Payment success handler error:', error);
      // Show error notification
    }
  };

  return (
    <div>
      {/* Your payment UI */}
      <button onClick={handlePaymentSuccess}>
        Complete Payment
      </button>
    </div>
  );
};
```

## Error Handling

### Recommended Error Handling

```typescript
const sendInvoiceWithRetry = async (
  data: InvoiceRequest, 
  maxRetries = 3
): Promise<void> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendInvoice(data);
      return; // Success
    } catch (error) {
      lastError = error as Error;
      console.warn(`Invoice send attempt ${attempt} failed:`, error);
      
      // Don't retry on 401 or 400 errors
      if (error?.response?.status === 401 || error?.response?.status === 400) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // All retries failed
  throw lastError;
};
```

### User Notification

```typescript
import { toast } from 'react-toastify'; // or your notification library

const sendInvoiceWithToast = async (data: InvoiceRequest) => {
  try {
    await sendInvoice(data);
    toast.success('Hóa đơn đã được gửi đến email của bạn');
  } catch (error) {
    toast.warning('Không thể gửi email hóa đơn. Vui lòng kiểm tra email hoặc liên hệ hỗ trợ.');
  }
};
```

## Testing

### Test the API with curl

```bash
curl -X POST http://localhost:3000/api/payments/send-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "orderId": "taskie-test-123",
    "planId": "monthly",
    "planName": "Gói Premium",
    "amount": 30000,
    "currency": "VND",
    "paymentMethod": "Momo",
    "transactionDate": "2025-10-27T10:30:00Z",
    "userEmail": "test@example.com",
    "userName": "Test User"
  }'
```

### Expected Behavior

1. **On Success**: Email is sent to user's email address with invoice details
2. **Email Content**: 
   - Customer information
   - Order details (order ID, plan name, amount, payment method, date)
   - VAT breakdown (10% VAT included)
   - Company information
3. **Non-blocking**: If email fails, payment flow should continue normally

## Important Notes

1. **Non-blocking**: Invoice email sending should not block the payment success flow
2. **Error handling**: Email failures should be logged but not shown as critical errors to users
3. **Retry logic**: Consider implementing retry logic for better reliability
4. **User data**: Ensure user email and name are available from auth context before sending invoice
5. **Order ID**: Generate unique order IDs (e.g., timestamp-based)

## Environment Configuration

Make sure these environment variables are set in backend `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Taskie <noreply@taskie.com>
```

## Support

Nếu có vấn đề khi tích hợp, vui lòng liên hệ:
- Backend Team Lead
- Frontend Team Lead

## Changelog

### Version 1.0.0 (2025-10-27)
- Initial implementation
- Support for invoice email sending
- VAT calculation (10%)
- Vietnamese email template

