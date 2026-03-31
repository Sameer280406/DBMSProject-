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
        const fileName = `${applicationId}/${deskId}.png`;
        
        const { error } = await supabase.storage
          .from('signatures')
          .upload(fileName, blob, { upsert: true });
          
        if (error) throw error;
        
        // Return the storage path 
        onSignatureSaved(fileName);
      }, 'image/png');
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Failed to upload signature. Check console.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white mt-4 premium-shadow">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center text-sm">
        <span className="font-semibold text-slate-700">Digital Signature Validation</span>
        <button onClick={clearCanvas} className="text-slate-500 hover:text-red-500 font-semibold flex items-center gap-1">
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
        className="w-full bg-slate-50/50 cursor-crosshair touch-none"
      />
      
      <div className="p-4 border-t border-slate-100 flex justify-end">
        <button 
          onClick={saveSignature} 
          disabled={isUploading}
          className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 focus:ring-green-100 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : <><Save size={16} /> Save & Validate</>}
        </button>
      </div>
    </div>
  );
}
