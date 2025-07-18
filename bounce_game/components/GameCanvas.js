'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './GameCanvas.module.css';
import { getLevel, enemyTypes, obstacleTypes, collectibleEffects } from '../data/levels';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    up: false,
  });
  
  // Game UI state
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [powerUps, setPowerUps] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Get level data
  const currentLevel = getLevel(0); // Start with the first level
  
  // Enemy types
  const enemyTypes = ['Enemy_1.png', 'dog_chase.png'];
  
  // Image references - initialized as empty objects to be filled in useEffect
  const imageRefs = useRef({
    ball: null,
    background: null,
    ground: null,
    enemies: {}
  });
  
  // Game state
  const gameState = useRef({
    ball: {
      x: currentLevel.ballStart.x,
      y: currentLevel.ballStart.y,
      radius: 20,
      velocityX: 0,
      velocityY: 0,
      speed: 5,
      jumpStrength: 15,
      isJumping: false,
      color: '#ff4757',
      invincible: false,
      invincibleTimer: 0,
      image: null
    },
    platforms: currentLevel.platforms,
    obstacles: [], // Empty obstacles array - no obstacles in the game
    enemies: currentLevel.enemies.map(enemy => ({
      ...enemy,
      active: true,
      lastJump: 0, // For jumper enemies
      image: null
    })),
    collectibles: currentLevel.collectibles.map(collectible => ({
      ...collectible,
      active: true
    })),
    gravity: 0.8,
    friction: 0.8,
    ground: currentLevel.boundaries.height - 20, // Canvas height - ball radius
    backgroundColor: currentLevel.backgroundColor,
    gameTime: 0,
    background: null,
    groundImage: null
  });

  // Load images - only runs in browser environment
  useEffect(() => {
    // Initialize images only on client-side
    if (typeof window !== 'undefined') {
      // Create Image objects
      imageRefs.current.ball = new Image();
      imageRefs.current.background = new Image();
      imageRefs.current.ground = new Image();
      
      // Load ball image
      imageRefs.current.ball.src = '/images/basketball.png';
      imageRefs.current.ball.onload = () => {
        gameState.current.ball.image = imageRefs.current.ball;
      };
      
      // Load background image
      imageRefs.current.background.src = '/images/background_city.jpg';
      imageRefs.current.background.onload = () => {
        gameState.current.background = imageRefs.current.background;
      };
      
      // Load ground image
      imageRefs.current.ground.src = '/images/ground_city.png';
      imageRefs.current.ground.onload = () => {
        gameState.current.groundImage = imageRefs.current.ground;
      };
      
      // Preload enemy images
      enemyTypes.forEach(type => {
        imageRefs.current.enemies[type] = new Image();
        imageRefs.current.enemies[type].src = `/images/${type}`;
      });
      
      // Assign random enemy images
      gameState.current.enemies.forEach(enemy => {
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        enemy.imageType = randomType;
      });
      
      // Set images loaded flag
      const checkAllImagesLoaded = setInterval(() => {
        if (gameState.current.ball.image && 
            gameState.current.background && 
            gameState.current.groundImage && 
            Object.keys(imageRefs.current.enemies).every(key => imageRefs.current.enemies[key].complete)) {
          setImagesLoaded(true);
          clearInterval(checkAllImagesLoaded);
        }
      }, 100);
      
      return () => clearInterval(checkAllImagesLoaded);
    }
  }, []);
  
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
    
    return distance < (ball.radius + circle.radius);
  };
  
  // Apply damage to player
  const applyDamage = (damageAmount) => {
    const { ball } = gameState.current;
    
    // Skip damage if player is invincible
    if (ball.invincible) return;
    
    // Apply damage and update health
    setHealth(prevHealth => {
      const newHealth = Math.max(0, prevHealth - damageAmount);
      
      // Check for game over
      if (newHealth <= 0) {
        setGameOver(true);
      }
      
      return newHealth;
    });
    
    // Make player temporarily invincible
    ball.invincible = true;
    ball.invincibleTimer = 60; // Frames of invincibility
  };
  
  // Handle enemy collision
  const handleEnemyCollision = (enemy) => {
    const { ball } = gameState.current;
    const enemyInfo = enemyTypes[enemy.type];
    
    // Check if player is landing on top of the enemy
    const isLandingOnEnemy = 
      ball.velocityY > 0 && 
      ball.y < enemy.y - enemy.height/2 &&
      enemyInfo.canBeJumpedOn;
    
    if (isLandingOnEnemy) {
      // Bounce off enemy
      ball.velocityY = -ball.jumpStrength * 0.7;
      
      // Deactivate enemy
      enemy.active = false;
      
      // Add score
      setScore(prev => prev + 50);
    } else {
      // Player takes damage
      applyDamage(enemyInfo.damage);
    }
  };
  
  // Handle obstacle collision
  const handleObstacleCollision = (obstacle) => {
    const obstacleInfo = obstacleTypes[obstacle.type];
    applyDamage(obstacleInfo.damage);
  };
  
  // Handle collectible collection
  const handleCollectibleCollection = (collectible) => {
    // Deactivate collectible
    collectible.active = false;
    
    if (collectible.type === 'coin') {
      // Add score
      setScore(prev => prev + collectible.value);
    } else if (collectible.type === 'powerup') {
      // Apply power-up effect
      const effect = collectible.effect;
      const effectInfo = collectibleEffects.powerup[effect];
      
      // Add to active power-ups
      setPowerUps(prev => [
        ...prev,
        {
          type: effect,
          duration: effectInfo.duration,
          startTime: gameState.current.gameTime,
          ...effectInfo
        }
      ]);
      
      // Apply immediate effects
      if (effect === 'jump_boost') {
        gameState.current.ball.jumpStrength *= effectInfo.multiplier;
      }
    }
  };
  
  // Game loop
  useEffect(() => {
    // Only run canvas code in browser environment
    if (typeof window === 'undefined' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      if (gameOver) {
        // Show game over screen
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '48px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Press Space to Restart', canvas.width/2, canvas.height/2 + 60);
        
        // Check for restart
        if (keys.up) {
          // Reset game
          setGameOver(false);
          setHealth(100);
          setScore(0);
          setPowerUps([]);
          
          // Reset game state
          gameState.current = {
            ...gameState.current,
            ball: {
              ...gameState.current.ball,
              x: currentLevel.ballStart.x,
              y: currentLevel.ballStart.y,
              velocityX: 0,
              velocityY: 0,
              invincible: false,
              invincibleTimer: 0
            },
            obstacles: [], // Keep obstacles empty
            enemies: currentLevel.enemies.map(enemy => ({
              ...enemy,
              active: true,
              lastJump: 0
            })),
            collectibles: currentLevel.collectibles.map(collectible => ({
              ...collectible,
              active: true
            })),
            gameTime: 0
          };
        }
        
        animationFrameId = window.requestAnimationFrame(render);
        return;
      }
      
      // Increment game time
      gameState.current.gameTime++;
      
      // Clear canvas
      ctx.fillStyle = gameState.current.backgroundColor || '#f1f2f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const { ball, platforms, obstacles, enemies, collectibles, gravity, friction } = gameState.current;

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
      
      // Update enemies
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        
        if (enemy.type === 'walker') {
          // Move enemy back and forth
          enemy.x += enemy.speed * enemy.direction;
          
          // Change direction at patrol boundaries
          if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
            enemy.direction *= -1;
          }
        } else if (enemy.type === 'jumper') {
          // Make enemy jump at intervals
          if (gameState.current.gameTime - enemy.lastJump > enemy.jumpInterval / (1000/60)) {
            enemy.velocityY = -enemy.jumpHeight * 0.1;
            enemy.lastJump = gameState.current.gameTime;
          }
          
          // Apply gravity
          enemy.velocityY = enemy.velocityY || 0;
          enemy.velocityY += gravity * 0.5;
          enemy.y += enemy.velocityY;
          
          // Check ground collision for jumper
          const platformBelow = platforms.find(p => 
            enemy.x + enemy.width > p.x &&
            enemy.x < p.x + p.width &&
            enemy.y + enemy.height >= p.y - 1 &&
            enemy.y + enemy.height <= p.y + 5
          );
          
          if (platformBelow) {
            enemy.y = platformBelow.y - enemy.height;
            enemy.velocityY = 0;
          }
        }
        
        // Check collision with player
        if (checkRectCollision(ball, enemy)) {
          handleEnemyCollision(enemy);
        }
      }
      
      // No obstacle collisions - obstacles have been removed
      
      // Check collectible collisions
      for (const collectible of collectibles) {
        if (!collectible.active) continue;
        
        if (checkCircleCollision(ball, collectible)) {
          handleCollectibleCollection(collectible);
        }
      }
      
      // Update power-ups
      setPowerUps(prev => {
        const currentTime = gameState.current.gameTime;
        const activePowerUps = prev.filter(powerUp => {
          const isActive = currentTime - powerUp.startTime < powerUp.duration / (1000/60);
          
          // Remove effect when power-up expires
          if (!isActive && powerUp.type === 'jump_boost') {
            gameState.current.ball.jumpStrength /= powerUp.multiplier;
          }
          
          return isActive;
        });
        
        return activePowerUps;
      });
      
      // Update invincibility
      if (ball.invincible) {
        ball.invincibleTimer--;
        if (ball.invincibleTimer <= 0) {
          ball.invincible = false;
        }
      }

      // Draw background
      if (gameState.current.background) {
        ctx.drawImage(gameState.current.background, 0, 0, canvas.width, canvas.height);
      } else {
        // Fallback to color background
        ctx.fillStyle = gameState.current.backgroundColor || '#f1f2f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw ground
      if (gameState.current.groundImage) {
        const groundImg = gameState.current.groundImage;
        const groundHeight = 40; // Height of the ground image
        for (let x = 0; x < canvas.width; x += groundImg.width) {
          ctx.drawImage(groundImg, x, gameState.current.ground + ball.radius - 5, groundImg.width, groundHeight);
        }
      } else {
        // Fallback to simple ground
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(0, gameState.current.ground + ball.radius, canvas.width, 5);
      }
      
      // Draw platforms
      platforms.forEach(platform => {
        ctx.fillStyle = platform.color || '#3742fa';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      });
      
      // No obstacles to draw
      
      // Draw enemies
      enemies.forEach(enemy => {
        if (!enemy.active) return;
        
        if (enemy.imageType && imageRefs.current.enemies[enemy.imageType]) {
          // Draw enemy using image
          ctx.drawImage(
            imageRefs.current.enemies[enemy.imageType], 
            enemy.x - enemy.width/2, 
            enemy.y - enemy.height/2, 
            enemy.width * 2, 
            enemy.height * 2
          );
        } else {
          // Fallback to rectangle with eyes
          ctx.fillStyle = enemy.color;
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          
          // Draw enemy details
          if (enemy.type === 'walker') {
            // Draw eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.3, 5, 0, Math.PI * 2);
            ctx.arc(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.3, 5, 0, Math.PI * 2);
            ctx.fill();
          } else if (enemy.type === 'jumper') {
            // Draw jumper details
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.3, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      
      // Draw collectibles
      collectibles.forEach(collectible => {
        if (!collectible.active) return;
        
        ctx.fillStyle = collectible.color;
        ctx.beginPath();
        ctx.arc(collectible.x, collectible.y, collectible.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (collectible.type === 'coin') {
          // Draw coin details
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(collectible.x, collectible.y, collectible.radius - 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (collectible.type === 'powerup') {
          // Draw power-up details
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('P', collectible.x, collectible.y + 4);
        }
      });

      // Draw ball with image or fallback to circle
      if (ball.image) {
        ctx.drawImage(
          ball.image, 
          ball.x - ball.radius, 
          ball.y - ball.radius, 
          ball.radius * 2, 
          ball.radius * 2
        );
      } else {
        // Fallback to simple ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        
        if (ball.invincible && Math.floor(gameState.current.gameTime / 5) % 2 === 0) {
          // Flashing effect when invincible
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = ball.color;
        }
        
        ctx.fill();
        ctx.closePath();
      }
      
      // Draw UI
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(10, 10, 200, 60);
      
      // Draw health bar
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(20, 20, 180 * (health / 100), 15);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(20, 20, 180, 15);
      
      // Draw score
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 55);
      
      // Draw active power-ups
      powerUps.forEach((powerUp, index) => {
        const timeLeft = Math.ceil((powerUp.duration - (gameState.current.gameTime - powerUp.startTime) * (1000/60)) / 1000);
        ctx.fillStyle = '#2ed573';
        ctx.fillText(`${powerUp.type}: ${timeLeft}s`, 120, 55);
      });

      // Continue animation
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [keys]);

  return (
    <div className={styles.gameContainer}>
      <canvas 
        ref={canvasRef} 
        className={styles.canvas} 
        width={currentLevel.boundaries.width} 
        height={currentLevel.boundaries.height} 
        tabIndex={0}
      />
      {gameOver && (
        <div className={styles.gameOverlay}>
          <h2>Game Over</h2>
          <p>Score: {score}</p>
          <p>Press Space to Restart</p>
        </div>
      )}
    </div>
  );
}
