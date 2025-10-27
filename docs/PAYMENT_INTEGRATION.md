# Hệ thống Thanh toán QR Code (Mock/Fake)

## 📋 Tổng quan

Hệ thống thanh toán QR đã được tích hợp vào Taskie với tính năng fake/mock để demo và testing. Tính năng này cho phép bạn:

1. **Hiển thị QR code thanh toán** cho subscription hoặc donation
2. **Mô phỏng quy trình thanh toán** với loading states
3. **Hiển thị success screen** sau khi "thanh toán"
4. **Hoàn toàn fake** - không thực sự thu tiền

## 🎯 Các tính năng đã triển khai

### 1. QR Payment Modal
- **File**: `src/features/payment/QRPaymentModal.tsx`
- Component modal hiển thị QR code và form thanh toán
- Tích hợp với QRCode.react để tạo QR code
- Animation với Framer Motion
- 3 trạng thái: Ready → Processing → Success

### 2. Subscription Page
- **File**: `src/features/payment/SubscriptionPage.tsx`
- Trang hiển thị các gói premium
- 3 gói: Gói Tháng, Gói Năm, Gói Trọn Đời
- Tích hợp QR payment modal
- Route: `/subscription`

### 3. Donation Modal
- **File**: `src/features/payment/DonationModal.tsx`
- Modal cho phép ủng hộ Taskie
- 4 preset amounts hoặc custom amount
- Tích hợp QR payment modal

## 🚀 Cách sử dụng

### 1. Truy cập trang Subscription
```
http://localhost:5173/subscription
```
Hoặc từ Settings page → click "Xem các gói Premium"

### 2. Kích hoạt Donation Modal
Từ Settings page → click "❤️ Ủng hộ Taskie"

### 3. Flow thanh toán:
1. User chọn gói/mức ủng hộ
2. Modal hiển thị QR code và thông tin thanh toán
3. Click "Xác nhận" → loading 3 giây
4. Hiển thị success screen
5. Callback được gọi để update state

## 💡 Code Examples

### Sử dụng QRPaymentModal trực tiếp:

```tsx
import { QRPaymentModal } from './features/payment/QRPaymentModal';

function MyPage() {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <>
      <button onClick={() => setShowPayment(true)}>
        Thanh toán
      </button>
      
      {showPayment && (
        <QRPaymentModal
          amount={99000}
          description="Thanh toán gói premium"
          onSuccess={() => {
            setShowPayment(false);
            alert('Thanh toán thành công!');
          }}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </>
  );
}
```

### Custom Donation:

```tsx
import { DonationModal } from './features/payment/DonationModal';

function MyPage() {
  const [showDonation, setShowDonation] = useState(false);

  return (
    <>
      <button onClick={() => setShowDonation(true)}>
        Ủng hộ
      </button>
      
      {showDonation && (
        <DonationModal onClose={() => setShowDonation(false)} />
      )}
    </>
  );
}
```

## 🔧 Configuration

### Customize Payment Amounts

Mở file `SubscriptionPage.tsx` và thay đổi prices:

```tsx
const plans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Gói Tháng',
    price: 99000, // <-- Đổi giá ở đây
    duration: 'Tháng',
    features: [...]
  }
];
```

### Customize Donation Amounts

Mở file `DonationModal.tsx` và thay đổi preset amounts:

```tsx
const presetAmounts = [50000, 100000, 200000, 500000]; // <-- Đổi ở đây
```

### Thay đổi Processing Time

Trong `QRPaymentModal.tsx`:

```tsx
setTimeout(() => {
  setIsProcessing(false);
  setShowSuccess(true);
  // ...
}, 3000); // <-- Thay đổi 3000 (3s) thành số bạn muốn (ms)
```

## 🎨 Customization

### Thay đổi QR Code size
```tsx
<QRCode value={qrValue} size={200} level="H" />
//                        ^^^^^ Thay đổi ở đây
```

