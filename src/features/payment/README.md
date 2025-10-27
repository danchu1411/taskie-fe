# Payment Features

## 📁 Files Overview

- `QRPaymentModal.tsx` - Reusable modal component với QR code
- `SubscriptionPage.tsx` - Trang subscription plans
- `DonationModal.tsx` - Modal cho donation/tipping

## 🎯 Quick Start

```tsx
// Use QR Payment Modal
import { QRPaymentModal } from './QRPaymentModal';

<QRPaymentModal
  amount={99000}
  description="Premium subscription"
  onSuccess={() => console.log('Success!')}
  onCancel={() => setShowModal(false)}
/>
```

```tsx
// Use Donation Modal
import { DonationModal } from './DonationModal';

<DonationModal onClose={() => setShowModal(false)} />
```

## 🎨 Props

### QRPaymentModal

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | number | ✅ | Số tiền thanh toán (VNĐ) |
| `description` | string | ✅ | Mô tả giao dịch |
| `onSuccess` | () => void | ✅ | Callback khi thanh toán thành công |
| `onCancel` | () => void | ✅ | Callback khi hủy thanh toán |
| `onPaymentComplete` | () => void | ❌ | Optional callback sau khi hiển thị success |

### DonationModal

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClose` | () => void | ✅ | Callback khi đóng modal |

## 🔄 Payment Flow

```
User clicks "Thanh toán"
    ↓
QRPaymentModal opens
    ↓
User clicks "Xác nhận"
    ↓
Processing (3s)
    ↓
Success screen
    ↓
onSuccess() called
```

## 🎭 Customization Examples

### Change Processing Time

```tsx
// In QRPaymentModal.tsx
setTimeout(() => {
  setIsProcessing(false);
  // ...
}, 5000); // 5s instead of 3s
```

### Change Button Colors

```tsx
// Replace bg-green-600 with your color
className="bg-purple-600 hover:bg-purple-700"
```

### Remove QR Code (Keep Only Amount Form)

Remove this section:
```tsx
<div className="bg-gray-50 rounded-lg p-4 mb-6 flex justify-center">
  <QRCode value={qrValue} size={200} level="H" />
</div>
```

## 🚀 Production Ready Checklist

- [ ] Integrate real payment gateway
- [ ] Add webhook handlers
- [ ] Add invoice generation
- [ ] Add payment history page
- [ ] Add refund functionality
- [ ] Add subscription management
- [ ] Add payment retry logic
- [ ] Add customer support integration

