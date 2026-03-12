import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Crop, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function ImageCropper({ imageFile, onCrop, onCancel }) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  const TARGET_WIDTH = 1080;
  const TARGET_HEIGHT = 1350; // 4:5 ratio

  const loadImage = () => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
    img.src = URL.createObjectURL(imageFile);
  };

  React.useEffect(() => {
    loadImage();
  }, [imageFile]);

  const drawCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    // Set canvas size
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    
    // Calculate scaled dimensions
    const scale = Math.max(
      TARGET_WIDTH / img.width,
      TARGET_HEIGHT / img.height
    ) * zoom;
    
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    
    // Center the image
    const x = (TARGET_WIDTH - scaledWidth) / 2;
    const y = (TARGET_HEIGHT - scaledHeight) / 2;
    
    // Draw image
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    // Draw guideline at 50% height
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, TARGET_HEIGHT / 2);
    ctx.lineTo(TARGET_WIDTH, TARGET_HEIGHT / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw text
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = 'rgba(147, 51, 234, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('Keep important details above this line', TARGET_WIDTH / 2, TARGET_HEIGHT / 2 - 20);
  };

  React.useEffect(() => {
    drawCanvas();
  }, [zoom]);

  const handleCrop = async () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });
      
      const file = new File([blob], imageFile.name, { type: 'image/jpeg' });
      onCrop(file);
    } catch (error) {
      console.error('Crop failed:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden">
        <div className="p-4 bg-purple-600 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Crop size={20} />
            Crop Your Photo (4:5 Ratio)
          </h3>
          <p className="text-sm text-purple-100 mt-1">
            Adjust zoom to fit your photo perfectly
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Canvas */}
          <div className="relative bg-gray-100 rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ aspectRatio: '4/5' }}
            />
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-4">
            <ZoomOut size={20} className="text-gray-600" />
            <Slider
              value={[zoom]}
              onValueChange={(val) => setZoom(val[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn size={20} className="text-gray-600" />
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <Crop size={18} className="mr-2" />
                  Crop & Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}