import React, { useRef, useEffect } from 'react';

const PlaneCanvas = ({ multiplier, status }) => {
  const canvasRef = useRef(null);
  const multiplierRef = useRef(multiplier);
  const statusRef = useRef(status);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    multiplierRef.current = multiplier;
    statusRef.current = status;
    if (status === 'RUNNING' && startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }
    if (status === 'WAITING') {
      startTimeRef.current = null;
    }
  }, [multiplier, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const drawPlane = (ctx, x, y, scale, crashed) => {
      ctx.save();
      ctx.translate(x, y);

      if (crashed) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#facc15';
      } else {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255,255,255,0.6)';
      }

      const s = scale;

      // Fuselage
      ctx.beginPath();
      ctx.fillStyle = crashed ? '#facc15' : '#ffffff';
      ctx.ellipse(0, 0, s * 2.8, s * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nose cone
      ctx.beginPath();
      ctx.moveTo(s * 2.8, 0);
      ctx.lineTo(s * 4.5, -s * 0.3);
      ctx.lineTo(s * 4.5, s * 0.3);
      ctx.closePath();
      ctx.fillStyle = crashed ? '#f59e0b' : '#e5e7eb';
      ctx.fill();

      // Main wing (top)
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.5);
      ctx.lineTo(s * 1.2, -s * 3.2);
      ctx.lineTo(-s * 0.8, -s * 3.2);
      ctx.lineTo(-s * 1.2, -s * 0.5);
      ctx.closePath();
      ctx.fillStyle = crashed ? '#fbbf24' : '#d1d5db';
      ctx.fill();

      // Main wing (bottom)
      ctx.beginPath();
      ctx.moveTo(s * 0.2, s * 0.5);
      ctx.lineTo(s * 1.2, s * 3.2);
      ctx.lineTo(-s * 0.8, s * 3.2);
      ctx.lineTo(-s * 1.2, s * 0.5);
      ctx.closePath();
      ctx.fillStyle = crashed ? '#fbbf24' : '#d1d5db';
      ctx.fill();

      // Tail fin (top)
      ctx.beginPath();
      ctx.moveTo(-s * 2.0, -s * 0.5);
      ctx.lineTo(-s * 1.5, -s * 1.8);
      ctx.lineTo(-s * 3.2, -s * 1.8);
      ctx.lineTo(-s * 3.0, -s * 0.5);
      ctx.closePath();
      ctx.fillStyle = crashed ? '#f59e0b' : '#9ca3af';
      ctx.fill();

      // Tail fin (bottom)
      ctx.beginPath();
      ctx.moveTo(-s * 2.0, s * 0.5);
      ctx.lineTo(-s * 1.5, s * 1.8);
      ctx.lineTo(-s * 3.2, s * 1.8);
      ctx.lineTo(-s * 3.0, s * 0.5);
      ctx.closePath();
      ctx.fillStyle = crashed ? '#f59e0b' : '#9ca3af';
      ctx.fill();

      // Engine pod (under main wing)
      ctx.beginPath();
      ctx.fillStyle = crashed ? '#fbbf24' : '#6b7280';
      ctx.ellipse(s * 0.1, s * 1.8, s * 0.8, s * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * 0.1, -s * 1.8, s * 0.8, s * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cockpit window
      ctx.beginPath();
      ctx.fillStyle = crashed ? '#fde68a' : '#93c5fd';
      ctx.ellipse(s * 1.8, -s * 0.25, s * 0.5, s * 0.3, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Engine exhaust trail
      if (!crashed) {
        const trailGrad = ctx.createLinearGradient(-s * 3.5, 0, -s * 8, 0);
        trailGrad.addColorStop(0, 'rgba(251,146,60,0.8)');
        trailGrad.addColorStop(0.4, 'rgba(239,68,68,0.4)');
        trailGrad.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.beginPath();
        ctx.fillStyle = trailGrad;
        ctx.ellipse(-s * 5.5, 0, s * 2.5, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const render = (timestamp) => {
      const width = canvas.width;
      const height = canvas.height;
      const currentStatus = statusRef.current;

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#060618');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      const stars = [[0.1,0.1],[0.3,0.05],[0.5,0.15],[0.7,0.08],[0.9,0.12],
                     [0.2,0.3],[0.6,0.25],[0.85,0.35],[0.15,0.45],[0.45,0.4]];
      stars.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(sx * width, sy * height, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 70) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += 70) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      if (currentStatus === 'RUNNING' || currentStatus === 'CRASHED') {
        let progress;
        if (currentStatus === 'RUNNING' && startTimeRef.current !== null) {
          const elapsed = timestamp - startTimeRef.current;
          progress = Math.min(elapsed / 18000, 0.93);
        } else {
          progress = startTimeRef.current
            ? Math.min((performance.now() - startTimeRef.current) / 18000, 0.93)
            : 0.5;
        }

        const maxX = width * 0.82;
        const maxY = height * 0.78;
        const curveX = progress * maxX;
        const curveY = height - Math.pow(progress, 1.35) * maxY;

        // Curve trajectory
        ctx.shadowBlur = 10;
        ctx.shadowColor = currentStatus === 'CRASHED' ? 'rgba(150,150,150,0.4)' : 'rgba(220,38,38,0.6)';
        ctx.strokeStyle = currentStatus === 'CRASHED' ? '#555' : '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i <= progress; i += 0.005) {
          ctx.lineTo(i * maxX, height - Math.pow(i, 1.35) * maxY);
        }
        ctx.stroke();

        // Fill under curve
        ctx.shadowBlur = 0;
        const fill = ctx.createLinearGradient(0, height, 0, curveY);
        fill.addColorStop(0, 'rgba(220,38,38,0)');
        fill.addColorStop(1, currentStatus === 'CRASHED' ? 'rgba(80,80,80,0.08)' : 'rgba(220,38,38,0.1)');
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i <= progress; i += 0.005) {
          ctx.lineTo(i * maxX, height - Math.pow(i, 1.35) * maxY);
        }
        ctx.lineTo(curveX, height);
        ctx.closePath();
        ctx.fill();

        // Plane angle follows the curve
        const dx = 0.005 * maxX;
        const dy = -(Math.pow(progress + 0.005, 1.35) - Math.pow(Math.max(progress - 0.005, 0), 1.35)) * maxY / 2;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(curveX, curveY);
        ctx.rotate(angle);
        const planeScale = Math.max(width, height) * 0.022;
        drawPlane(ctx, 0, 0, planeScale, currentStatus === 'CRASHED');
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Multiplier */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none">
        <h2 className={`text-5xl md:text-6xl font-black drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] tabular-nums ${
          status === 'CRASHED' ? 'text-red-500' : 'text-white'
        }`}>
          {multiplier}x
        </h2>
        {status === 'CRASHED' && (
          <div className="mt-2 px-5 py-1.5 bg-red-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-lg animate-bounce shadow-2xl">
            Flew Away!
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-3 text-gray-700 font-mono text-[8px] tracking-widest uppercase select-none">
        Live Trajectory
      </div>
    </div>
  );
};

export default PlaneCanvas;