### Thay đổi màu sắc buttons
```tsx
className="bg-green-600 hover:bg-green-700"
//         ^^^^^^^^^^^^^ Thay đổi màu ở đây
```

### Thay đổi animation timing
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.3 }} // <-- Thay đổi ở đây
```

## 📦 Dependencies đã cài đặt

```json
{
  "qrcode.react": "^3.x.x",
  "@types/qrcode.react": "^3.x.x"
}
```

## 🔐 Bảo mật lưu ý

- ⚠️ Hệ thống này chỉ là **FAKE/MOCK** - không thực sự thu tiền
- ⚠️ Chỉ dùng cho **testing/demo purposes**
- ⚠️ Khi triển khai production, bạn cần:
  1. Tích hợp với payment gateway thực (Momo, VNPay, Stripe, v.v.)
  2. Xử lý webhook callbacks
  3. Verify payment transactions
  4. Update subscription status trong database

## 🚀 Next Steps cho Production

### 1. Tích hợp với Payment Gateway

#### Ví dụ với Stripe:
```tsx
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_your_key');

const handleRealPayment = async () => {
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: 'price_id', quantity: 1 }],
    mode: 'subscription',
    successUrl: `${window.location.origin}/success`,
    cancelUrl: `${window.location.origin}/cancel`,
  });
};
```

#### Ví dụ với VNPay:
```tsx
import crypto from 'crypto';

const generateVNPayUrl = (amount: number) => {
  const params = {
    vnp_Amount: amount * 100,
    vnp_Command: 'pay',
    vnp_CreateDate: new Date().toISOString(),
    vnp_CurrCode: 'VND',
    vnp_Locale: 'vn',
    vnp_OrderInfo: 'Premium Subscription',
    vnp_ReturnUrl: `${BASE_URL}/payment/callback`,
    vnp_TmnCode: 'YOUR_TMN_CODE',
    vnp_TxnRef: generateRandomRef(),
  };
  
  // Generate secure hash
  const signData = queryString.stringify(params);
  const hmac = crypto.createHmac('sha512', VNPAY_SECRET);
  const signed = hmac.update(signData).digest('hex');
  
  return `${VNPAY_URL}?${signData}&vnp_SecureHash=${signed}`;
};
```

### 2. Backend Integration

Cần tạo API endpoints:

```
POST /api/payments/create
GET  /api/payments/:paymentId/status
POST /api/payments/callback
GET  /api/subscription/status
```

### 3. Update User Status

Sau khi thanh toán thành công, gọi API:

```tsx
await api.patch('/api/users/subscription', {
  subscriptionStatus: 'active',
  subscriptionType: 'premium',
  subscriptionEndsAt: calculateEndDate(),
});
```

## 📝 Files tổng hợp

```
src/
  features/
    payment/
      ├── QRPaymentModal.tsx      # Modal thanh toán với QR
      ├── SubscriptionPage.tsx     # Trang chọn gói subscription
      └── DonationModal.tsx        # Modal donation
```

## 🎭 Demo

1. Start dev server: `npm run dev`
2. Login vào app
3. Vào Settings → Click "Xem các gói Premium"
4. Chọn gói → Click "Chọn gói"
5. Xem QR payment modal
6. Click "Xác nhận" và xem animation

## ❓ FAQ

**Q: QR code này có scan được không?**  
A: Có, nhưng vì là fake payment nên không dẫn đến transaction thật.

**Q: Làm sao để tích hợp payment thật?**  
A: Xem section "Next Steps cho Production" ở trên.

**Q: Có thể thay đổi animation không?**  
A: Có, sửa duration và easing trong Framer Motion props.

**Q: Có thể dùng mà không cần QR code không?**  
A: Có, sửa `QRPaymentModal.tsx` và xóa phần QRCode component, chỉ giữ phần form.

## 🤝 Contributing

Nếu bạn muốn cải thiện payment system:
1. Tích hợp webhook handlers
2. Add payment history page
3. Add invoice generation
4. Tích hợp với actual payment gateways

