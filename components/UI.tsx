import React, { useEffect } from 'react';

// --- Toast Notification ---
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <div className={`fixed top-5 start-1/2 transform -translate-x-1/2 z-50 flex items-center p-4 mb-4 w-full max-w-sm text-white rounded-lg shadow-lg animate-slideInDown ${bgColors[type]}`}>
      <div className="ms-3 text-sm font-bold flex-1">{message}</div>
      <button onClick={onClose} className="ms-auto bg-transparent text-white hover:text-gray-200">
        ✕
      </button>
    </div>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  preventClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, preventClose = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div 
        className="fixed inset-0 bg-black opacity-50 transition-opacity" 
        onClick={preventClose ? undefined : onClose}
      ></div>
      <div className="relative w-full max-w-lg mx-auto my-6 z-50">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-solid border-slate-200 rounded-t">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            {!preventClose && (
              <button
                className="p-1 ms-auto bg-transparent border-0 text-slate-500 hover:text-red-500 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                onClick={onClose}
              >
                <span className="block h-6 w-6 text-2xl outline-none focus:outline-none">×</span>
              </button>
            )}
          </div>
          {/* Body */}
          <div className="relative p-6 flex-auto max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Spinner ---
export const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-800 font-bold">{window.__t("جاري المعالجة...")}</p>
    </div>
  </div>
);