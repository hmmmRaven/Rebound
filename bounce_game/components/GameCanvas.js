'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './GameCanvas.module.css';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    up: false,
  });

  // Game state
  const gameState = useRef({
    ball: {
      x: 400,
      y: 500,
      radius: 20,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpStrength: 15,
      isJumping: false,
      color: '#ff4757',
    },
    platforms: [
      { x: 100, y: 550, width: 200, height: 20 },
      { x: 400, y: 450, width: 200, height: 20 },
      { x: 700, y: 350, width: 200, height: 20 },
    ],
    gravity: 0.8,
    friction: 0.8,
    ground: 580, // Canvas height - ball radius
  });

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setKeys(prev => ({ ...prev, left: true }));
      if (e.key === 'ArrowRight') setKeys(prev => ({ ...prev, right: true }));
      if (e.key === 'ArrowUp' || e.key === ' ') setKeys(prev => ({ ...prev, up: true }));
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') setKeys(prev => ({ ...prev, left: false }));
      if (e.key === 'ArrowRight') setKeys(prev => ({ ...prev, right: false }));
      if (e.key === 'ArrowUp' || e.key === ' ') setKeys(prev => ({ ...prev, up: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Check if ball is on a platform
  const isOnPlatform = () => {
    const { ball, platforms } = gameState.current;
    
    for (const platform of platforms) {
      if (
        ball.x + ball.radius > platform.x &&
        ball.x - ball.radius < platform.x + platform.width &&
        ball.y + ball.radius >= platform.y - 1 &&
        ball.y + ball.radius <= platform.y + 5
      ) {
        return true;
      }
    }
    
    return ball.y >= gameState.current.ground;
  };

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const { ball, platforms, gravity, friction } = gameState.current;

      // Update ball position based on keyboard input
      if (keys.left) ball.velocityX -= ball.speed * 0.1;
      if (keys.right) ball.velocityX += ball.speed * 0.1;
      
      // Apply jump if on ground or platform and up key is pressed
      if (keys.up && isOnPlatform()) {
        ball.velocityY = -ball.jumpStrength;
        ball.isJumping = true;
      }

      // Apply physics
      ball.velocityY += gravity;
      ball.velocityX *= friction;

      // Update position
      ball.x += ball.velocityX;
      ball.y += ball.velocityY;

      // Check boundaries
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.velocityX = 0;
      }
      
      if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.velocityX = 0;
      }

      // Check ground collision
      if (ball.y + ball.radius > gameState.current.ground) {
        ball.y = gameState.current.ground - ball.radius;
        ball.velocityY = 0;
        ball.isJumping = false;
      }

      // Check platform collisions
      for (const platform of platforms) {
        if (
          ball.x + ball.radius > platform.x &&
          ball.x - ball.radius < platform.x + platform.width &&
          ball.y + ball.radius >= platform.y - 1 &&
          ball.y + ball.radius <= platform.y + 5 &&
          ball.velocityY > 0
        ) {
          ball.y = platform.y - ball.radius;
          ball.velocityY = 0;
          ball.isJumping = false;
        }
      }

      // Draw platforms
      ctx.fillStyle = '#3742fa';
      platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      });

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.closePath();

      // Draw ground
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(0, gameState.current.ground + ball.radius, canvas.width, 5);

      // Continue animation
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [keys]);

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.canvas} 
      width={800} 
      height={600} 
      tabIndex={0}
    />
  );
}
