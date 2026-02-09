import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface CancellationNotificationProps {
  orderId: string;
  customerName: string;
  onClose: () => void;
}

export default function CancellationNotification({ orderId, customerName, onClose }: CancellationNotificationProps) {
  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
      <div className="bg-red-50 border-2 border-red-500 rounded-xl shadow-2xl p-6 max-w-md">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle size={24} className="text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 mb-1">
              🚨 Order Cancelled!
            </h3>
            <p className="text-sm text-red-800 mb-2">
              <span className="font-semibold">{customerName}</span> cancelled order <span className="font-mono font-bold">{orderId}</span>
            </p>
            <p className="text-xs text-red-700">
              Check order details for cancellation reason
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 text-red-600 hover:text-red-800 transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
