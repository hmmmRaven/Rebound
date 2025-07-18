// Level design data for the game
// Each level contains platforms, obstacles, enemies and other game elements

// Constants for fixed sizes and distances
const GRID_SIZE = 40; // Base grid size for positioning elements
const PLATFORM_HEIGHT = 20;
const STANDARD_PLATFORM_WIDTH = 160; // 4 grid units
const SMALL_PLATFORM_WIDTH = 80; // 2 grid units
const OBSTACLE_WIDTH = 40; // 1 grid unit
const OBSTACLE_HEIGHT = 20;
const ENEMY_SIZE = 40;
const COLLECTIBLE_RADIUS = 15;

export const levels = [
  {
    name: "Level 1",
    platforms: [
      // Ground platforms (row 1 - bottom row)
      { x: 0, y: 560, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 240, y: 560, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 480, y: 560, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 720, y: 560, width: STANDARD_PLATFORM_WIDTH - 80, height: PLATFORM_HEIGHT, color: '#3742fa' },
      
      // Row 2 platforms
      { x: 80, y: 480, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 320, y: 480, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 560, y: 480, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      
      // Row 3 platforms
      { x: 0, y: 400, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 240, y: 400, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 480, y: 400, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 720, y: 400, width: STANDARD_PLATFORM_WIDTH - 80, height: PLATFORM_HEIGHT, color: '#3742fa' },
      
      // Row 4 platforms
      { x: 80, y: 320, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 320, y: 320, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      { x: 560, y: 320, width: STANDARD_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#3742fa' },
      
      // Row 5 platforms (small platforms)
      { x: 0, y: 240, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
      { x: 160, y: 240, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
      { x: 320, y: 240, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
      { x: 480, y: 240, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
      { x: 640, y: 240, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
      
      // Row 6 platforms (top row - small platforms)
      { x: 80, y: 160, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
      { x: 240, y: 160, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
      { x: 400, y: 160, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
      { x: 560, y: 160, width: SMALL_PLATFORM_WIDTH, height: PLATFORM_HEIGHT, color: '#ff6b81' },
    ],
    
    // Fixed obstacles (like spikes or lava)
    obstacles: [],
    
    // Fixed enemy spawns
    enemies: [
      // Row 1 enemies (on ground platforms)
      { 
        x: 80, 
        y: 520, 
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE, 
        type: 'walker', 
        color: '#ff6b81',
        speed: 1,
        direction: 1,
        patrolStart: 40,
        patrolEnd: 200
      },
      { 
        x: 320, 
        y: 520, 
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE, 
        type: 'walker', 
        color: '#ff6b81',
        speed: 1,
        direction: 1,
        patrolStart: 280,
        patrolEnd: 440
      },
      { 
        x: 560, 
        y: 520, 
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE, 
        type: 'walker', 
        color: '#ff6b81',
        speed: 1,
        direction: 1,
        patrolStart: 520,
        patrolEnd: 680
      },
      
      // Row 2 enemies
      { 
        x: 120, 
        y: 440, 
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE, 
        type: 'jumper', 
        color: '#5352ed',
        speed: 1,
        jumpHeight: 80,
        jumpInterval: 2000
      },
      { 
        x: 600, 
        y: 440, 
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE, 
        type: 'jumper', 
        color: '#5352ed',
        speed: 1,
        jumpHeight: 80,
        jumpInterval: 2000
      },
      
      // Row 3 enemies
      { 
        x: 80, 
        y: 360, 
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE, 
        type: 'walker', 
        color: '#ff6b81',
        speed: 1.5,
        direction: 1,
        patrolStart: 40,
        patrolEnd: 200
      },
      { 
        x: 320, 
        y: 360, 
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE, 
        type: 'walker', 
        color: '#ff6b81',
        speed: 1.5,
        direction: 1,
        patrolStart: 280,
        patrolEnd: 440
      },
      { 
        x: 560, 
        y: 360, 
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE, 
        type: 'walker', 
        color: '#ff6b81',
        speed: 1.5,
        direction: 1,
        patrolStart: 520,
        patrolEnd: 680
      },
    ],
    
    // Collectibles (coins, power-ups)
    collectibles: [
      // Row 1 coins
      { x: 40, y: 520, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 200, y: 520, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 280, y: 520, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 440, y: 520, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 520, y: 520, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 680, y: 520, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      
      // Row 2 coins
      { x: 160, y: 440, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 400, y: 440, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 640, y: 440, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      
      // Row 3 coins
      { x: 40, y: 360, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 200, y: 360, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 280, y: 360, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 440, y: 360, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 520, y: 360, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      { x: 680, y: 360, type: 'coin', radius: COLLECTIBLE_RADIUS, color: '#ffa502', value: 10 },
      
      // Power-ups
      { x: 40, y: 200, type: 'powerup', radius: COLLECTIBLE_RADIUS, color: '#2ed573', effect: 'jump_boost' },
      { x: 360, y: 200, type: 'powerup', radius: COLLECTIBLE_RADIUS, color: '#2ed573', effect: 'jump_boost' },
      { x: 680, y: 200, type: 'powerup', radius: COLLECTIBLE_RADIUS, color: '#2ed573', effect: 'jump_boost' },
    ],
    
    // Starting position for the ball
    ballStart: {
      x: 40,  // Starting at the left side of the first platform
      y: 520  // Just above the ground platform
    },
    
    // Level boundaries
    boundaries: {
      width: 800,
      height: 600
    },
    
    // Background color
    backgroundColor: '#f1f2f6'
  },
  
  // You can add more levels here in the future
];

// Helper function to get a specific level
export function getLevel(levelIndex) {
  if (levelIndex >= 0 && levelIndex < levels.length) {
    return levels[levelIndex];
  }
  // Default to first level if invalid index
  return levels[0];
}

// Enemy types and behaviors
export const enemyTypes = {
  walker: {
    description: 'Moves back and forth on platforms',
    damage: 10,
    canBeJumpedOn: true
  },
  jumper: {
    description: 'Jumps periodically',
    damage: 15,
    canBeJumpedOn: false
  }
};

// Obstacle types
export const obstacleTypes = {
  spikes: {
    description: 'Damages player on contact',
    damage: 20
  },
  lava: {
    description: 'Instant death on contact',
    damage: 100
  }
};

// Collectible effects
export const collectibleEffects = {
  coin: {
    description: 'Adds to score'
  },
  powerup: {
    jump_boost: {
      description: 'Increases jump height temporarily',
      duration: 5000, // ms
      multiplier: 1.5
    }
  }
};
