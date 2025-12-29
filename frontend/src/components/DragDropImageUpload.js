import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const DragDropImageUpload = ({ 
  images = [], 
  onChange, 
  maxImages = 3,
  label = "Görseller",
  onFilesChange // NEW: callback for actual File objects
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handle paste event
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
        toast.success(`${files.length} görsel yapıştırıldı`);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [images]);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList);
    
    if (images.length + files.length > maxImages) {
      toast.error(`Maksimum ${maxImages} görsel yükleyebilirsiniz`);
      return;
    }

    const validFiles = [];
    const base64Images = [];
    let processedCount = 0;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} bir görsel dosyası değil`);
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} çok büyük (max 5MB)`);
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        base64Images.push(reader.result);
        processedCount++;
        
        if (processedCount === validFiles.length) {
          onChange([...images, ...base64Images]);
          if (onFilesChange) {
            onFilesChange(validFiles);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label} {images.length > 0 && `(${images.length}/${maxImages})`}
        </label>
        <p className="text-xs text-gray-500">
          Sürükle-bırak veya Ctrl+V ile yapıştır
        </p>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img 
                src={img} 
                alt={`Görsel ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                title="Görseli sil"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                {index + 1}/{maxImages}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-2">
            {dragActive ? (
              <>
                <Upload className="h-10 w-10 text-blue-500 animate-bounce" />
                <p className="text-sm font-medium text-blue-600">
                  Bırak ve yükle
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-gray-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    Görselleri sürükle-bırak
                  </p>
                  <p className="text-xs text-gray-500">
                    veya tıklayarak seç ya da Ctrl+V ile yapıştır
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Dosya Seç
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {images.length >= maxImages && (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Maksimum {maxImages} görsel yüklendi
          </p>
        </div>
      )}
    </div>
  );
};

export default DragDropImageUpload;
