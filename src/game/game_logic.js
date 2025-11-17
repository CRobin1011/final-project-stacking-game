import { Block } from '../entities/block.js';
import { GAME_CONFIG, DIRECTIONS } from '../config/game_config.js';
import { gameEvents, EVENTS } from '../core/event_system.js';

/**
 * Manages the game logic, block stacking, and game state
 */
export class GameLogic {
  constructor(renderManager, physicsManager) {
    this.renderManager = renderManager;
    this.physicsManager = physicsManager;
    
    this.stack = [];
    this.overhangs = [];
    this.isAutopilot = true;
    this.isGameEnded = false;
    this.score = 0;
    this.robotPrecision = 0;
    
    this.setupEventListeners();
    this.setRobotPrecision();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    gameEvents.on(EVENTS.BLOCK_PLACED, this.handleBlockPlacement.bind(this));
    gameEvents.on(EVENTS.GAME_RESET, this.startGame.bind(this));
  }

  /**
   * Initialize the game
   */
  initialize() {
    this.addLayer(0, 0, GAME_CONFIG.ORIGINAL_BOX_SIZE, GAME_CONFIG.ORIGINAL_BOX_SIZE);
    this.addLayer(-10, 0, GAME_CONFIG.ORIGINAL_BOX_SIZE, GAME_CONFIG.ORIGINAL_BOX_SIZE, DIRECTIONS.X);
  }

  /**
   * Start a new game
   */
  startGame() {
    this.isAutopilot = false;
    this.isGameEnded = false;
    this.score = 0;
    this.stack = [];
    this.overhangs = [];
    
    // Clear existing blocks
    this.clearGame();
    
    // Reset camera
    this.renderManager.resetCamera();
    
    // Add initial layers
    this.addLayer(0, 0, GAME_CONFIG.ORIGINAL_BOX_SIZE, GAME_CONFIG.ORIGINAL_BOX_SIZE);
    this.addLayer(-10, 0, GAME_CONFIG.ORIGINAL_BOX_SIZE, GAME_CONFIG.ORIGINAL_BOX_SIZE, DIRECTIONS.X);
    
    gameEvents.emit(EVENTS.GAME_START);
    gameEvents.emit(EVENTS.SCORE_UPDATE, this.score);
  }

  /**
   * Add a new layer to the stack
   * @param {number} x 
   * @param {number} z 
   * @param {number} width 
   * @param {number} depth 
   * @param {string} direction 
   */
  addLayer(x, z, width, depth, direction = null) {
    const y = GAME_CONFIG.BOX_HEIGHT * this.stack.length;
    const block = this.createBlock(x, y, z, width, depth, direction, false);
    this.stack.push(block);
    
    gameEvents.emit(EVENTS.LAYER_ADDED, { 
      block, 
      stackHeight: this.stack.length 
    });
  }

  /**
   * Add an overhang (falling piece)
   * @param {number} x 
   * @param {number} z 
   * @param {number} width 
   * @param {number} depth 
   */
  addOverhang(x, z, width, depth) {
    const y = GAME_CONFIG.BOX_HEIGHT * (this.stack.length - 1);
    const overhang = this.createBlock(x, y, z, width, depth, null, true);
    overhang.startFalling();
    this.overhangs.push(overhang);
  }

  /**
   * Create a block (visual and physics)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} width 
   * @param {number} depth 
   * @param {string} direction 
   * @param {boolean} isDynamic 
   * @returns {Block}
   */
  createBlock(x, y, z, width, depth, direction, isDynamic) {
    // Create physics body
    const physicsBody = this.physicsManager.createBoxBody(
      x, y, z, width, GAME_CONFIG.BOX_HEIGHT, depth, isDynamic
    );
    
    // Create block
    const block = new Block(x, y, z, width, depth, direction, physicsBody);
    
    // Create and add visual mesh
    const mesh = block.createMesh(this.stack.length);
    this.renderManager.addToScene(mesh);
    
    return block;
  }

  /**
   * Handle block placement input
   */
  handleBlockPlacement() {
    if (this.isAutopilot) {
      this.startGame();
    } else {
      this.splitBlockAndAddNext();
    }
  }

  /**
   * Split the top block and add the next one
   */
  splitBlockAndAddNext() {
    if (this.isGameEnded || this.stack.length < 2) return;

    const topLayer = this.stack[this.stack.length - 1];
    const previousLayer = this.stack[this.stack.length - 2];
    const direction = topLayer.direction;

    const size = topLayer.getSize(direction);
    const delta = topLayer.getPosition(direction) - previousLayer.getPosition(direction);
    const overhangSize = Math.abs(delta);
    const overlap = size - overhangSize;

    if (overlap > 0) {
      this.cutAndContinue(topLayer, overlap, size, delta, overhangSize, direction);
    } else {
      this.missBlock();
    }
  }

