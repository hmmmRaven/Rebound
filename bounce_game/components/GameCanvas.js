'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './GameCanvas.module.css';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [totalImagesLoaded, setTotalImagesLoaded] = useState(0);
  const totalImagesToLoad = useRef(7); // Ball, background, ground, pointA, pointB, enemy_1, enemy_2
  
  // Level layout from CSV
  const levelGrid = [
    ['air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air'],
    ['air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air'],
    ['air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air'],
    ['air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air'],
    ['air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air', 'air'],
    ['Spawn', 'player', 'air', 'enemy_1', 'air', 'air', 'air', 'enemy_2', 'air', 'end'],
    ['ground_city.png', 'ground_city.png', 'ground_city.png', 'ground_city.png', 'ground_city.png', 'ground_city.png', 'ground_city.png', 'ground_city.png', 'ground_city.png', 'ground_city.png']
  ];
  
  // Constants
  const GRID_SIZE = 64; // Size of each grid cell in pixels
  const LEVEL_WIDTH = levelGrid[0].length * GRID_SIZE; // Width based on grid
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  
  // Constants for ground level
  const GROUND_HEIGHT = 40; // Height of the ground image
  const GROUND_LEVEL = CANVAS_HEIGHT - GROUND_HEIGHT; // Top of ground image (at bottom of screen)
  
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
      x: 0, // Will be set based on grid
      y: 0, // Will be set based on grid
      width: 192,
      height: 300,
      image: null,
      flipHorizontal: true // Flag to flip the image horizontally
    },
    pointB: {
      x: 0, // Will be set based on grid
      y: 0, // Will be set based on grid
      size: 64, // Size based on grid
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
    },
    // Grid-based level data
    grid: levelGrid,
    gridSize: GRID_SIZE
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
    
    // Initialize game objects based on grid
    // Set initial positions for point A and point B
    for (let row = 0; row < levelGrid.length; row++) {
      for (let col = 0; col < levelGrid[row].length; col++) {
        if (levelGrid[row][col] === 'Spawn') {
          gameState.current.pointA.x = col * GRID_SIZE;
          gameState.current.pointA.y = row * GRID_SIZE;
        }
        if (levelGrid[row][col] === 'end') {
          gameState.current.pointB.x = col * GRID_SIZE + GRID_SIZE / 2;
          gameState.current.pointB.y = row * GRID_SIZE + GRID_SIZE;
        }
      }
    }
    
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
    
    // Generate enemies from grid
    function generateEnemies() {
      const enemies = [];
      
      // Find enemies in the grid
      for (let row = 0; row < levelGrid.length; row++) {
        for (let col = 0; col < levelGrid[row].length; col++) {
          const cell = levelGrid[row][col];
          if (cell === 'enemy_1' || cell === 'enemy_2') {
            enemies.push({
              x: col * GRID_SIZE + GRID_SIZE / 2, // Center of the grid cell
              y: row * GRID_SIZE + GRID_SIZE / 2, // Center of the grid cell
              width: 60,
              height: 60,
              velocityX: 0,
              velocityY: 0,
              detectionRadius: 200,
              chaseSpeed: 3,
              dead: false,
              enemyType: cell, // Store the enemy type
              image: null // Will be assigned from enemyImages later
            });
          }
        }
      }
      
      return enemies;
    }
    
    // Check if ball is on ground or platform
    function isOnGround() {
      const { ball, grid, gridSize } = gameState.current;
      
      // Calculate grid position
      const gridX = Math.floor(ball.x / gridSize);
      const gridY = Math.floor((ball.y + ball.radius + 1) / gridSize); // Check just below the ball
      
      // Check if position is within grid bounds
      if (gridY >= 0 && gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
        // Check if the cell below contains ground
        const cellBelow = grid[gridY][gridX];
        if (cellBelow && cellBelow.includes('ground')) {
          // Adjust ball position to sit on top of ground
          ball.y = gridY * gridSize - ball.radius;
          return true;
        }
      }
      
      // Check if on bottom of screen (fallback)
      if (ball.y + ball.radius >= GROUND_LEVEL) {
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
      // Find player position in grid
      let playerX = 100;
      let playerY = 580 - 20;
      
      // Find player in grid
      for (let row = 0; row < levelGrid.length; row++) {
        for (let col = 0; col < levelGrid[row].length; col++) {
          if (levelGrid[row][col] === 'player') {
            playerX = col * GRID_SIZE + GRID_SIZE / 2;
            playerY = row * GRID_SIZE + GRID_SIZE / 2;
          }
        }
      }
      
      gameState.current = {
        ...gameState.current,
        ball: {
          ...gameState.current.ball,
          x: playerX,
          y: playerY,
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
        // Assign image based on enemy type
        const imageType = enemy.enemyType === 'enemy_1' ? 'Enemy_1.png' : 'dog_chase.png';
        enemy.image = enemyImages[imageType];
      }
      
      // Set point A and point B positions based on grid
      for (let row = 0; row < levelGrid.length; row++) {
        for (let col = 0; col < levelGrid[row].length; col++) {
          if (levelGrid[row][col] === 'Spawn') {
            gameState.current.pointA.x = col * GRID_SIZE;
            gameState.current.pointA.y = row * GRID_SIZE;
          }
          if (levelGrid[row][col] === 'end') {
            gameState.current.pointB.x = col * GRID_SIZE + GRID_SIZE / 2;
            gameState.current.pointB.y = row * GRID_SIZE + GRID_SIZE;
          }
        }
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
        
        // Always move left at constant speed regardless of player position
        enemy.velocityX = -enemy.chaseSpeed;
        
        // Apply enemy movement
        enemy.x += enemy.velocityX;
        
        // Mark enemy for removal if it goes off screen to the left
        if (enemy.x + enemy.width < camera.x - 100) { // Give some buffer off-screen
          enemy.dead = true; // Mark as dead so it won't be rendered or updated
          continue; // Skip the rest of the loop for this enemy
        }
        
        // Only prevent going off the right edge of the level
        if (enemy.x + enemy.width / 2 > LEVEL_WIDTH) {
          enemy.x = LEVEL_WIDTH - enemy.width / 2;
        }
        
        // Check collision with other enemies
        for (const otherEnemy of enemies) {
          if (enemy === otherEnemy || enemy.dead || otherEnemy.dead) continue;
          
          // Calculate distance between enemies
          const enemyDx = enemy.x - otherEnemy.x;
          const enemyDy = enemy.y - otherEnemy.y;
          const enemyDistance = Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy);
          
          // Collision detected
          const minDistance = enemy.width / 2 + otherEnemy.width / 2;
          if (enemyDistance < minDistance) {
            // Push enemies apart
            const pushDirection = enemyDx / enemyDistance;
            const pushAmount = (minDistance - enemyDistance) / 2;
            
            enemy.x += pushDirection * pushAmount;
            otherEnemy.x -= pushDirection * pushAmount;
          }
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
      const { ball, camera, pointA, pointB, background, ground, enemies, grid, gridSize } = gameState.current;
      
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
      
      // Draw grid-based level (for debugging)
      // for (let row = 0; row < grid.length; row++) {
      //   for (let col = 0; col < grid[row].length; col++) {
      //     const cellX = col * gridSize - camera.x;
      //     const cellY = row * gridSize;
      //     
      //     // Only draw cells that are visible on screen
      //     if (cellX > -gridSize && cellX < canvas.width && cellY > -gridSize && cellY < canvas.height) {
      //       // Draw grid cell outline
      //       ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      //       ctx.strokeRect(cellX, cellY, gridSize, gridSize);
      //       
      //       // Draw cell type for debugging
      //       ctx.fillStyle = 'white';
      //       ctx.font = '10px Arial';
      //       ctx.fillText(grid[row][col], cellX + 2, cellY + 10);
      //     }
      //   }
      // }
      
      try {
        // Draw ground based on grid
        if (ground.image && ground.image.complete && ground.image.naturalWidth > 0) {
          // Draw ground tiles where specified in the grid
          for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
              if (grid[row][col].includes('ground')) {
                const cellX = col * gridSize - camera.x;
                const cellY = row * gridSize;
                
                // Only draw if visible on screen
                if (cellX > -gridSize && cellX < canvas.width && cellY > -gridSize && cellY < canvas.height) {
                  ctx.drawImage(ground.image, cellX, cellY, gridSize, ground.height);
                }
              }
            }
          }
        } else {
          // Fallback ground
          for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
              if (grid[row][col].includes('ground')) {
                const cellX = col * gridSize - camera.x;
                const cellY = row * gridSize;
                
                if (cellX > -gridSize && cellX < canvas.width && cellY > -gridSize && cellY < canvas.height) {
                  ctx.fillStyle = '#8B4513'; // Brown
                  ctx.fillRect(cellX, cellY, gridSize, ground.height);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error drawing ground:', error);
        // Fallback ground
        for (let row = 0; row < grid.length; row++) {
          for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col].includes('ground')) {
              const cellX = col * gridSize - camera.x;
              const cellY = row * gridSize;
              
              if (cellX > -gridSize && cellX < canvas.width && cellY > -gridSize && cellY < canvas.height) {
                ctx.fillStyle = '#8B4513'; // Brown
                ctx.fillRect(cellX, cellY, gridSize, ground.height);
              }
            }
          }
        }
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
