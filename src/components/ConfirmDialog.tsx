'use client';

import React from 'react';
import { AlertTriangle, MoveHorizontal, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        };
      case 'warning':
        return {
          icon: <MoveHorizontal className="w-6 h-6 text-[#FFAA00]" />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          buttonColor: 'bg-[#FFAA00] hover:bg-yellow-500 focus:ring-yellow-500',
        };
      default:
        return {
          icon: <MoveHorizontal className="w-6 h-6 text-blue-500" />,
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${styles.bgColor} border-2 ${styles.borderColor} flex items-center justify-center mb-4`}>
            {styles.icon}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted border border-border rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.buttonColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
