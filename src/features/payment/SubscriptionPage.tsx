import { useState, useEffect } from 'react';
import { QRPaymentModal } from './QRPaymentModal';
import { motion } from 'framer-motion';
import { NavigationBar } from '../../components/ui';
import { useAuth } from '../auth/AuthContext';
import { sendInvoice, createInvoiceData } from '../../lib/payment-service';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  isPopular?: boolean;
}

interface SubscriptionPageProps {
  onNavigate: (path: string) => void;
}

export function SubscriptionPage({ onNavigate }: SubscriptionPageProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Check premium status from localStorage on mount
  useEffect(() => {
    const checkPremiumStatus = () => {
      const premiumStatus = localStorage.getItem('taskie_premium_status');
      setIsPremium(premiumStatus === 'active');
    };
    
    checkPremiumStatus();
  }, []);

  const plans: SubscriptionPlan[] = [
    {
      id: 'monthly',
      name: 'Gói Premium',
      price: 30000,
      duration: 'Tháng',
      features: [
        '✅ Tính năng AI không giới hạn',
        '✅ Xuất báo cáo chi tiết',
        '✅ Đồng bộ cloud không giới hạn',
        '✅ Hỗ trợ ưu tiên 24/7',
      ],
      isPopular: true,
    },
  ];

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsLoadingQR(true);
    
    // Show loading for 3 seconds
    setTimeout(() => {
      setIsLoadingQR(false);
      setShowPayment(true);
    }, 3000);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    
    // Save premium status to localStorage
    localStorage.setItem('taskie_premium_status', 'active');
    localStorage.setItem('taskie_premium_plan', JSON.stringify({
      planId: selectedPlan?.id,
      planName: selectedPlan?.name,
      subscribedAt: new Date().toISOString()
    }));
    
    // Send invoice email to user
    if (selectedPlan && user?.email) {
      try {
        const invoiceData = createInvoiceData(
          selectedPlan.id,
          selectedPlan.name,
          selectedPlan.price,
          user.email,
          user.name || ''
        );
        
        await sendInvoice(invoiceData);
        console.log('✓ Invoice email sent successfully');
      } catch (error) {
        console.error('⚠ Failed to send invoice email:', error);
        // Don't block the flow if email fails
      }
    }
    
    setShowSuccess(true);
    
    // Show success message for 2 seconds, then redirect to today page
    setTimeout(() => {
      setShowSuccess(false);
      onNavigate('/today');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <NavigationBar onNavigate={onNavigate} activeNav="subscription" />
      
      {/* Hero Section */}
      <div className="mb-12 pt-8">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="text-sm font-semibold tracking-wider text-blue-600 uppercase mb-3">
              Premium Subscription
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl mb-4">
              Nâng cấp lên Taskie Premium
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Khám phá tất cả tính năng premium với gói subscription
            </p>
          </motion.div>
        </div>
      </div>
      
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex justify-center mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full ${
                plan.isPopular
                  ? 'ring-4 ring-blue-500 scale-105'
                  : 'hover:shadow-xl transition-shadow'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Phổ biến nhất
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-slate-600 ml-2 text-lg">VNĐ/{plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-slate-700 flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature.replace('✅ ', '')}</span>
                  </li>
                ))}
              </ul>

              {isPremium ? (
                <button
                  disabled
                  className="w-full py-4 px-6 rounded-xl bg-gray-400 text-white font-semibold shadow-lg cursor-not-allowed"
                >
                  Bạn đã đăng ký rồi
                </button>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoadingQR}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingQR ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      <span>Đang tải QR...</span>
                    </div>
                  ) : (
                    'Đăng ký ngay'
                  )}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {showPayment && selectedPlan && (
          <QRPaymentModal
            amount={selectedPlan.price}
            description={`Thanh toán cho ${selectedPlan.name}`}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
          />
        )}

        {/* Success Notification */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Thanh toán thành công!
                </h3>
                <p className="text-gray-600 mb-6">
                  Cảm ơn bạn đã đăng ký {selectedPlan?.name}
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">Đang chuyển hướng...</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

