/**
 * Game configuration constants
 */
export const GAME_CONFIG = {
  // Physics
  GRAVITY: -10,
  SOLVER_ITERATIONS: 40,
  BOX_HEIGHT: 1,
  ORIGINAL_BOX_SIZE: 3,
  PHYSICS_TIMESTEP: 1/1000,
  
  // Visual
  CAMERA_WIDTH: 10,
  AMBIENT_LIGHT_INTENSITY: 0.6,
  DIRECTIONAL_LIGHT_INTENSITY: 0.6,
  DIRECTIONAL_LIGHT_POSITION: { x: 10, y: 20, z: 0 },
  
  // Game mechanics
  MOVEMENT_SPEED: 0.008,
  CAMERA_FOLLOW_SPEED: 0.08,
  BOX_FALL_MASS: 5,
  
  // Colors
  COLOR_HUE_BASE: 30,
  COLOR_HUE_INCREMENT: 4,
  COLOR_SATURATION: 100,
  COLOR_LIGHTNESS: 50,
  
  // Robot/AI
  ROBOT_PRECISION_RANGE: 1,
  
  // UI
  SCORE_ELEMENT_ID: 'score',
  INSTRUCTIONS_ELEMENT_ID: 'instructions',
  RESULTS_ELEMENT_ID: 'results'
};

export const DIRECTIONS = {
  X: 'x',
  Z: 'z'
};

export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
  AUTOPILOT: 'autopilot'
};