'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  shockRadius?: number;
  shockStrength?: number;
  resistance?: number;
  returnDuration?: number;
  backgroundColor?: string;
}

interface Dot {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  currentX: number;
  currentY: number;
  velocityX: number;
  velocityY: number;
  scale: number;
  targetScale: number;
}

export default function DotGrid({
  dotSize = 10,
  gap = 15,
  baseColor = '#16A34A',
  activeColor = '#16A34A',
  proximity = 120,
  shockRadius = 250,
  shockStrength = 5,
  resistance = 750,
  returnDuration = 1.5,
  backgroundColor = '#ffffff'
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const dotsRef = useRef<Dot[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const initDots = () => {
      dotsRef.current = [];
      const cols = Math.floor(canvas.width / gap) + 2;
      const rows = Math.floor(canvas.height / gap) + 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gap - gap/2;
          const y = j * gap - gap/2;
          dotsRef.current.push({
            x,
            y,
            originalX: x,
            originalY: y,
            currentX: x,
            currentY: y,
            velocityX: 0,
            velocityY: 0,
            scale: 1,
            targetScale: 1
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const animate = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      dotsRef.current.forEach((dot: Dot) => {
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - dot.currentX, 2) + 
          Math.pow(mouseY - dot.currentY, 2)
        );

        // Scale effect based on proximity
        if (distance < proximity) {
          dot.targetScale = 1 + (proximity - distance) / proximity * 2;
        } else {
          dot.targetScale = 1;
        }

        // Shock wave effect
        if (distance < shockRadius) {
          const force = (shockRadius - distance) / shockRadius;
          const angle = Math.atan2(dot.currentY - mouseY, dot.currentX - mouseX);
          const forceX = Math.cos(angle) * force * shockStrength;
          const forceY = Math.sin(angle) * force * shockStrength;
          
          dot.velocityX += forceX * 0.1;
          dot.velocityY += forceY * 0.1;
        }

        // Apply resistance and return to original position
        const returnForceX = (dot.originalX - dot.currentX) / resistance;
        const returnForceY = (dot.originalY - dot.currentY) / resistance;
        
        dot.velocityX += returnForceX;
        dot.velocityY += returnForceY;
        
        // Apply damping
        dot.velocityX *= 0.95;
        dot.velocityY *= 0.95;
        
        // Update position
        dot.currentX += dot.velocityX;
        dot.currentY += dot.velocityY;
        
        // Update scale
        dot.scale += (dot.targetScale - dot.scale) * 0.1;

        // Draw dot
        const alpha = distance < proximity ? 0.8 : 0.4;
        const color = distance < proximity ? activeColor : baseColor;
        
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(
          dot.currentX, 
          dot.currentY, 
          (dotSize / 2) * dot.scale, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    initDots();
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, dotSize, gap, baseColor, activeColor, proximity, shockRadius, shockStrength, resistance, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: backgroundColor }}
    />
  );
}
