'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './GameCanvas.module.css';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [totalImagesLoaded, setTotalImagesLoaded] = useState(0);
  const totalImagesToLoad = useRef(6); // Ball, background, ground, court, hoop, enemies (2)
  
  // Game state
  const gameState = useRef({
    gameOver: false,
    gameWon: false,
    score: 0,
    health: 100,
    ball: {
      x: 100,
      y: 300,
      radius: 20,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpStrength: 15,
      onGround: false,
      image: null
    },
    ground: 500,
    gravity: 0.6,
    friction: 0.8,
    backgroundColor: '#87CEEB',
    background: null,
    groundImage: null,
    courtImage: null,
    basketballHoop: {
      x: 700,
      y: 350,
      width: 80,
      height: 150,
      image: null
    },
    camera: {
      x: 0,
      y: 0
    },
    gameTime: 0,
    enemies: [],
    collectibles: []
  });

  // Input state
  const keys = useRef({
    left: false,
    right: false,
    up: false
  });
  
  // Image references
  const imageRefs = useRef({
    ball: null,
    background: null,
    ground: null,
    court: null,
    hoop: null,
    enemies: {}
  });
  
  // Function to handle image loading completion
  const handleImageLoaded = () => {
    setTotalImagesLoaded(prev => {
      const newCount = prev + 1;
      if (newCount >= totalImagesToLoad.current) {
        setImagesLoaded(true);
      }
      return newCount;
    });
  };
  
  // Generate enemies function
  const generateEnemies = () => {
    const enemyTypes = ['Enemy_1.png', 'dog_chase.png'];
    const enemies = [];
    
    // Create 5 enemies
    for (let i = 0; i < 5; i++) {
      const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      enemies.push({
        x: Math.random() * 1500 + 200,
        y: gameState.current.ground - 40,
        width: 40,
        height: 40,
        radius: 20,
        velocityX: Math.random() * 2 - 1,
        velocityY: 0,
        speed: 1 + Math.random() * 2,
        type: 'walker',
        color: '#e84118',
        active: true,
        imageType: randomType
      });
    }
    
    gameState.current.enemies = enemies;
  };
  
  // Initialize game state function
  const initializeGameState = () => {
    return {
      gameOver: false,
      gameWon: false,
      score: 0,
      health: 100,
      ball: {
        x: 100,
        y: 300,
        radius: 20,
        velocityX: 0,
        velocityY: 0,
        speed: 5,
        jumpStrength: 15,
        onGround: false,
        image: imageRefs.current.ball
      },
      ground: 500,
      gravity: 0.6,
      friction: 0.8,
      backgroundColor: '#87CEEB',
      background: imageRefs.current.background,
      groundImage: imageRefs.current.ground,
      courtImage: imageRefs.current.court,
      basketballHoop: {
        x: 700,
        y: 350,
        width: 80,
        height: 150,
        image: imageRefs.current.hoop
      },
      camera: {
        x: 0,
        y: 0
      },
      gameTime: 0,
      enemies: [],
      collectibles: []
    };
  };
  
  // Check if ball is on ground
  const isOnGround = () => {
    const { ball, ground } = gameState.current;
    return ball.y + ball.radius >= ground;
  };
  
  // Check collision between ball and rectangular object
  const checkRectCollision = (ball, rect) => {
    // Find the closest point to the circle within the rectangle
    const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.height));
    
    // Calculate the distance between the circle's center and this closest point
    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;
    
    // If the distance is less than the circle's radius, an intersection occurs
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (ball.radius * ball.radius);
  };
  
  // Check collision between ball and circular object
  const checkCircleCollision = (ball, circle) => {
    const dx = ball.x - circle.x;
    const dy = ball.y - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ball.radius + circle.radius;
  };
  
  // Handle enemy collision
  const handleEnemyCollision = (enemy) => {
    if (gameState.current.gameOver || gameState.current.gameWon) return;
    
    // Decrease health
    gameState.current.health -= 10;
    
    // Check if game over
    if (gameState.current.health <= 0) {
      gameState.current.gameOver = true;
    }
    
    // Bounce off enemy
    const { ball } = gameState.current;
    const dx = ball.x - enemy.x;
    const dy = ball.y - enemy.y;
    const angle = Math.atan2(dy, dx);
    
    ball.velocityX = Math.cos(angle) * 10;
    ball.velocityY = Math.min(Math.sin(angle) * 10, -10); // Ensure upward bounce
  };
  
  // Check if ball reached goal (basketball hoop)
  const checkGoal = () => {
    const { ball, basketballHoop } = gameState.current;
    
    // Check if ball is inside the hoop
    if (ball.x > basketballHoop.x + 20 && 
        ball.x < basketballHoop.x + basketballHoop.width - 20 &&
        ball.y > basketballHoop.y && 
        ball.y < basketballHoop.y + 30) {
      
      // Score points
      gameState.current.score += 10;
      
      // Check if won
      if (gameState.current.score >= 50) {
        gameState.current.gameWon = true;
      }
      
      // Reset ball position
      ball.x = 100;
      ball.y = 300;
      ball.velocityX = 0;
      ball.velocityY = 0;
    }
  };
  
  // Load images - only runs in browser environment
  useEffect(() => {
    // Initialize images only on client-side
    if (typeof window !== 'undefined') {
      // Create image objects
      const ballImage = new Image();
      const backgroundImage = new Image();
      const groundImage = new Image();
      const courtImage = new Image();
      const hoopImage = new Image();
      
      // Enemy images
      const enemy1Image = new Image();
      const dogImage = new Image();
      
      // Error handler for images
      const handleImageError = (imageName) => {
        console.error(`Failed to load image: ${imageName}`);
        // Count as loaded to avoid blocking the game
        handleImageLoaded();
      };
      
      // Set up load event handlers
      ballImage.onload = handleImageLoaded;
      backgroundImage.onload = handleImageLoaded;
      groundImage.onload = handleImageLoaded;
      courtImage.onload = handleImageLoaded;
      hoopImage.onload = handleImageLoaded;
      enemy1Image.onload = handleImageLoaded;
      
      // Set up error handlers
      ballImage.onerror = () => handleImageError('basketball.png');
      backgroundImage.onerror = () => handleImageError('city_background.jpg');
      groundImage.onerror = () => handleImageError('ground.png');
      courtImage.onerror = () => handleImageError('basketball_court.jpg');
      hoopImage.onerror = () => handleImageError('basketball_hoop.png');
      enemy1Image.onerror = () => handleImageError('Enemy_1.png');
      dogImage.onerror = () => handleImageError('dog_chase.png');
      
      // Set sources - do this after setting up handlers
      ballImage.src = '/images/basketball.png';
      backgroundImage.src = '/images/city_background.jpg';
      groundImage.src = '/images/ground.png';
      courtImage.src = '/images/basketball_court.jpg';
      hoopImage.src = '/images/basketball_hoop.png';
      enemy1Image.src = '/images/Enemy_1.png';
      dogImage.src = '/images/dog_chase.png';
      
      // Store references
      imageRefs.current.ball = ballImage;
      imageRefs.current.background = backgroundImage;
      imageRefs.current.ground = groundImage;
      imageRefs.current.court = courtImage;
      imageRefs.current.hoop = hoopImage;
      
      // Store enemy images
      imageRefs.current.enemies = {
        'Enemy_1.png': enemy1Image,
        'dog_chase.png': dogImage
      };
      
      // Set up keyboard event handlers
      const handleKeyDown = (e) => {
        if (e.code === 'ArrowLeft') keys.current.left = true;
        if (e.code === 'ArrowRight') keys.current.right = true;
        if (e.code === 'ArrowUp' || e.code === 'Space') keys.current.up = true;
      };
      
      const handleKeyUp = (e) => {
        if (e.code === 'ArrowLeft') keys.current.left = false;
        if (e.code === 'ArrowRight') keys.current.right = false;
        if (e.code === 'ArrowUp' || e.code === 'Space') keys.current.up = false;
      };
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      // Initialize game state with images
      gameState.current = initializeGameState();
      
      // Generate enemies
      generateEnemies();
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, []);
  
  // Game loop
  useEffect(() => {
    // Only run canvas code in browser environment
    if (typeof window === 'undefined' || !canvasRef.current || totalImagesLoaded < totalImagesToLoad.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    
    const gameLoop = () => {
      const { ball, enemies, ground, gravity, friction, camera, basketballHoop } = gameState.current;
      
      // Update game time
      gameState.current.gameTime++;
      
      // Skip updates if game over or won
      if (!gameState.current.gameOver && !gameState.current.gameWon) {
        // Handle input
        if (keys.current.left) {
          ball.velocityX -= ball.speed * 0.1;
        }
        if (keys.current.right) {
          ball.velocityX += ball.speed * 0.1;
        }
        if (keys.current.up && isOnGround()) {
          ball.velocityY = -ball.jumpStrength;
        }
        
        // Apply physics
        ball.velocityY += gravity;
        ball.velocityX *= friction;
        
        // Update position
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;
        
        // Ground collision
        if (ball.y + ball.radius > ground) {
          ball.y = ground - ball.radius;
          ball.velocityY = 0;
        }
        
        // Update camera to follow ball
        camera.x = ball.x - canvas.width / 2;
        
        // Keep camera within bounds
        camera.x = Math.max(0, camera.x);
        
        // Update enemies
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          
          // Move towards player if close
          const distanceToPlayer = Math.abs(enemy.x - ball.x);
          if (distanceToPlayer < 300) {
            enemy.velocityX = enemy.x < ball.x ? enemy.speed : -enemy.speed;
          } else {
            // Random movement
            if (Math.random() < 0.01) {
              enemy.velocityX = Math.random() * 2 - 1;
            }
          }
          
          // Update enemy position
          enemy.x += enemy.velocityX;
          
          // Keep enemy on ground
          enemy.y = ground - enemy.height / 2;
          
          // Simple bounds checking
          if (enemy.x < 0 || enemy.x > 2000) {
            enemy.velocityX = -enemy.velocityX;
          }
          
          // Check collision with player
          if (checkCircleCollision(ball, enemy)) {
            handleEnemyCollision(enemy);
          }
        }
        
        // Check if ball reached goal
        checkGoal();
      }
      
      // Render the scene
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      try {
        if (gameState.current.background && gameState.current.background.complete && gameState.current.background.naturalWidth > 0) {
          ctx.drawImage(gameState.current.background, 0, 0, canvas.width, canvas.height);
        } else {
          // Fallback to color background
          ctx.fillStyle = gameState.current.backgroundColor || '#87CEEB';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.error('Error drawing background:', error);
        // Fallback to color background
        ctx.fillStyle = gameState.current.backgroundColor || '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw basketball court
      try {
        if (gameState.current.courtImage && gameState.current.courtImage.complete && gameState.current.courtImage.naturalWidth > 0) {
          ctx.drawImage(
            gameState.current.courtImage,
            0 - camera.x,
            ground - 100,
            1000,
            100
          );
        }
      } catch (error) {
        console.error('Error drawing court:', error);
      }
      
      // Draw ground
      try {
        if (gameState.current.groundImage && gameState.current.groundImage.complete && gameState.current.groundImage.naturalWidth > 0) {
          const groundImg = gameState.current.groundImage;
          const groundHeight = 40; // Height of the ground image
          for (let x = 0; x < canvas.width + groundImg.width; x += groundImg.width) {
            ctx.drawImage(groundImg, x - camera.x % groundImg.width, ground, groundImg.width, groundHeight);
          }
        } else {
          // Fallback to simple ground
          ctx.fillStyle = '#2f3542';
          ctx.fillRect(0, ground, canvas.width, 40);
        }
      } catch (error) {
        console.error('Error drawing ground:', error);
        // Fallback to simple ground
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(0, ground, canvas.width, 40);
      }
      
      // Draw basketball hoop
      try {
        if (basketballHoop.image && basketballHoop.image.complete && basketballHoop.image.naturalWidth > 0) {
          ctx.drawImage(
            basketballHoop.image,
            basketballHoop.x - camera.x,
            basketballHoop.y,
            basketballHoop.width,
            basketballHoop.height
          );
        } else {
          // Fallback to simple hoop
          ctx.fillStyle = '#e84118';
          ctx.fillRect(basketballHoop.x - camera.x, basketballHoop.y, basketballHoop.width, basketballHoop.height);
        }
      } catch (error) {
        console.error('Error drawing basketball hoop:', error);
        // Fallback to simple hoop
        ctx.fillStyle = '#e84118';
        ctx.fillRect(basketballHoop.x - camera.x, basketballHoop.y, basketballHoop.width, basketballHoop.height);
      }
      
      // Draw enemies
      enemies.forEach(enemy => {
        if (!enemy.active) return;
        
        try {
          const enemyImage = enemy.imageType && imageRefs.current.enemies[enemy.imageType];
          if (enemyImage && enemyImage.complete && enemyImage.naturalWidth > 0) {
            // Draw enemy using image
            ctx.drawImage(
              enemyImage,
              enemy.x - enemy.radius - camera.x,
              enemy.y - enemy.radius,
              enemy.radius * 2,
              enemy.radius * 2
            );
          } else {
            // Fallback to simple enemy
            ctx.fillStyle = enemy.color || '#e84118';
            ctx.beginPath();
            ctx.arc(enemy.x - camera.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        } catch (error) {
          console.error('Error drawing enemy:', error);
          // Fallback to simple enemy
          ctx.fillStyle = enemy.color || '#e84118';
          ctx.beginPath();
          ctx.arc(enemy.x - camera.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
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
          // Fallback to simple ball
          ctx.fillStyle = '#e1b12c';
          ctx.beginPath();
          ctx.arc(ball.x - camera.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } catch (error) {
        console.error('Error drawing ball:', error);
        // Fallback to simple ball
        ctx.fillStyle = '#e1b12c';
        ctx.beginPath();
        ctx.arc(ball.x - camera.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw UI - score and health
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${gameState.current.score}`, 20, 30);
      ctx.fillText(`Health: ${gameState.current.health}`, 20, 60);
      
      // Draw game over screen
      if (gameState.current.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${gameState.current.score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 40);
      }
      
      // Draw win screen
      if (gameState.current.gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${gameState.current.score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Press Space to Play Again', canvas.width / 2, canvas.height / 2 + 40);
      }
      
      // Continue the game loop
      animationFrameId = window.requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    gameLoop();
    
    // Cleanup on unmount
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [imagesLoaded]);
  
  // Handle restart on game over or win
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleRestart = (e) => {
      if ((gameState.current.gameOver || gameState.current.gameWon) && e.code === 'Space') {
        // Reset game state
        gameState.current = initializeGameState();
        
        // Generate enemies
        generateEnemies();
      }
    };
    
    window.addEventListener('keydown', handleRestart);
    
    return () => {
      window.removeEventListener('keydown', handleRestart);
    };
  }, []);
  
  // Render the game for display
  const renderGame = () => {
    if (typeof window === 'undefined' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Show loading screen if images aren't loaded
    if (!imagesLoaded) {
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = '24px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('Loading...', canvas.width/2, canvas.height/2);
      ctx.fillText(`${totalImagesLoaded}/${totalImagesToLoad.current}`, canvas.width/2, canvas.height/2 + 30);
    }
  };
  
  // Start rendering when component mounts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let animationFrameId;
    
    const renderLoop = () => {
      renderGame();
      animationFrameId = window.requestAnimationFrame(renderLoop);
    };
    
    // Only start render loop if images aren't loaded yet
    // Once images are loaded, the game loop will handle rendering
    if (!imagesLoaded) {
      renderLoop();
    }
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [imagesLoaded]);
  
  return (
    <div className={styles.gameContainer}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={800}
        height={600}
      />
    </div>
  );
}