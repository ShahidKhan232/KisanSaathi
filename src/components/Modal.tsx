import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ show, onClose, children }: ModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};