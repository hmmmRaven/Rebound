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
const CANVAS_WIDTH = 1920;
const WORLD_WIDTH = CANVAS_WIDTH * 5; // each level spans 5 screen widths
const CANVAS_HEIGHT = 1080;
const GROUND_H = 120;
const INITIAL_LIVES = 3;

// Level definitions
const LEVELS = [
  {
    startDecor: '/background_court.jpg',
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
  img.src = src;
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

  useEffect(() => {
    // reset load state whenever level changes
    setLoaded(false);
    assetsRef.current = null;

    const levelCfg = LEVELS[levelIdx];

    const assets = {
      ballEmoji: '🏀',
      playerEmojis: ['🏃‍♀️', '🏃‍♂️', '🏃'],
      spike: loadImage('/spike.png'),
      spike2: loadImage('/spike_2.png'),
      trampoline: loadImage('/trampoline.png'),
      bgCourt: loadImage('/background_court.jpg'),
      bgOcean: loadImage('/background_ocean.jpg'),
      stall: loadImage('/stall.png'),
      endMarker: loadImage(levelCfg.endMarker || levelCfg.endDecor),
      loopBg: loadImage(levelCfg.loopBg),
      startDecor: loadImage(levelCfg.startDecor),
      endDecor: loadImage(levelCfg.endDecor),
      groundImg: loadImage(levelCfg.ground),
    };

    const images = [
      assets.spike,
      assets.spike2,
      assets.trampoline,
      assets.loopBg,
      assets.startDecor,
      assets.endDecor,
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

        if (typeof this.img === 'string') {
          ctx.font = `${this.h}px serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(this.img, drawX, drawY);
        } else if (this.img && this.img.naturalWidth) {
          ctx.drawImage(this.img, drawX, drawY, this.w, this.h);
        } else {
          // fallback rectangle for ground
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

    // random trampolines every ~600px
    const endSafeX = WORLD_WIDTH - 400; // leave space before pyramid/end marker
    let nextX = 400;
    let trampolines = [];
    while (nextX < endSafeX) {
      const gap = 500 + Math.random() * 400;
      const x = nextX + gap;
      // ensure we stay within safe zone
      if (x + 240 > endSafeX) break;
      // basic non-overlap check with previous trampoline
      if (trampolines.length === 0 || x - trampolines[trampolines.length - 1].x > 300) {
        trampolines.push(new Entity(x, groundY - 120, 240, 120, assets.trampoline, 1.4));
      }
      nextX = x;
    }

    // stalls (static obstacles that don’t bounce)
    let stalls = [];
    trampolines.forEach((t) => {
      if (Math.random() < 0.7) {
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

    const platforms = [ground, ...trampolines, ...stalls];

    // enemies
    const enemies = Array.from({ length: 6 }).map((_, i) => {
      const x = 800 + i * 400;
      const emoji = assets.playerEmojis[Math.floor(Math.random() * assets.playerEmojis.length)];
      const width = 80;
      const height = 120;
      const e = new Entity(x, groundY - height, width, height, emoji);
      e.turnCooldown = 0;
      return e;
    });

    // spikes
    const PYRAMID_SIZE = 500;
    const endMarkerEnt = new Entity(WORLD_WIDTH - PYRAMID_SIZE - 100, groundY - PYRAMID_SIZE, PYRAMID_SIZE, PYRAMID_SIZE, assets.endMarker);

    const spikes = [
      new Entity(1000, groundY - 40, 40, 40, assets.spike),
      new Entity(1600, groundY - 40, 40, 40, assets.spike2),
    ];

    // player
    const player = new Entity(75, groundY - 75, 75, 75, assets.ballEmoji);
    let cameraX = 0;
    let invulFrames = 60; // initial 1-sec invulnerability

    /* ------- Input ------- */
    const keys = { left: false, right: false, up: false };

    const onKeyDown = (e) => {
      if (gameOverRef.current) return;
      if (e.code === 'ArrowLeft') keys.left = true;
      if (e.code === 'ArrowRight') keys.right = true;
      if (e.code === 'ArrowUp') keys.up = true;
    };
    const onKeyUp = (e) => {
      if (gameOverRef.current) return;
      if (e.code === 'ArrowLeft') keys.left = false;
      if (e.code === 'ArrowRight') keys.right = false;
      if (e.code === 'ArrowUp') keys.up = false;
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
      // ----- Input -----
      player.vx = 0;
      if (keys.left) player.vx = -MOVE_SPEED;
      if (keys.right) player.vx = MOVE_SPEED;
      if (keys.up && player.onGround) {
        player.vy = JUMP_VELOCITY;
        player.onGround = false;
      }

      // ----- Update entities -----
      const prevPlayerY = player.y;
      player.update();
      enemies.forEach((en) => {
        en.onGround = false; // reset each frame
        // simple chase
        const desiredDir = player.x < en.x ? -1 : 1;
        if (desiredDir !== Math.sign(en.vx) && en.turnCooldown <= 0) {
          en.vx = desiredDir * 2 * S;
          en.turnCooldown = 30; // half-second at 60fps
        }
        if (en.turnCooldown > 0) en.turnCooldown--; 
        // jump over obstacle using sensor rectangle
        const sensorW = 140;
        const sensorX = en.vx > 0 ? en.x + en.w + 60 : en.x - sensorW - 60;
        const sensorRect = { x: sensorX, y: en.y - 60, w: sensorW, h: en.h + 60 };
        const intersects = (r,p)=>(!(r.x+r.w < p.x || r.x > p.x+p.w || r.y+r.h < p.y || r.y > p.y + p.h));
        const needJump = platforms.some((p) => intersects(sensorRect, p) && p.y >= en.y && p.x > en.x);
        // also jump if approaching world end marker
        if (!needJump && en.vx > 0 && endMarkerEnt.x - en.x < 200) {
          en.vy = JUMP_VELOCITY;
        }
        if (needJump && en.onGround) {
          en.vy = JUMP_VELOCITY;
          en.onGround = false;
        }
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
        if (player.intersects(e)) {
          // Determine if stomp: player must be descending and above half enemy height
          const descending = player.vy > 0;
          const stompZone = e.y + e.h * 0.5; // top half is vulnerable
          const stomp = descending && player.y + player.h <= stompZone;
          if (stomp) {
            // defeat enemy
            enemies.splice(enemies.indexOf(e), 1);
            player.vy = JUMP_VELOCITY;
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
        setLevelComplete(true);
        return; // stop loop
      }

      // ----- Invulnerability cooldown -----
      if (invulFrames > 0) {
        invulFrames -= 1;
      }
      ctx.fillText(
        `Level ${levelIdx + 1}  Lives: ${'🏀'.repeat(livesRef.current)}`,
        10,
        10
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
      <h1>Level Complete!</h1>
      <div style={{display:'flex',gap:'20px'}}>
        <button onClick={() => {
          assetsRef.current = null;
          setLoaded(false);
          setLevelComplete(false);
          setLives(INITIAL_LIVES);
          setLevelIdx(idx => (idx < LEVELS.length - 1 ? idx + 1 : 0));
        }}>Next</button>
        <button onClick={() => {
          assetsRef.current = null;
          setLoaded(false);
          setLevelComplete(false);
          setRestartKey(k => k + 1);
          setLives(INITIAL_LIVES);
          resetPlayer();
        }}>Replay</button>
      </div>
    </div>
  );

  /* -------------- Game over overlay -------------- */
  const gameOverOverlay = gameOver && (
    <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff',background:'rgba(0,0,0,0.6)'}}>
      <h1>Game Over</h1>
      <button onClick={() => { 
        setGameOver(false);
        gameOverRef.current = false;
        setLoaded(false);
        assetsRef.current = null;
        setLives(INITIAL_LIVES);
        setRestartKey(k => k + 1);
      }}>Restart Game</button>
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
      style={{ border: '3px solid #fff', borderRadius: '10px', background: 'rgba(0,0,0,0.3)' }}
    />
    {overlayToShow}
    </div>
  );
}
