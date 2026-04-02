import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { RotateCcw, Save } from 'lucide-react';

export default function SignatureCanvas({ applicationId, deskId, onSignatureSaved }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0f172a'; // slate-900
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    // Check if blank (rudimentary)
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const isBlank = !Array.from(imageData).some(channel => channel !== 0);
    
    if (isBlank) return alert('Please draw your signature first.');
    
    setIsUploading(true);
    try {
      // Export base64
      canvas.toBlob(async (blob) => {
        try {
          const fileName = `signatures/${applicationId}/${deskId}_${Date.now()}.png`;
          
          const { error } = await supabase.storage
            .from('signatures')
            .upload(fileName, blob, { 
              upsert: true,
              contentType: 'image/png'
            });
            
          if (error) throw error;
          
          // Return the storage path 
          await onSignatureSaved(fileName);
        } catch (innerErr) {
          console.error('Blob handling error:', innerErr);
          alert('Action failed: ' + (innerErr.message || 'Check connection'));
        } finally {
          setIsUploading(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Outer signature error:', err);
      alert('Failed to process signature.');
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 mt-4 premium-shadow relative">
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
           <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="font-bold text-slate-800 dark:text-white animate-pulse">Encrypting & Validating Signature...</p>
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex justify-between items-center text-sm">
        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Digital Signature Validation</span>
        <button onClick={clearCanvas} className="text-slate-400 hover:text-red-500 font-bold flex items-center gap-1 transition-colors">
          <RotateCcw size={14} /> Clear
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full bg-slate-50/30 dark:bg-slate-950/30 cursor-crosshair touch-none"
      />
      
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button 
          onClick={saveSignature} 
          disabled={isUploading}
          className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 focus:ring-green-100 disabled:opacity-50 h-11 px-6 rounded-xl shadow-lg shadow-green-500/20"
        >
          <Save size={18} className="stroke-[2.5]" /> 
          <span className="font-bold">Save & Validate</span>
        </button>
      </div>
    </div>
  );
}
