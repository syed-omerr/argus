import React, { useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';

interface CustomImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  customClosedImage: string | null;
  customOpenImage: string | null;
  onSetImages: (closedImg: string | null, openImg: string | null) => void;
}

export const CustomImageUploadModal: React.FC<CustomImageUploadModalProps> = ({
  isOpen,
  onClose,
  customClosedImage,
  customOpenImage,
  onSetImages,
}) => {
  const closedInputRef = useRef<HTMLInputElement>(null);
  const openInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'closed' | 'open') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'closed') {
        onSetImages(dataUrl, customOpenImage);
      } else {
        onSetImages(customClosedImage, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    onSetImages(null, null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-red-500" />
            <h3 className="font-cinzel text-lg font-bold text-white tracking-wide">
              IMAGE SOURCE CONFIGURATION
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          The app includes built-in high-fidelity vector artwork recreating the closed and open eye collage. 
          You can also upload your own exported image files directly (e.g., <code className="text-red-300">Gemini_Generated_Image...png</code> and <code className="text-red-300">TraceLight Hackathon Pitch...png</code>).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Closed Eyes Upload Box */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col items-center text-center space-y-3">
            <span className="font-mono text-xs font-semibold text-zinc-300">
              1. CLOSED EYES IMAGE
            </span>

            {customClosedImage ? (
              <div className="relative w-full aspect-video rounded overflow-hidden border border-zinc-700">
                <img src={customClosedImage} alt="Custom closed eyes" className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 bg-emerald-500 text-black p-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video rounded border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 p-2 text-[11px]">
                <Upload className="w-5 h-5 mb-1 text-zinc-400" />
                <span>Using built-in vector closed eyes</span>
              </div>
            )}

            <input
              type="file"
              ref={closedInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'closed')}
            />
            <button
              onClick={() => closedInputRef.current?.click()}
              className="w-full py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono rounded transition-colors cursor-pointer"
            >
              {customClosedImage ? 'Replace Image' : 'Select Closed Eyes'}
            </button>
          </div>

          {/* Open Eyes Upload Box */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col items-center text-center space-y-3">
            <span className="font-mono text-xs font-semibold text-zinc-300">
              2. OPEN EYES IMAGE
            </span>

            {customOpenImage ? (
              <div className="relative w-full aspect-video rounded overflow-hidden border border-zinc-700">
                <img src={customOpenImage} alt="Custom opened eyes" className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 bg-emerald-500 text-black p-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video rounded border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 p-2 text-[11px]">
                <Upload className="w-5 h-5 mb-1 text-zinc-400" />
                <span>Using built-in vector open eyes</span>
              </div>
            )}

            <input
              type="file"
              ref={openInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'open')}
            />
            <button
              onClick={() => openInputRef.current?.click()}
              className="w-full py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono rounded transition-colors cursor-pointer"
            >
              {customOpenImage ? 'Replace Image' : 'Select Opened Eyes'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
          <button
            onClick={handleReset}
            className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer font-mono"
          >
            Reset to Default Vector Art
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
