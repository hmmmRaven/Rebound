'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './GameCanvas.module.css';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [totalImagesLoaded, setTotalImagesLoaded] = useState(0);
  const totalImagesToLoad = useRef(5); // Ball, background, ground, pointA, pointB
  
  // Constants
  const LEVEL_WIDTH = 4000; // 5x the canvas width
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  
  // Constants for ground level
  const GROUND_HEIGHT = 40; // Height of the ground image
  const GROUND_LEVEL = 580 - GROUND_HEIGHT; // Top of ground image
  
  // Game state
  const gameState = useRef({
    ball: {
      x: 100,
      y: GROUND_LEVEL - 20, // Ground level - radius
      radius: 20,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpStrength: 15,
      onGround: true,
      image: null
    },
    camera: {
      x: 0,
    },
    pointA: {
      x: 50,
      y: GROUND_LEVEL - 300, // Ground level - height
      width: 300,
      height: 300,
      image: null,
      flipHorizontal: true // Flag to flip the image horizontally
    },
    pointB: {
      x: LEVEL_WIDTH - 400, // Adjusted for larger size
      y: GROUND_LEVEL, // Ground level
      size: 800, // 20x bigger (40 * 20)
      image: null
    },
    background: {
      image: null
    },
    ground: {
      image: null,
      height: 40 // Height of the ground image
    },
    enemies: [],
    obstacles: [],
    score: 0,
    gravity: 0.8,
    friction: 0.8,
    gameOver: false,
    gameWon: false,
    keys: {
      left: false,
      right: false,
      up: false
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Enemy image types
    const enemyTypes = ['Enemy_1.png', 'dog_chase.png'];
    const enemyImages = {};
    
    // Preload enemy images
    enemyTypes.forEach(type => {
      const img = new Image();
      img.src = `/images/${type}`;
      img.onload = () => {
        console.log(`Enemy image loaded: ${type}`);
      };
      img.onerror = (err) => {
        console.error(`Failed to load enemy image: ${type}`, err);
      };
      enemyImages[type] = img;
    });
    
    // Function to handle image loading
    const imageLoaded = () => {
      setTotalImagesLoaded(prev => {
        const newCount = prev + 1;
        if (newCount >= totalImagesToLoad.current) {
          console.log('All images loaded, starting game');
          // Generate enemies after all images are loaded
          gameState.current.enemies = generateEnemies();
          
          // Assign preloaded enemy images to enemies
          for (const enemy of gameState.current.enemies) {
            // Randomly select enemy type
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            enemy.image = enemyImages[randomType];
          }
          
          setImagesLoaded(true);
        }
        return newCount;
      });
    };
    
    // Load game images
    const ball = new Image();
    ball.onload = imageLoaded;
    ball.onerror = () => {
      console.error('Failed to load ball image');
      imageLoaded(); // Count as loaded to prevent game from being stuck
    };
    ball.src = '/images/basketball.png';
    gameState.current.ball.image = ball;
    
    const pointA = new Image();
    pointA.onload = imageLoaded;
    pointA.onerror = () => {
      console.error('Failed to load pointA image');
      imageLoaded();
    };
    pointA.src = '/images/background_court.png';
    gameState.current.pointA.image = pointA;
    
    const pointB = new Image();
    pointB.onload = imageLoaded;
    pointB.onerror = () => {
      console.error('Failed to load pointB image');
      imageLoaded();
    };
    pointB.src = '/images/pyramid.png';
    gameState.current.pointB.image = pointB;
    
    const background = new Image();
    background.onload = imageLoaded;
    background.onerror = () => {
      console.error('Failed to load background image');
      imageLoaded();
    };
    background.src = '/images/background_city.jpg';
    gameState.current.background.image = background;
    
    const ground = new Image();
    ground.onload = imageLoaded;
    ground.onerror = () => {
      console.error('Failed to load ground image');
      imageLoaded();
    };
    ground.src = '/images/ground_city.png';
    gameState.current.ground.image = ground;
    
    // Handle keyboard input
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') gameState.current.keys.left = true;
      if (e.key === 'ArrowRight') gameState.current.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === ' ') {
        gameState.current.keys.up = true;
        // Prevent page scrolling with space key
        if (e.key === ' ') e.preventDefault();
      }
      
      // Restart game if game over or won
      if ((gameState.current.gameOver || gameState.current.gameWon) && e.key === ' ') {
        resetGame();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') gameState.current.keys.left = false;
      if (e.key === 'ArrowRight') gameState.current.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === ' ') gameState.current.keys.up = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Generate enemies
    function generateEnemies() {
      const enemies = [];
      const numEnemies = 8;
      
      for (let i = 0; i < numEnemies; i++) {
        // Distribute enemies throughout the level, avoiding start and end areas
        const minX = 400; // Avoid starting area
        const maxX = LEVEL_WIDTH - 800; // Avoid ending area
        const x = minX + Math.random() * (maxX - minX);
        
        enemies.push({
          x: x,
          y: GROUND_LEVEL - 30, // Ground level - enemy height/2
          width: 60,
          height: 60,
          velocityX: Math.random() * 4 - 2, // Random velocity between -2 and 2
          velocityY: 0,
          detectionRadius: 200, // How close the ball needs to be for enemy to chase
          chaseSpeed: 1 + Math.random() * 2, // Random chase speed between 1 and 3
          dead: false,
          image: null // Will be assigned from enemyImages later
        });
      }
      
      return enemies;
    }
    
    // Check if ball is on ground or platform
    function isOnGround() {
      const { ball } = gameState.current;
      
      // Check if on ground
      if (ball.y + ball.radius >= GROUND_LEVEL) { // Ground level
        return true;
      }
      
      return false;
    }
    
    // Check collision between ball and enemy
    function checkEnemyCollision() {
      const { ball, enemies } = gameState.current;
      
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        
        // Calculate distance between centers
        const dx = ball.x - enemy.x;
        const dy = ball.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Collision detected
        if (distance < ball.radius + enemy.width / 2) {
          // If ball is above enemy (stomping)
          if (ball.y < enemy.y - enemy.height / 2 && ball.velocityY > 0) {
            enemy.dead = true;
            ball.velocityY = -ball.jumpStrength * 0.7; // Bounce after stomping
            gameState.current.score += 100;
          } else {
            // Enemy hit the ball
            gameState.current.gameOver = true;
          }
        }
      }
    }
    
    // Reset game state
    function resetGame() {
      gameState.current = {
        ...gameState.current,
        ball: {
          ...gameState.current.ball,
          x: 100,
          y: 580 - 20,
          velocityX: 0,
          velocityY: 0,
          onGround: true
        },
        camera: { x: 0 },
        score: 0,
        gameOver: false,
        gameWon: false,
        keys: {
          left: false,
          right: false,
          up: false
        }
      };
      
      // Regenerate enemies
      gameState.current.enemies = generateEnemies();
      
      // Assign preloaded enemy images to enemies
      for (const enemy of gameState.current.enemies) {
        // Randomly select enemy type
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        enemy.image = enemyImages[randomType];
      }
    }
    
    // Game loop
    function gameLoop() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const { ball, gravity, friction, keys, camera, pointA, pointB, enemies, obstacles } = gameState.current;
      
      if (gameState.current.gameOver || gameState.current.gameWon) {
        // If game is over, just render the scene but don't update physics
        renderScene();
        requestAnimationFrame(gameLoop);
        return;
      }
      
      // Update ball position based on keyboard input
      if (keys.left) ball.velocityX -= ball.speed * 0.1;
      if (keys.right) ball.velocityX += ball.speed * 0.1;
      
      // Apply jump if on ground and up key is pressed
      if (keys.up && isOnGround()) {
        ball.velocityY = -ball.jumpStrength;
        ball.onGround = false;
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
      
      if (ball.x + ball.radius > LEVEL_WIDTH) {
        ball.x = LEVEL_WIDTH - ball.radius;
        ball.velocityX = 0;
      }
      
      // Ground collision
      if (ball.y + ball.radius > GROUND_LEVEL) { // Ground level
        ball.y = GROUND_LEVEL - ball.radius;
        ball.velocityY = 0;
        ball.onGround = true;
      }
      
      // Update camera to follow ball horizontally
      camera.x = Math.max(0, Math.min(ball.x - canvas.width / 2, LEVEL_WIDTH - canvas.width));
      
      // Update enemies
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        
        // Calculate distance to ball
        const dx = ball.x - enemy.x;
        const dy = ball.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Chase ball if within detection radius
        if (distance < enemy.detectionRadius) {
          // Move towards ball
          if (enemy.x < ball.x) {
            enemy.velocityX += enemy.chaseSpeed * 0.05;
          } else {
            enemy.velocityX -= enemy.chaseSpeed * 0.05;
          }
        } else {
          // Random movement
          if (Math.random() < 0.02) {
            enemy.velocityX = Math.random() * 4 - 2; // Random velocity between -2 and 2
          }
        }
        
        // Apply physics to enemy
        enemy.velocityX *= 0.95; // Friction
        enemy.x += enemy.velocityX;
        
        // Keep enemy within level boundaries
        if (enemy.x - enemy.width / 2 < 0) {
          enemy.x = enemy.width / 2;
          enemy.velocityX *= -1;
        }
        
        if (enemy.x + enemy.width / 2 > LEVEL_WIDTH) {
          enemy.x = LEVEL_WIDTH - enemy.width / 2;
          enemy.velocityX *= -1;
        }
      }
      
      // Check for enemy collisions
      checkEnemyCollision();
      
      // Check if player reached the end (pointB)
      const distanceToEnd = Math.sqrt(
        Math.pow(ball.x - pointB.x, 2) + Math.pow(ball.y - pointB.y, 2)
      );
      
      if (distanceToEnd < ball.radius + pointB.size / 4) {
        gameState.current.gameWon = true;
      }
      
      // Render the scene
      renderScene();
      
      // Continue game loop
      requestAnimationFrame(gameLoop);
    }
    
    // Render the game scene
    function renderScene() {
      const { ball, camera, pointA, pointB, background, ground, enemies } = gameState.current;
      
      try {
        // Draw background - static, not scrolling
        if (background.image && background.image.complete && background.image.naturalWidth > 0) {
          // Background stays fixed and doesn't scroll with camera
          ctx.drawImage(background.image, 0, 0, canvas.width, canvas.height);
        } else {
          // Fallback background
          ctx.fillStyle = '#87CEEB'; // Sky blue
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.error('Error drawing background:', error);
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      try {
        // Draw ground - repeated across the level
        if (ground.image && ground.image.complete && ground.image.naturalWidth > 0) {
          // Draw ground tiles across the level
          const groundY = 580 - ground.height;
          const tileWidth = ground.image.width || 64; // Assuming 64px if width not available
          
          // Calculate how many tiles we need to cover the visible area
          const startTile = Math.floor(camera.x / tileWidth);
          const endTile = Math.ceil((camera.x + canvas.width) / tileWidth);
          
          // Draw each tile
          for (let i = startTile; i <= endTile; i++) {
            const x = i * tileWidth - camera.x;
            ctx.drawImage(ground.image, x, groundY, tileWidth, ground.height);
          }
        } else {
          // Fallback ground
          ctx.fillStyle = '#8B4513'; // Brown
          ctx.fillRect(-camera.x, 580 - ground.height, LEVEL_WIDTH, ground.height + 100);
        }
      } catch (error) {
        console.error('Error drawing ground:', error);
        ctx.fillStyle = '#8B4513'; // Brown
        ctx.fillRect(-camera.x, 580 - ground.height, LEVEL_WIDTH, ground.height + 100);
      }
      
      try {
        // Draw point A (starting point)
        if (pointA.image && pointA.image.complete && pointA.image.naturalWidth > 0) {
          ctx.save();
          if (pointA.flipHorizontal) {
            // Flip image horizontally
            ctx.translate(pointA.x - camera.x + pointA.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(pointA.image, 0, pointA.y, pointA.width, pointA.height);
          } else {
            ctx.drawImage(pointA.image, pointA.x - camera.x, pointA.y, pointA.width, pointA.height);
          }
          ctx.restore();
        } else {
          // Fallback starting point
          ctx.fillStyle = '#4CAF50'; // Green
          ctx.fillRect(pointA.x - camera.x, pointA.y, pointA.width, pointA.height);
        }
      } catch (error) {
        console.error('Error drawing point A:', error);
        ctx.fillStyle = '#4CAF50'; // Green
        ctx.fillRect(pointA.x - camera.x, pointA.y, pointA.width, pointA.height);
      }
      
      try {
        // Draw point B (ending point)
        if (pointB.image && pointB.image.complete && pointB.image.naturalWidth > 0) {
          ctx.drawImage(
            pointB.image,
            pointB.x - camera.x - pointB.size / 2,
            pointB.y - pointB.size,
            pointB.size,
            pointB.size
          );
        } else {
          // Fallback ending point
          ctx.fillStyle = '#FFC107'; // Amber
          ctx.beginPath();
          ctx.moveTo(pointB.x - camera.x, pointB.y);
          ctx.lineTo(pointB.x - camera.x - pointB.size / 2, pointB.y - pointB.size);
          ctx.lineTo(pointB.x - camera.x + pointB.size / 2, pointB.y - pointB.size);
          ctx.closePath();
          ctx.fill();
        }
      } catch (error) {
        console.error('Error drawing point B:', error);
        ctx.fillStyle = '#FFC107'; // Amber
        ctx.beginPath();
        ctx.moveTo(pointB.x - camera.x, pointB.y);
        ctx.lineTo(pointB.x - camera.x - pointB.size / 2, pointB.y - pointB.size);
        ctx.lineTo(pointB.x - camera.x + pointB.size / 2, pointB.y - pointB.size);
        ctx.closePath();
        ctx.fill();
      }
      
      // Draw enemies
      enemies.forEach(enemy => {
        if (enemy.dead) return; // Don't draw dead enemies
        
        try {
          if (enemy.image && enemy.image.complete && enemy.image.naturalWidth > 0) {
            ctx.drawImage(
              enemy.image,
              enemy.x - enemy.width / 2 - camera.x,
              enemy.y - enemy.height / 2,
              enemy.width,
              enemy.height
            );
          } else {
            // Fallback enemy
            ctx.fillStyle = '#FF5722'; // Deep orange
            ctx.fillRect(
              enemy.x - enemy.width / 2 - camera.x,
              enemy.y - enemy.height / 2,
              enemy.width,
              enemy.height
            );
          }
        } catch (error) {
          console.error('Error drawing enemy:', error);
          ctx.fillStyle = '#FF5722'; // Deep orange
          ctx.fillRect(
            enemy.x - enemy.width / 2 - camera.x,
            enemy.y - enemy.height / 2,
            enemy.width,
            enemy.height
          );
        }
      });
      
      // Draw ball
      try {
        if (ball.image && ball.image.complete && ball.image.naturalWidth > 0) {
          ctx.drawImage(
            ball.image,
            ball.x - ball.radius - camera.x,
            ball.y - ball.radius,
            ball.radius * 2,
            ball.radius * 2
          );
        } else {
          // Fallback ball
          ctx.fillStyle = '#e1b12c'; // Yellow
          ctx.beginPath();
          ctx.arc(ball.x - camera.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } catch (error) {
        console.error('Error drawing ball:', error);
        ctx.fillStyle = '#e1b12c'; // Yellow
        ctx.beginPath();
        ctx.arc(ball.x - camera.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw score
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${gameState.current.score}`, 20, 40);
      
      // Draw game over or win message
      if (gameState.current.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${gameState.current.score}`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 100);
        ctx.textAlign = 'left';
      }
      
      if (gameState.current.gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${gameState.current.score}`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('Press Space to Play Again', canvas.width / 2, canvas.height / 2 + 100);
        ctx.textAlign = 'left';
      }
    }
    
    // Start the game when images are loaded
    if (imagesLoaded) {
      gameLoop();
    }
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [imagesLoaded]);
  
  return (
    <div className={styles.gameContainer}>
      <canvas
        ref={canvasRef}
        className="canvas"
        width={800}
        height={600}
      />
      
      {!imagesLoaded && (
        <div className={styles.loadingScreen}>
          <div className={styles.loadingText}>
            Loading...
            <div>{totalImagesLoaded}/{totalImagesToLoad.current}</div>
          </div>
        </div>
      )}
    </div>
  );
}
