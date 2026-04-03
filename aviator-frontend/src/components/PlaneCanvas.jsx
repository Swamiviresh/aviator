import React, { useRef, useEffect } from 'react';

const PlaneCanvas = ({ multiplier, status }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Draw Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0a1a');
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (status === 'RUNNING' || status === 'CRASHED') {
        const m = parseFloat(multiplier);

        // Calculate curve points
        // Use a more dynamic curve: x grows linearly, y grows exponentially
        const progress = Math.min((m - 1) / 10, 1); // Normalize progress
        const maxX = width * 0.8;
        const maxY = height * 0.8;

        const currentX = progress * maxX;
        const currentY = height - (Math.pow(progress, 1.5) * maxY);

        // Draw Glow Path
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(220, 38, 38, 0.8)';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(0, height);

        // Draw the curve up to current position
        for(let i = 0; i <= progress; i += 0.01) {
            const px = i * maxX;
            const py = height - (Math.pow(i, 1.5) * maxY);
            ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Draw Gradient under curve
        ctx.shadowBlur = 0;
        const curveFill = ctx.createLinearGradient(0, height, 0, currentY);
        curveFill.addColorStop(0, 'rgba(220, 38, 38, 0)');
        curveFill.addColorStop(1, 'rgba(220, 38, 38, 0.2)');
        ctx.fillStyle = curveFill;
        ctx.lineTo(currentX, height);
        ctx.closePath();
        ctx.fill();

        // Draw Plane (Simplified SVG path to Canvas)
        ctx.save();
        ctx.translate(currentX, currentY);
        // Rotate plane slightly based on trajectory
        ctx.rotate(-Math.PI / 8);

        if (status === 'CRASHED') {
            // Add explosion effect or different style
            ctx.fillStyle = '#facc15';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#facc15';
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
        }

        // Airplane Shape
        ctx.beginPath();
        ctx.moveTo(20, 0); // Nose
        ctx.lineTo(-10, -8); // Top wing
        ctx.lineTo(-5, 0); // Body
        ctx.lineTo(-10, 8); // Bottom wing
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [multiplier, status]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-inner group">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Multiplier Display */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <h2 className={`text-7xl md:text-8xl font-black transition-all duration-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] ${
          status === 'CRASHED' ? 'text-red-600 scale-110' : 'text-white'
        }`}>
          {multiplier}x
        </h2>
        {status === 'CRASHED' && (
          <div className="mt-4 px-6 py-2 bg-red-600 text-white font-black text-xl uppercase tracking-[0.2em] rounded-lg animate-bounce shadow-2xl">
            Flew Away!
          </div>
        )}
      </div>

      {/* Aesthetic Overlays */}
      <div className="absolute bottom-4 left-6 text-gray-500 font-mono text-[10px] tracking-widest uppercase opacity-50">
        Engine System v4.0.2 // Live Trajectory
      </div>
    </div>
  );
};

export default PlaneCanvas;
