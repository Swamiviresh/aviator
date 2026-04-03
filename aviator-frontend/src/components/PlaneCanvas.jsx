import React, { useRef, useEffect } from 'react';

const PlaneCanvas = ({ multiplier, status }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw Grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * width / 10, 0);
        ctx.lineTo(i * width / 10, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * height / 10);
        ctx.lineTo(width, i * height / 10);
        ctx.stroke();
      }

      if (status === 'RUNNING') {
        const m = parseFloat(multiplier);
        const x = Math.min((m - 1) * 50, width - 50);
        const y = height - Math.min((m - 1) * 30, height - 50);

        // Draw Path
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.quadraticCurveTo(x / 2, height, x, y);
        ctx.stroke();

        // Draw Airplane (simple triangle for now)
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 20, y + 5);
        ctx.lineTo(x - 20, y - 5);
        ctx.fill();
      }

      if (status === 'CRASHED') {
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText('CRASHED!', width / 2 - 70, height / 2);
      }
    };

    render();
  }, [multiplier, status]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} width={600} height={400} className="w-full h-full" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-6xl font-bold">
        {multiplier}x
      </div>
    </div>
  );
};

export default PlaneCanvas;
