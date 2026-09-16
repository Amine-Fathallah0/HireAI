'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Dot {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  scale: number;
  targetScale: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface InteractiveDotsProps {
  backgroundColor?: string;
  dotColor?: string;
  gridSpacing?: number;
  animationSpeed?: number;
  removeWaveLine?: boolean;
  adaptToTheme?: boolean; // New prop to enable theme adaptation
}

export default function InteractiveDots({
  backgroundColor = '#ffffff',
  dotColor = '#16A34A',
  gridSpacing = 30,
  animationSpeed = 0.005,
  removeWaveLine = true,
  adaptToTheme = true
}: InteractiveDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const dotsRef = useRef<Dot[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection effect
  useEffect(() => {
    if (!adaptToTheme) return;
    
    const detectTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(darkMode);
    };

    // Initial detection
    detectTheme();

    // Watch for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [adaptToTheme]);

  // Get theme-appropriate colors
  const getThemeColors = () => {
    if (!adaptToTheme) {
      return { dotColor, backgroundColor };
    }
    
    return {
      dotColor: isDarkMode ? '#10B981' : '#16A34A', // Lighter green for dark mode
      backgroundColor: isDarkMode ? '#111827' : '#ffffff' // Dark gray for dark mode
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots();
    };

    const initDots = () => {
      dotsRef.current = [];
      const cols = Math.floor(canvas.width / gridSpacing) + 1;
      const rows = Math.floor(canvas.height / gridSpacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSpacing;
          const y = j * gridSpacing;
          dotsRef.current.push({
            x,
            y,
            originalX: x,
            originalY: y,
            scale: 1,
            targetScale: 1
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e: MouseEvent) => {
      // Add ripple effect on click
      const rect = canvas.getBoundingClientRect();
      ripplesRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 0,
        maxRadius: 100,
        alpha: 1
      });
    };

    const animate = () => {
      const themeColors = getThemeColors();
      
      ctx.fillStyle = themeColors.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw dots
      dotsRef.current.forEach((dot: Dot) => {
        const distance = Math.sqrt(
          Math.pow(mouseRef.current.x - dot.x, 2) + 
          Math.pow(mouseRef.current.y - dot.y, 2)
        );

        if (distance < 100) {
          dot.targetScale = 1 + (100 - distance) / 100 * 3; // Increased scale multiplier from 1 to 3
        } else {
          dot.targetScale = 1;
        }

        dot.scale += (dot.targetScale - dot.scale) * 0.1;

        // Add subtle movement
        const time = Date.now() * animationSpeed;
        const offsetX = Math.sin(time + dot.originalX * 0.01) * 2;
        const offsetY = Math.cos(time + dot.originalY * 0.01) * 2;
        
        dot.x = dot.originalX + offsetX;
        dot.y = dot.originalY + offsetY;

        // Draw dot
        ctx.fillStyle = themeColors.dotColor;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1 * dot.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw ripples (click effects)
      ripplesRef.current.forEach((ripple: Ripple, index: number) => {
        ripple.radius += 4;
        ripple.alpha = 1 - (ripple.radius / ripple.maxRadius);

        if (ripple.alpha <= 0) {
          ripplesRef.current.splice(index, 1);
          return;
        }

        ctx.strokeStyle = themeColors.dotColor;
        ctx.globalAlpha = ripple.alpha * 0.4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [backgroundColor, dotColor, gridSpacing, animationSpeed, removeWaveLine, isDarkMode, adaptToTheme]);

  const themeColors = getThemeColors();

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: themeColors.backgroundColor }}
    />
  );
}
