import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

// Custom centered notification modal component
const NotificationModal = ({ open, onClose, type = 'success', title, message }) => {
  const iconMap = {
    success: <CheckCircle className="h-12 w-12 text-green-500" />,
    error: <XCircle className="h-12 w-12 text-red-500" />,
    warning: <AlertTriangle className="h-12 w-12 text-amber-500" />,
    info: <Info className="h-12 w-12 text-blue-500" />,
  };

  const bgColorMap = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const buttonColorMap = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className={`max-w-md ${bgColorMap[type]} border-2`}>
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="mb-4">
            {iconMap[type]}
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-gray-800">
            {title || (type === 'success' ? 'Başarılı' : type === 'error' ? 'Hata' : type === 'warning' ? 'Uyarı' : 'Bilgi')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 text-base mt-2">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center mt-4">
          <AlertDialogAction 
            onClick={onClose}
            className={`${buttonColorMap[type]} text-white px-8 py-2 rounded-lg font-medium`}
          >
            Tamam
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NotificationModal;
