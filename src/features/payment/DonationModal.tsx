import { useState } from 'react';
import { QRPaymentModal } from './QRPaymentModal';

interface DonationModalProps {
  onClose: () => void;
}

export function DonationModal({ onClose }: DonationModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const presetAmounts = [50000, 100000, 200000, 500000];

  const handleDonate = () => {
    const amount = selectedAmount || (customAmount ? parseInt(customAmount) : null);
    if (amount && amount > 0) {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    alert('Cảm ơn bạn đã ủng hộ Taskie! ❤️');
    onClose();
  };

  const displayAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">❤️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Ủng hộ Taskie
          </h2>
          <p className="text-gray-600">
            Giúp chúng tôi duy trì và phát triển ứng dụng
          </p>
        </div>

        {!showPayment ? (
          <>
            <div className="mb-6">
              <p className="text-gray-700 mb-3 font-medium">Chọn số tiền (VNĐ)</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      selectedAmount === amount
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {amount.toLocaleString('vi-VN')} ₫
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Hoặc nhập số tiền tùy ý"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleDonate}
                disabled={!selectedAmount && !customAmount}
                className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Ủng hộ
              </button>
            </div>
          </>
        ) : (
          <QRPaymentModal
            amount={displayAmount}
            description="Ủng hộ phát triển Taskie"
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
          />
        )}
      </div>
    </div>
  );
}

