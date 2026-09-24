import React, { useEffect, useRef, useState } from 'react';
import { seeded, todayKey } from '../../utils/daily';

const PROMPTS = [
  'Draw your morning commute, badly.',
  'Draw the weather outside without looking.',
  'Draw a plant that does not exist.',
  'Draw your desk from above.',
  'Draw how the week feels so far.',
  'Draw something you can see from where you sit.',
  'Draw an animal wearing your job.',
];

const INKS = ['#000000', '#6e222b', '#fe5000', '#9acaee', '#ff9e72', '#005544'];

export default function Doodle() {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [ink, setInk] = useState(INKS[0]);
  const [width, setWidth] = useState(3);

  const prompt = PROMPTS[Math.floor(seeded(todayKey())() * PROMPTS.length)];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.strokeStyle = ink;
    ctx.lineWidth = width;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stop = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div>
      <p className="doodle-prompt">{prompt}</p>

      <canvas
        ref={canvasRef}
        className="pad"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={stop}
      />

      <div className="pens">
        {INKS.map((c) => (
          <button
            key={c}
            className="pen"
            style={{ background: c }}
            aria-label={`Draw in ${c}`}
            aria-pressed={ink === c}
            onClick={() => setInk(c)}
          />
        ))}
        <span style={{ width: 12 }} />
        {[2, 5, 10].map((w) => (
          <button
            key={w}
            className="chip"
            aria-pressed={width === w}
            onClick={() => setWidth(w)}
            style={{ padding: '5px 12px' }}
          >
            {w === 2 ? 'Thin' : w === 5 ? 'Medium' : 'Thick'}
          </button>
        ))}
        <button className="btn btn-quiet" style={{ marginLeft: 'auto' }} onClick={clear}>
          Start over
        </button>
      </div>
    </div>
  );
}
