# Backend Email Invoice API Request

## Tổng quan

Tài liệu này mô tả yêu cầu phát triển endpoint để gửi email hóa đơn điện tử cho khách hàng sau khi thanh toán subscription thành công.

## Mục đích

Sau khi người dùng hoàn thành thanh toán subscription thành công, hệ thống cần tự động gửi email hóa đơn điện tử chứa đầy đủ thông tin thanh toán và thông tin khách hàng.

## API Specification

### Endpoint Details

- **Method**: `POST`
- **Path**: `/api/payments/send-invoice`
- **Authentication**: Required (Bearer token trong header `Authorization: Bearer <token>`)
- **Content-Type**: `application/json`

### Request Body

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

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | string | Yes | Mã đơn hàng duy nhất |
| `planId` | string | Yes | ID của gói đăng ký (e.g., "monthly") |
| `planName` | string | Yes | Tên gói đăng ký |
| `amount` | number | Yes | Số tiền thanh toán |
| `currency` | string | Yes | Mã tiền tệ (VND) |
| `paymentMethod` | string | Yes | Phương thức thanh toán (Momo) |
| `transactionDate` | string | Yes | ISO 8601 timestamp của giao dịch |
| `userEmail` | string | Yes | Email người nhận hóa đơn |
| `userName` | string | Yes | Tên người dùng |

### Success Response (200)

```json
{
  "success": true,
  "message": "Invoice sent successfully",
  "timestamp": "2025-10-27T10:30:15Z"
}
```

### Error Responses

**400 Bad Request** - Invalid request data
```json
{
  "success": false,
  "error": "Missing required field: userEmail",
  "timestamp": "2025-10-27T10:30:15Z"
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "error": "Unauthorized",
  "timestamp": "2025-10-27T10:30:15Z"
}
```

**500 Internal Server Error** - Server error
```json
{
  "success": false,
  "error": "Failed to send invoice email",
  "timestamp": "2025-10-27T10:30:15Z"
}
```

## Email Template Requirements

### Format
- **Type**: HTML email
- **Layout**: Responsive, mobile-friendly
- **Language**: Tiếng Việt

### Content Structure

#### 1. Header
- Taskie logo
- Tiêu đề: "HÓA ĐƠN ĐIỆN TỬ"

#### 2. Thông tin khách hàng
- Họ và tên
- Email
- Mã khách hàng (nếu có)

#### 3. Chi tiết đơn hàng
- Mã đơn hàng
- Tên gói subscription
- Phương thức thanh toán
- Ngày thanh toán
- Số tiền: **30000 VND** (highlighted)
- Trạng thái: Đã thanh toán thành công

#### 4. Thông tin công ty
- Tên công ty: Taskie
- Địa chỉ công ty
- Số điện thoại liên hệ
- Email hỗ trợ
- Mã số thuế (MST) - nếu có

#### 5. Thông tin thuế
- Giá chưa thuế: 27,273 VND
- Thuế VAT (10%): 2,727 VND  
- Tổng cộng: 30,000 VND

*Note: VAT calculation là ví dụ, backend cần xác nhận với phòng kế toán*

#### 6. Footer
- Điều khoản và điều kiện
- Thông tin hỗ trợ
- "Đây là email tự động, vui lòng không trả lời"

### Design Guidelines
- Professional, clean design
- Brand colors consistent với Taskie (blue/indigo scheme)
- Proper spacing and typography
- Call-to-action buttons styled appropriately
- Mobile responsive breakpoints

