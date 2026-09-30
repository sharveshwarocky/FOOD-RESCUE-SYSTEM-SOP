import React, { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

const ImageUpload = ({ onChange, label = 'Food / Proof Image' }) => {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      
      {preview ? (
        <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500 bg-emerald-50/20">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 shadow-md transition-transform active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-emerald-50/30 transition-colors">
          <div className="flex justify-center gap-3 mb-2 text-slate-400">
            <Camera className="w-8 h-8" />
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-600 font-medium">Click to upload photo or take picture</p>
          <p className="text-[10px] text-slate-400 mt-1">Supports file upload & mobile camera capture</p>
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload-input"
          />
          
          <label
            htmlFor="image-upload-input"
            className="mt-3 inline-block px-4 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm"
          >
            Browse / Take Photo
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
