'use client';

import { useEffect, useRef, useState } from 'react';

/*
  Big upgrade: 
  • World now scrolls horizontally once the ball reaches the center.
  • Player moves with ← → and jumps with ↑ (only when on ground or trampoline).
  • Random trampoline platforms; regular ground doesn’t auto-bounce.
  • Enemies chase the player; stomping defeats them, side collision costs a life.
  • 3-life system rendered as 🏀🏀🏀 at top-left.
  • Extra spike variant supported.
*/

// Constants
const S = 2; // global size scale (larger visuals)
const GRAVITY = 0.6 * S;
const JUMP_VELOCITY = -12 * S;
const MOVE_SPEED = 5 * S;
const CANVAS_WIDTH = 800;
const WORLD_WIDTH = CANVAS_WIDTH * 5; // each level spans 5 screen widths
const CANVAS_HEIGHT = 600;
const GROUND_H = 120;
const INITIAL_LIVES = 3;

// Level definitions
const LEVELS = [
  {
    startDecor: '/background_court.png',
    loopBg: '/background_city.jpg',
    endDecor: '/pyramid.png',
    ground: '/ground_city.png',
  },
  {
    startDecor: '/pyramid.png',
    loopBg: '/background_desert.jpg',
    endDecor: '/treehouse.png',
    ground: '/ground_desert.png',
  },
  {
    startDecor: '/treehouse.png',
    loopBg: '/background_forest.jpg',
    endDecor: '/background_ocean.jpg',
    ground: '/ground_forest.png',
  },
  {
    startBg: '/background_court.jpg',
    endBg: '/background_desert.jpg',
    ground: '/ground_city.png',
    bg: '/background_city.png',
    endMarker: '/pyramid.png',
  },
];

function loadImage(src) {
  const img = new Image();
  // Add absolute path to ensure images load correctly
  img.src = `/bounce_game/public${src}`;
  img.onerror = (e) => console.error(`Failed to load image: ${src}`, e);
  console.log(`Attempting to load image: /bounce_game/public${src}`);
  return img;
}