  /**
   * Cut the block and continue the game
   * @param {Block} topLayer 
   * @param {number} overlap 
   * @param {number} size 
   * @param {number} delta 
   * @param {number} overhangSize 
   * @param {string} direction 
   */
  cutAndContinue(topLayer, overlap, size, delta, overhangSize, direction) {
    // Cut the block
    topLayer.cut(overlap, size, delta);
    
    // Update physics body shape
    this.physicsManager.updateBodyShape(
      topLayer.physicsBody,
      topLayer.width,
      GAME_CONFIG.BOX_HEIGHT,
      topLayer.depth
    );

    // Create overhang
    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const overhangX = direction === DIRECTIONS.X 
      ? topLayer.getPosition('x') + overhangShift 
      : topLayer.getPosition('x');
    const overhangZ = direction === DIRECTIONS.Z 
      ? topLayer.getPosition('z') + overhangShift 
      : topLayer.getPosition('z');
    const overhangWidth = direction === DIRECTIONS.X ? overhangSize : topLayer.width;
    const overhangDepth = direction === DIRECTIONS.Z ? overhangSize : topLayer.depth;

    this.addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

    // Add next layer
    const nextX = direction === DIRECTIONS.X ? topLayer.getPosition('x') : -10;
    const nextZ = direction === DIRECTIONS.Z ? topLayer.getPosition('z') : -10;
    const nextDirection = direction === DIRECTIONS.X ? DIRECTIONS.Z : DIRECTIONS.X;

    // Update score
    this.score = this.stack.length - 1;
    gameEvents.emit(EVENTS.SCORE_UPDATE, this.score);

    this.addLayer(nextX, nextZ, topLayer.width, topLayer.depth, nextDirection);
  }

  /**
   * Handle missing the block
   */
  missBlock() {
    const topLayer = this.stack[this.stack.length - 1];
    
    // Make the block fall
    this.addOverhang(
      topLayer.getPosition('x'),
      topLayer.getPosition('z'),
      topLayer.width,
      topLayer.depth
    );
    
    // Remove from stack and scene
    this.physicsManager.removeBody(topLayer.physicsBody);
    this.renderManager.removeFromScene(topLayer.mesh);
    this.stack.pop();

    this.isGameEnded = true;
    
    if (!this.isAutopilot) {
      gameEvents.emit(EVENTS.GAME_OVER);
    }
  }

  /**
   * Update game logic
   * @param {number} deltaTime 
   */
  update(deltaTime) {
    if (this.stack.length < 2) return;

    const topLayer = this.stack[this.stack.length - 1];
    const previousLayer = this.stack[this.stack.length - 2];

    // Update camera position
    const targetCameraY = GAME_CONFIG.BOX_HEIGHT * (this.stack.length - 2);
    this.renderManager.updateCameraPosition(targetCameraY, deltaTime);

    // Check if block should move
    const shouldMove = this.shouldBlockMove(topLayer, previousLayer);
    
    if (shouldMove) {
      this.moveBlock(topLayer, deltaTime);
      
      // Check if block is out of bounds
      if (topLayer.isOutOfBounds()) {
        this.missBlock();
      }
    } else if (this.isAutopilot) {
      this.splitBlockAndAddNext();
      this.setRobotPrecision();
    }

    // Update physics for overhangs
    this.updateOverhangs();
  }

  /**
   * Check if the block should move
   * @param {Block} topLayer 
   * @param {Block} previousLayer 
   * @returns {boolean}
   */
  shouldBlockMove(topLayer, previousLayer) {
    if (this.isGameEnded) return false;
    
    if (!this.isAutopilot) return true;
    
    // Autopilot logic
    const currentPos = topLayer.getPosition(topLayer.direction);
    const targetPos = previousLayer.getPosition(topLayer.direction) + this.robotPrecision;
    
    return currentPos < targetPos;
  }

  /**
   * Move the block
   * @param {Block} block 
   * @param {number} deltaTime 
   */
  moveBlock(block, deltaTime) {
    const speed = GAME_CONFIG.MOVEMENT_SPEED;
    const delta = speed * deltaTime;
    block.updatePosition(block.direction, delta);
  }

  /**
   * Update overhang physics
   */
  updateOverhangs() {
    this.overhangs.forEach(overhang => {
      overhang.updateFromPhysics();
    });
  }

  /**
   * Set random robot precision for autopilot
   */
  setRobotPrecision() {
    this.robotPrecision = Math.random() * GAME_CONFIG.ROBOT_PRECISION_RANGE - 0.5;
  }

  /**
   * Clear all game objects
   */
  clearGame() {
    // Clear physics bodies
    this.physicsManager.clearBodies();
    
    // Clear visual objects
    this.renderManager.clearMeshes();
    
    // Dispose blocks
    [...this.stack, ...this.overhangs].forEach(block => {
      block.dispose();
    });
    
    this.stack = [];
    this.overhangs = [];
  }

  /**
   * Get current stack height
   * @returns {number}
   */
  getStackHeight() {
    return this.stack.length;
  }

  /**
   * Get current score
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Check if game is in autopilot mode
   * @returns {boolean}
   */
  isInAutopilot() {
    return this.isAutopilot;
  }

  /**
   * Check if game has ended
   * @returns {boolean}
   */
  hasGameEnded() {
    return this.isGameEnded;
  }
}