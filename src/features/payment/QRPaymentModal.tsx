import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRPaymentModalProps {
  amount: number;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
  onPaymentComplete?: () => void;
}

export function QRPaymentModal({
  amount,
  description,
  onSuccess,
  onCancel,
  onPaymentComplete,
}: QRPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const orderId = useState(`taskie-${Date.now()}`)[0];

  // Countdown timer
  useEffect(() => {
    if (!isProcessing && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isProcessing]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleFakePayment = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      
      // Call onSuccess directly without showing modal here
      // The subscription page will handle the success modal
      onSuccess();
      onPaymentComplete?.();
    }, 3000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-50"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl max-w-5xl w-full mx-4 overflow-hidden"
        >
          <div className="flex">
            {/* Left Panel - Pink/Magenta Background */}
            <div className="text-white p-8 flex flex-col justify-between" style={{ minWidth: '320px', backgroundColor: '#ab006b' }}>
              {/* Logo */}
              <div className="mb-2">
                <img 
                  src="/images/Momo_logo.jpg" 
                  alt="Momo" 
                  className="h-16 w-auto object-contain"
                />
              </div>

              {/* Order Expiry */}
              <div className="mb-6">
                {isProcessing ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
                    <p className="text-lg">Đang xử lý...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-xs opacity-90 mb-1">Đơn hàng hết hạn sau</div>
                    <div className="text-4xl font-bold tracking-tight">{formatTime(timeLeft)}</div>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/30 mb-4"></div>

              {/* Provider */}
              <div className="mb-4">
                <div className="text-xs opacity-90 mb-1">Nhà cung cấp</div>
                <div className="text-2xl font-bold">TASKIE</div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/30 mb-4"></div>

              {/* Amount */}
              <div className="mb-4">
                <div className="text-xs opacity-90 mb-1">Số tiền</div>
                <div className="text-2xl font-bold">{amount.toLocaleString('vi-VN')} ₫</div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/30 mb-4"></div>

              {/* Payment Info */}
              <div className="mb-4">
                <div className="text-xs opacity-90 mb-1">Thông tin</div>
                <div className="text-xl font-bold">{description}</div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/30 mb-4"></div>

              {/* Order ID */}
              <div className="mb-4">
                <div className="text-sm opacity-90 mb-1">Đơn hàng</div>
                <div className="text-sm font-mono break-all">{orderId}</div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/30 mb-4"></div>

              {/* Back Button */}
              <button
                onClick={onCancel}
                className="flex items-center text-white hover:opacity-80 transition-opacity py-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Quay lại</span>
              </button>
            </div>

            {/* Right Panel - White Background */}
            <div className="bg-white p-8 flex flex-col justify-center items-center w-full">
              {/* Logo */}
              <div className="mb-6">
                <img 
                  src="/images/Momo_logo.jpg" 
                  alt="Momo" 
                  className="h-16 w-auto object-contain mx-auto"
                />
              </div>

              {/* QR Code Section */}
              <h3 className="text-lg font-bold mb-8" style={{ color: '#ab006b' }}>
                Quét mã để thanh toán
              </h3>

              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
                <img 
                  src="/images/QR_code.jpg" 
                  alt="QR Code" 
                  className="w-64 h-64 mx-auto object-contain"
                />
              </div>

              {/* Instructions */}
              <div className="text-center max-w-md">
                <div className="flex justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Sử dụng app Momo hoặc ứng dụng Camera hỗ trợ QR code để quét mã.
                </p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Đang chờ bạn quét...</span>
                </div>
              </div>

              {/* Confirm Button */}
              {!isProcessing && (
                <button
                  onClick={handleFakePayment}
                  className="mt-6 w-full py-3 px-4 rounded-lg text-white font-medium text-sm transition-all duration-300 shadow-lg"
                  style={{ backgroundColor: '#ab006b' }}
                >
                  Xác nhận thanh toán
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 text-white rounded px-3 py-1 font-bold text-xs">PCI DSS COMPLIANT</div>
            </div>
            <div className="text-xs text-gray-700">
              Ví điện tử Momo đạt Chứng nhận Bảo mật quốc tế PCI DSS
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