export default function GameCanvas() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const resettingRef = useRef(false);
  const [restartKey, setRestartKey] = useState(0);
  const canvasRef = useRef(null);
  const assetsRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const livesRef = useRef(INITIAL_LIVES);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);
  
  // Reset game over state on component mount
  useEffect(() => {
    setGameOver(false);
    gameOverRef.current = false;
  }, []);

  useEffect(() => {
    // reset load state whenever level changes
    setLoaded(false);
    assetsRef.current = null;

    const levelCfg = LEVELS[levelIdx];

    // Try multiple paths for basketball.png to ensure it loads
    const basketballPaths = [
      '/basketball.png',                  // Root path
      'basketball.png',                   // Relative path
      '/bounce_game/public/basketball.png', // Full path
      '../public/basketball.png',         // Relative to component
      './public/basketball.png',          // Another relative path
    ];
    
    // Create a special basketball image with multiple fallback paths
    const basketballImg = new Image();
    let currentPathIndex = 0;
    
    const tryNextBasketballPath = () => {
      if (currentPathIndex < basketballPaths.length) {
        basketballImg.src = basketballPaths[currentPathIndex];
        console.log(`Trying to load basketball from: ${basketballImg.src}`);
        currentPathIndex++;
      } else {
        console.error('Failed to load basketball image after trying all paths');
      }
    };
    
    basketballImg.onload = () => {
      console.log('Basketball image loaded successfully:', basketballImg.src);
    };
    
    basketballImg.onerror = () => {
      console.error(`Failed to load basketball from: ${basketballImg.src}`);
      tryNextBasketballPath();
    };
    
    // Start loading process
    tryNextBasketballPath();
    
    const assets = {
      // Use basketball.png instead of emoji - ensure it loads properly
      playerImg: basketballImg,
      // Use Enemy_1.png instead of emoji
      enemyImg: loadImage('/Enemy_1.png'),
      spike: loadImage('/spike.png'),
      spike2: loadImage('/spike_2.png'),
      trampoline: loadImage('/trampoline.png'),
      bgCourt: loadImage('/background_court.png'),
      bgOcean: loadImage('/background_ocean.jpg'),
      stall: loadImage('/stall.png'),
      endMarker: loadImage(levelCfg.endMarker || levelCfg.endDecor),
      loopBg: loadImage(levelCfg.loopBg),
      startDecor: loadImage(levelCfg.startDecor),
      endDecor: loadImage(levelCfg.endDecor),
      groundImg: loadImage(levelCfg.ground),
    };

    const images = [
      assets.playerImg,
      assets.enemyImg,
      assets.spike,
      assets.spike2,
      assets.trampoline,
      assets.loopBg,
      assets.startDecor,
      assets.endDecor,
      assets.stall,
      assets.groundImg,
    ];

    let ready = 0;
    images.forEach((img) => {
      const done = () => {
        ready += 1;
        if (ready === images.length) setLoaded(true);
      };
      img.onload = done;
      img.onerror = done;
    });
    if (images.every((i) => i.complete)) setLoaded(true);

    assetsRef.current = assets;
    // level reset finished
    resettingRef.current = false;
  }, [levelIdx, restartKey]);

  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const assets = assetsRef.current;

    /* ------- Entity helper ------- */
    class Entity {
      constructor(x, y, w, h, img = null, bounceFactor = 0) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.img = img; // image or emoji string or null
        this.bounceFactor = bounceFactor; // 0 = solid, >0 trampoline multiplier
        this.vx = 0;
        this.vy = 0;
      }
      update() {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
      }
      draw(offsetX) {
        const drawX = this.x - offsetX;
        const drawY = this.y;
        if (drawX + this.w < 0 || drawX > CANVAS_WIDTH) return; // off screen

        // Draw debug outline for all entities to help with visibility
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeRect(drawX, drawY, this.w, this.h);

        // Special handling for player to ensure visibility
        if (this.isPlayer) {
          if (assets.playerImg && assets.playerImg.complete && assets.playerImg.naturalWidth > 0) {
            // Draw player with basketball.png image
            ctx.drawImage(assets.playerImg, drawX, drawY, this.w, this.h);
            ctx.strokeStyle = 'rgba(255,255,0,0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, drawY, this.w, this.h);
            ctx.lineWidth = 1;
          } else {
            // Fallback to an orange basketball if image fails to load
            ctx.fillStyle = '#FF6600'; // Basketball orange
            ctx.beginPath();
            ctx.arc(drawX + this.w/2, drawY + this.h/2, this.w/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Add basketball lines
            ctx.beginPath();
            ctx.arc(drawX + this.w/2, drawY + this.h/2, this.w/2 * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(drawX + this.w/2, drawY);
            ctx.lineTo(drawX + this.w/2, drawY + this.h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(drawX, drawY + this.h/2);
            ctx.lineTo(drawX + this.w, drawY + this.h/2);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
        }
        // Handle other entities with images
        else if (this.img && this.img.naturalWidth) {
          // Don't use ground_city.png for the floor
          if (this === ground) {
            // Just draw a simple ground rectangle
            ctx.fillStyle = '#444';
            ctx.fillRect(drawX, drawY, this.w, this.h);
          } else {
            ctx.drawImage(this.img, drawX, drawY, this.w, this.h);
          }
        } else {
          // fallback rectangle for ground and entities without images
          ctx.fillStyle = '#444';
          ctx.fillRect(drawX, drawY, this.w, this.h);
        }
      }
      intersects(other) {
        return !(
          this.x + this.w < other.x ||
          this.x > other.x + other.w ||
          this.y + this.h < other.y ||
          this.y > other.y + other.h
        );
      }
    }

    /* ------- Level setup ------- */
    const groundY = CANVAS_HEIGHT - GROUND_H;
    const ground = new Entity(0, groundY, WORLD_WIDTH, GROUND_H, null, 0);

    // Ensure we have enough trampolines throughout the level
    const endSafeX = WORLD_WIDTH - 400; // leave space before pyramid/end marker
    let nextX = 400;
    let trampolines = [];
    
    // First, add a trampoline near the beginning
    trampolines.push(new Entity(300, groundY - 80, 160, 80, assets.trampoline, 1.4));
    nextX = 700;
    
    // Then add more trampolines throughout the level
    while (nextX < endSafeX) {
      const gap = 400 + Math.random() * 300; // Reduced gap for more trampolines
      const x = nextX + gap;
      // ensure we stay within safe zone
      if (x + 240 > endSafeX) break;
      // basic non-overlap check with previous trampoline
      if (trampolines.length === 0 || x - trampolines[trampolines.length - 1].x > 300) {
        trampolines.push(new Entity(x, groundY - 80, 160, 80, assets.trampoline, 1.4));
      }
      nextX = x;
    }
    
    // Ensure we have at least 4 trampolines
    if (trampolines.length < 4) {
      for (let i = trampolines.length; i < 4; i++) {
        const x = 500 + i * 500;
        if (x + 160 < endSafeX) {
          trampolines.push(new Entity(x, groundY - 80, 160, 80, assets.trampoline, 1.4));
        }
      }
    }

    // stalls (static obstacles that don't bounce) - ensure we have at least 3 stalls
    let stalls = [];
    
    // First ensure we have some stalls near the beginning
    stalls.push(new Entity(500, groundY - 180, 240, 180, assets.stall, 0));
    
    // Then add more stalls throughout the level
    trampolines.forEach((t) => {
      if (Math.random() < 0.8) { // Increased probability
        const offset = 150 + Math.random() * 300;
        const x = t.x + t.w + offset;
        const stallW = 240;
        const stallH = 180;
        // keep within safe zone and no overlap with previous platform
        if (x + stallW < endSafeX && !trampolines.some(tp => Math.abs(tp.x - x) < 200) && !stalls.some(s => Math.abs(s.x - x) < 200)) {
          stalls.push(new Entity(x, groundY - stallH, stallW, stallH, assets.stall, 0));
        }
      }
    });
    
    // Ensure we have at least 3 stalls
    if (stalls.length < 3) {
      for (let i = stalls.length; i < 3; i++) {
        const x = 800 + i * 600;
        if (x + 240 < endSafeX) {
          stalls.push(new Entity(x, groundY - 180, 240, 180, assets.stall, 0));
        }
      }
    }

    const platforms = [ground, ...trampolines, ...stalls];

    // enemies - place them strategically throughout the level using Enemy_1.png
    const enemies = Array.from({ length: 8 }).map((_, i) => {
      const x = 600 + i * 500; // More spread out
      const width = 60;
      const height = 80;
      const e = new Entity(x, groundY - height, width, height, assets.enemyImg);
      e.turnCooldown = 0;
      e.jumpCooldown = 0;
      return e;
    });

    // End marker (pyramid)
    const PYRAMID_SIZE = 200;
    const endMarkerEnt = new Entity(WORLD_WIDTH - PYRAMID_SIZE - 100, groundY - PYRAMID_SIZE, PYRAMID_SIZE, PYRAMID_SIZE, assets.endMarker);

    // Spikes - place them strategically throughout the level
    const spikes = [
      new Entity(600, groundY - 40, 60, 40, assets.spike),
      new Entity(900, groundY - 40, 60, 40, assets.spike2),
      new Entity(1200, groundY - 40, 60, 40, assets.spike),
      new Entity(1500, groundY - 40, 60, 40, assets.spike2),
      new Entity(1800, groundY - 40, 60, 40, assets.spike),
      new Entity(2100, groundY - 40, 60, 40, assets.spike2),
      new Entity(2400, groundY - 40, 60, 40, assets.spike),
      new Entity(2700, groundY - 40, 60, 40, assets.spike2),
    ];

    // Player (basketball.png) - make sure it's visible and properly sized
    const playerSize = 60;
    // Create a fallback player representation (orange circle) in case image fails to load
    const player = new Entity(75, groundY - playerSize, playerSize, playerSize, assets.playerImg);
    player.isPlayer = true; // Flag to identify this entity as the player
    player.draw(cameraX);
      
    // Draw player position debug info
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Player: ${Math.round(player.x)},${Math.round(player.y)}`, 10, 60);
    ctx.fillText(`Player img loaded: ${assets.playerImg.complete}`, 10, 75);
    ctx.fillText(`Player img path: ${assets.playerImg.src}`, 10, 90);
    ctx.fillText(`Player img width: ${assets.playerImg.naturalWidth || 0}`, 10, 105);
    let cameraX = 0;
    let invulFrames = 60; // initial 1-sec invulnerability

    /* ------- Input ------- */
    const keys = { left: false, right: false, up: false, space: false };

    const onKeyDown = (e) => {
      if (gameOverRef.current) return;
      if (e.code === 'ArrowLeft') keys.left = true;
      if (e.code === 'ArrowRight') keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'Space') keys.up = true;
      if (e.code === 'Space') keys.space = true;
    };
    const onKeyUp = (e) => {
      if (gameOverRef.current) return;
      if (e.code === 'ArrowLeft') keys.left = false;
      if (e.code === 'ArrowRight') keys.right = false;
      if (e.code === 'ArrowUp') keys.up = false;
      if (e.code === 'Space') keys.space = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    /* ------- Helpers ------- */
    const resetPlayer = () => {
      player.x = 75;
      player.y = groundY - 75;
      player.vx = 0;
      player.vy = 0;
      cameraX = 0;
    };

    const loseLife = () => {
      if (invulFrames > 0 || resettingRef.current) return;
      resetPlayer();
      resettingRef.current = true;
      invulFrames = 60;
      setLives((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          keys.left = keys.right = keys.up = false;
          player.vx = player.vy = 0;
          enemies.forEach(en => { en.vx = en.vy = 0; });
          setGameOver(true);
        }
        setRestartKey(k => k + 1);
        return Math.max(0, next);
      });
    };

    /* ------- Main game loop ------- */
    function gameLoop() {
      if (resettingRef.current) {
        resettingRef.current = false;
        invulFrames = 60;
      }
      if (gameOverRef.current) return;
      
      // Clear and draw background
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw background image
      if (assets.loopBg && assets.loopBg.complete) {
        // Draw the scrolling background - place at the bottom of the screen
        const bgWidth = CANVAS_WIDTH;
        const bgHeight = CANVAS_HEIGHT - GROUND_H; // Leave space for ground
        const bgX = -cameraX * 0.5 % bgWidth; // Parallax effect
        
        // Draw multiple copies to fill the screen
        ctx.drawImage(assets.loopBg, bgX, 0, bgWidth, bgHeight);
        ctx.drawImage(assets.loopBg, bgX + bgWidth, 0, bgWidth, bgHeight);
        
        // Draw ground - solid color matching the background
        ctx.fillStyle = '#444';
        ctx.fillRect(0, groundY, CANVAS_WIDTH, GROUND_H);
        
        // Draw start decoration at beginning of level (flipped horizontally and standing on ground)
        if (assets.startDecor && assets.startDecor.complete) {
          const startDecorWidth = 300;
          const startDecorHeight = 300;
          const startDecorX = 0 - cameraX;
          const startDecorY = groundY - startDecorHeight; // Place exactly at ground level
          
          if (startDecorX + startDecorWidth > 0 && startDecorX < CANVAS_WIDTH) {
            // Save context state
            ctx.save();
            // Translate to the center of where we want to draw the image
            ctx.translate(startDecorX + startDecorWidth/2, startDecorY + startDecorHeight/2);
            // Flip horizontally
            ctx.scale(-1, 1);
            // Draw the image centered at the origin (0,0)
            ctx.drawImage(assets.startDecor, -startDecorWidth/2, -startDecorHeight/2, startDecorWidth, startDecorHeight);
            // Restore context state
            ctx.restore();
          }
        }
        
        // Draw end marker (pyramid)
        if (assets.endMarker && assets.endMarker.complete) {
          const endMarkerX = endMarkerEnt.x - cameraX;
          if (endMarkerX + endMarkerEnt.w > 0 && endMarkerX < CANVAS_WIDTH) {
            ctx.drawImage(assets.endMarker, endMarkerX, endMarkerEnt.y, endMarkerEnt.w, endMarkerEnt.h);
          }
        }
      }
      // ----- Input -----
      player.vx = 0;
      if (keys.left) player.vx = -MOVE_SPEED;
      if (keys.right) player.vx = MOVE_SPEED;
      if ((keys.up || keys.space) && player.onGround) {
        player.vy = JUMP_VELOCITY;
        player.onGround = false;
      }

      // ----- Update entities -----
      const prevPlayerY = player.y;
      player.update();
      enemies.forEach((en) => {
        en.onGround = false; // reset each frame
        // More aggressive chase with variable speed
        const distToPlayer = Math.abs(player.x - en.x);
        const desiredDir = player.x < en.x ? -1 : 1;
        
        // Adjust speed based on distance to player
        let chaseSpeed = 2 * S;
        if (distToPlayer < 300) chaseSpeed = 3 * S; // Speed up when closer
        
        if (desiredDir !== Math.sign(en.vx) && en.turnCooldown <= 0) {
          en.vx = desiredDir * chaseSpeed;
          en.turnCooldown = 20; // third-second at 60fps
        }
        if (en.turnCooldown > 0) en.turnCooldown--;
        
        // Enhanced obstacle detection and jumping
        const sensorW = 140;
        const sensorX = en.vx > 0 ? en.x + en.w + 40 : en.x - sensorW - 40;
        const sensorRect = { x: sensorX, y: en.y - 60, w: sensorW, h: en.h + 60 };
        const intersects = (r,p)=>(!(r.x+r.w < p.x || r.x > p.x+p.w || r.y+r.h < p.y || r.y > p.y + p.h));
        
        // Check for obstacles (platforms, spikes, stalls)
        const needJump = platforms.some((p) => intersects(sensorRect, p) && p.y >= en.y && p.x > en.x) || 
                         spikes.some((s) => intersects(sensorRect, s));
        // Also jump if approaching world end marker or if player is above
        const playerAbove = player.y < en.y - en.h && Math.abs(player.x - en.x) < 150;
        
        if (en.jumpCooldown <= 0 && en.onGround && (needJump || 
            (en.vx > 0 && endMarkerEnt.x - en.x < 200) || 
            playerAbove)) {
          en.vy = JUMP_VELOCITY * 0.9; // Slightly lower jump than player
          en.onGround = false;
          en.jumpCooldown = 45; // Prevent constant jumping
        }
        
        if (en.jumpCooldown > 0) en.jumpCooldown--;
        en.update();
        // enemy side/vertical collision with platforms
        platforms.forEach((p) => {
          // vertical
          if (
            en.vy >= 0 &&
            en.x + en.w > p.x &&
            en.x < p.x + p.w &&
            en.y + en.h <= p.y + en.vy &&
            en.y + en.h + en.vy >= p.y
          ) {
            en.y = p.y - en.h;
            en.vy = 0;
          }
          // horizontal block
          if (en.y + en.h > p.y && en.y < p.y + p.h) {
            if (en.x < p.x && en.x + en.w > p.x) {
              en.x = p.x - en.w;
            } else if (en.x < p.x + p.w && en.x > p.x) {
              en.x = p.x + p.w;
            }
          }
        });
        // simple ground/platform collision for enemy
        platforms.forEach((p) => {
          if (
            en.vy >= 0 &&
            en.x + en.w > p.x &&
            en.x < p.x + p.w &&
            en.y + en.h <= p.y + en.vy &&
            en.y + en.h + en.vy >= p.y
          ) {
            en.y = p.y - en.h;
            en.vy = 0;
          }
        });
      });

      // ----- Platform collisions -----
      player.onGround = false;
      // vertical collision (landing)
      platforms.forEach((p) => {
        if (
          player.vy >= 0 &&
          player.x + player.w > p.x &&
          player.x < p.x + p.w &&
          player.y + player.h <= p.y + player.vy &&
          player.y + player.h + player.vy >= p.y
        ) {
          player.y = p.y - player.h;
          player.vy = p.bounceFactor > 0 ? JUMP_VELOCITY * p.bounceFactor : 0;
          player.onGround = true;
        }
      });
      // horizontal collision block (after vertical resolution)
      platforms.forEach((p) => {
        if (
          player.y + player.h > p.y && player.y < p.y + p.h // vertical overlap
        ) {
          if (player.x < p.x && player.x + player.w > p.x) {
            player.x = p.x - player.w; // hit left side
          } else if (player.x < p.x + p.w && player.x > p.x) {
            player.x = p.x + p.w; // hit right side
          }
        }
      });

      // ----- Enemy & spike collisions -----
      enemies.forEach((e) => {
        if (player.intersects(e) && invulFrames === 0) {
          // Determine if stomp: player must be descending and above half enemy height
          const descending = player.vy > 0;
          const stompZone = e.y + e.h * 0.3; // top third is vulnerable for stomping
          const stomp = descending && player.y + player.h <= stompZone;
          if (stomp) {
            // defeat enemy
            enemies.splice(enemies.indexOf(e), 1);
            player.vy = JUMP_VELOCITY * 0.8; // Bounce after stomping, but not full jump
          } else {
            loseLife();
          }
        }
      });
      spikes.forEach((s) => {
        if (player.intersects(s) && invulFrames === 0) loseLife();
      });

      // ----- Level completion check -----
      if (player.intersects(endMarkerEnt)) {
        // Play a success sound or animation here if needed
        setLevelComplete(true);
        return; // stop loop
      }

      // ----- Invulnerability cooldown -----
      if (invulFrames > 0) {
        invulFrames -= 1;
      }
      ctx.fillText(
        `Level ${levelIdx + 1}  Lives: ${livesRef.current}`,
        10,
        20
      );
      if (gameOverRef.current) {
        ctx.font = '80px serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      // schedule next frame
      if (!gameOverRef.current) requestAnimationFrame(gameLoop);
    }
    // kick off first frame
    requestAnimationFrame(gameLoop);
  }, [loaded, levelIdx, restartKey]);
  /* -------------- Level complete overlay -------------- */
  const overlayButtons = levelComplete && (
    <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff',background:'rgba(0,0,0,0.6)'}}>
      <h1 style={{fontSize:'48px',marginBottom:'20px'}}>Level Cleared!</h1>
      <p style={{fontSize:'24px',marginBottom:'30px'}}>Congratulations! You've reached the pyramid!</p>
      <div style={{display:'flex',gap:'20px'}}>
        <button 
          style={{padding:'15px 30px',fontSize:'20px',background:'#4CAF50',color:'white',border:'none',borderRadius:'5px',cursor:'pointer'}}
          onClick={() => {
            assetsRef.current = null;
            setLoaded(false);
            setLevelComplete(false);
            setLives(INITIAL_LIVES);
            setLevelIdx(idx => (idx < LEVELS.length - 1 ? idx + 1 : 0));
          }}
        >
          Next Level
        </button>
        <button 
          style={{padding:'15px 30px',fontSize:'20px',background:'#2196F3',color:'white',border:'none',borderRadius:'5px',cursor:'pointer'}}
          onClick={() => {
            assetsRef.current = null;
            setLoaded(false);
            setLevelComplete(false);
            setRestartKey(k => k + 1);
            setLives(INITIAL_LIVES);
            resetPlayer();
          }}
        >
          Replay Level
        </button>
      </div>
    </div>
  );

  /* -------------- Game over overlay -------------- */
  const gameOverOverlay = gameOver && (
    <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff',background:'rgba(0,0,0,0.6)'}}>
      <h1 style={{fontSize:'48px',marginBottom:'20px'}}>Game Over</h1>
      <p style={{fontSize:'24px',marginBottom:'30px'}}>You lost all your lives!</p>
      <button 
        style={{padding:'15px 30px',fontSize:'20px',background:'#F44336',color:'white',border:'none',borderRadius:'5px',cursor:'pointer'}}
        onClick={() => { 
          setGameOver(false);
          gameOverRef.current = false;
          setLoaded(false);
          assetsRef.current = null;
          setLives(INITIAL_LIVES);
          setRestartKey(k => k + 1);
        }}
      >
        Restart Game
      </button>
    </div>
  );

  /* ---------------- Render ---------------- */
  const overlayToShow = gameOver ? gameOverOverlay : overlayButtons;

  return (
    <div style={{position:'relative'}}>
      <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ border: '3px solid #fff', borderRadius: '10px', background: '#87CEEB' }}
    />
    {overlayToShow}
    </div>
  );
}