## Email Template Example HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hóa đơn điện tử Taskie</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <!-- Header with Logo -->
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <img src="[TASKIE_LOGO_URL]" alt="Taskie" style="max-width: 150px; height: auto;">
    <h1 style="color: white; margin: 10px 0;">HÓA ĐƠN ĐIỆN TỬ</h1>
  </div>

  <!-- Customer Info -->
  <div style="background: #f8f9fa; padding: 20px; margin-top: 20px; border-radius: 5px;">
    <h2 style="margin-top: 0;">Thông tin khách hàng</h2>
    <p><strong>Họ và tên:</strong> {userName}</p>
    <p><strong>Email:</strong> {userEmail}</p>
  </div>

  <!-- Order Details -->
  <div style="margin-top: 20px;">
    <h2>Chi tiết đơn hàng</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Mã đơn hàng:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">{orderId}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Gói đăng ký:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">{planName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phương thức thanh toán:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">{paymentMethod}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Ngày thanh toán:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">{transactionDate}</td>
      </tr>
      <tr style="background: #e3f2fd;">
        <td style="padding: 10px;"><strong>Tổng tiền:</strong></td>
        <td style="padding: 10px; font-size: 18px; color: #1976d2;"><strong>{amount} {currency}</strong></td>
      </tr>
    </table>
  </div>

  <!-- Company Info -->
  <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
    <h3>Thông tin công ty</h3>
    <p><strong>Công ty:</strong> Taskie</p>
    <p><strong>Địa chỉ:</strong> [Cần cung cấp]</p>
    <p><strong>Email:</strong> support@taskie.com</p>
    <p><strong>Điện thoại:</strong> [Cần cung cấp]</p>
    <p><strong>MST:</strong> [Cần cung cấp]</p>
  </div>

  <!-- Footer -->
  <div style="margin-top: 30px; padding: 20px; text-align: center; color: #666; font-size: 12px;">
    <p>Cảm ơn bạn đã sử dụng dịch vụ Taskie Premium!</p>
    <p>Nếu có thắc mắc, vui lòng liên hệ support@taskie.com</p>
    <p style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
      Đây là email tự động, vui lòng không trả lời.
    </p>
  </div>
</body>
</html>
```

## Frontend Integration

### Trigger Point

Frontend sẽ gọi API này ngay sau khi nhận confirmation thanh toán thành công từ payment gateway, trong hàm `handlePaymentSuccess()` trong file `src/features/payment/SubscriptionPage.tsx`.

### Integration Code

```typescript
// src/features/payment/SubscriptionPage.tsx

const handlePaymentSuccess = async () => {
  setShowPayment(false);
  
  // Save premium status to localStorage
  localStorage.setItem('taskie_premium_status', 'active');
  localStorage.setItem('taskie_premium_plan', JSON.stringify({
    planId: selectedPlan?.id,
    planName: selectedPlan?.name,
    subscribedAt: new Date().toISOString()
  }));
  
  // Call backend API to send invoice email
  try {
    const orderId = `taskie-${Date.now()}`;
    await api.post('/payments/send-invoice', {
      orderId,
      planId: selectedPlan?.id,
      planName: selectedPlan?.name,
      amount: selectedPlan?.price,
      currency: 'VND',
      paymentMethod: 'Momo',
      transactionDate: new Date().toISOString(),
      userEmail: user?.email, // Get from auth context
      userName: user?.name    // Get from auth context
    });
    console.log('Invoice email sent successfully');
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    // Don't block the flow if email fails
  }
  
  setShowSuccess(true);
  
  setTimeout(() => {
    setShowSuccess(false);
    onNavigate('/today');
  }, 2000);
};
```

### Required Data from Auth Context

Frontend cần lấy từ auth context:
- `user?.email` - Email người dùng đã đăng nhập
- `user?.name` - Tên người dùng đã đăng nhập

## Backend Implementation Notes

### Email Service Requirements

1. **Email Provider**: Sử dụng email service provider (SendGrid, AWS SES, hoặc tương đương)
2. **Retry Logic**: Implement retry mechanism nếu gửi email lần đầu thất bại
3. **Async Processing**: Nên process email sending async để không block API response
4. **Logging**: Log đầy đủ để track email delivery status

### Security Considerations

1. **Rate Limiting**: Implement rate limiting để tránh spam
2. **Input Validation**: Validate tất cả input fields
3. **Email Verification**: Verify email format trước khi gửi
4. **Sanitization**: Sanitize user input để tránh injection attacks

### Error Handling

Backend cần handle các trường hợp:
- Email service unavailable
- Invalid email address
- SMTP errors
- Rate limit exceeded

### Logging Requirements

Log các events sau:
- Email sent successfully
- Email failed to send
- Retry attempts
- Email bounce/complaint

## Testing Requirements

### Test Cases

1. **Happy Path**: Valid request với đầy đủ data → Email được gửi thành công
2. **Missing Field**: Missing required field → Return 400 error
3. **Invalid Email**: Invalid email format → Return 400 error
4. **Unauthorized**: Missing/invalid auth token → Return 401 error
5. **Email Service Down**: Email service unavailable → Return 500 error, log error

### Integration Testing

- Test với real email service in staging environment
- Verify email delivery to test email accounts
- Verify email HTML rendering across different email clients

## Deployment Checklist

- [ ] Email service credentials configured
- [ ] Email template reviewed và approved
- [ ] Company information filled in template
- [ ] VAT calculation confirmed với phòng kế toán
- [ ] Rate limiting configured
- [ ] Monitoring và alerting set up
- [ ] Logging configured
- [ ] Error handling tested

## Open Questions for Backend Team

1. **Email Service**: Email service provider nào sẽ được sử dụng?
2. **Company Information**: 
   - Địa chỉ công ty chính xác là gì?
   - Số điện thoại liên hệ?
   - Email hỗ trợ chính thức?
   - Mã số thuế (MST)?
3. **VAT**: 
   - Có áp dụng VAT không?
   - Tỷ lệ VAT là bao nhiêu?
4. **Email Domain**: 
   - Email sẽ được gửi từ domain nào?
   - Sender name là gì?
5. **Retry Policy**: 
   - Số lần retry?
   - Retry interval?
6. **Monitoring**: 
   - Cần implement alerting cho failed emails?
   - Dashboard cho tracking email delivery?

## Timeline

- **Review & Approval**: [Date TBD]
- **Backend Development**: [Date TBD]
- **Testing**: [Date TBD]
- **Staging Deployment**: [Date TBD]
- **Production Deployment**: [Date TBD]

## Contact

Nếu có câu hỏi hoặc cần clarification, vui lòng liên hệ:
- Frontend Team Lead
- Backend Team Lead
