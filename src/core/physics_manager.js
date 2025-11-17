import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from '../config/game_config.js';

/**
 * Manages Cannon.js physics world and operations
 */
export class PhysicsManager {
  constructor() {
    this.world = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the physics world
   */
  initialize() {
    try {
      this.world = new CANNON.World();
      this.world.gravity.set(0, GAME_CONFIG.GRAVITY, 0);
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = GAME_CONFIG.SOLVER_ITERATIONS;
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PhysicsManager:', error);
      throw error;
    }
  }

  /**
   * Create a physics body for a box
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {number} z - Z position
   * @param {number} width - Box width
   * @param {number} height - Box height
   * @param {number} depth - Box depth
   * @param {boolean} isDynamic - Whether the body should be dynamic (affected by physics)
   * @returns {CANNON.Body} The created physics body
   */
  createBoxBody(x, y, z, width, height, depth, isDynamic = false) {
    if (!this.isInitialized) {
      throw new Error('PhysicsManager not initialized');
    }

    const shape = new CANNON.Box(
      new CANNON.Vec3(width / 2, height / 2, depth / 2)
    );
    
    let mass = 0;
    if (isDynamic) {
      mass = GAME_CONFIG.BOX_FALL_MASS;
      mass *= width / GAME_CONFIG.ORIGINAL_BOX_SIZE;
      mass *= depth / GAME_CONFIG.ORIGINAL_BOX_SIZE;
    }
    
    const body = new CANNON.Body({ mass, shape });
    body.position.set(x, y, z);
    
    this.world.addBody(body);
    return body;
  }

  /**
   * Remove a body from the physics world
   * @param {CANNON.Body} body 
   */
  removeBody(body) {
    if (this.world && body) {
      this.world.removeBody(body);
    }
  }

  /**
   * Update physics simulation
   * @param {number} deltaTime - Time step in milliseconds
   */
  step(deltaTime) {
    if (!this.isInitialized) return;
    
    this.world.step(deltaTime * GAME_CONFIG.PHYSICS_TIMESTEP);
  }

  /**
   * Update a body's shape (used when cutting blocks)
   * @param {CANNON.Body} body 
   * @param {number} width 
   * @param {number} height 
   * @param {number} depth 
   */
  updateBodyShape(body, width, height, depth) {
    if (!body) return;
    
    const newShape = new CANNON.Box(
      new CANNON.Vec3(width / 2, height / 2, depth / 2)
    );
    
    body.shapes = [];
    body.addShape(newShape);
  }

  /**
   * Clear all bodies from the physics world
   */
  clearBodies() {
    if (!this.world) return;
    
    while (this.world.bodies.length > 0) {
      this.world.removeBody(this.world.bodies[0]);
    }
  }

  /**
   * Cleanup physics resources
   */
  dispose() {
    this.clearBodies();
    this.world = null;
    this.isInitialized = false;
  }
}