import * as THREE from 'three';
import { GAME_CONFIG, DIRECTIONS } from '../config/game_config.js';

/**
 * Represents a single block in the stack game
 */
export class Block {
  constructor(x, y, z, width, depth, direction = null, physicsBody = null) {
    this.position = { x, y, z };
    this.width = width;
    this.depth = depth;
    this.direction = direction;
    this.mesh = null;
    this.physicsBody = physicsBody;
    this.isMoving = false;
    this.isFalling = false;
  }

  /**
   * Create the visual representation of the block
   * @param {number} stackIndex - Index in the stack for color calculation
   * @returns {THREE.Mesh} The created mesh
   */
  createMesh(stackIndex) {
    const geometry = new THREE.BoxGeometry(
      this.width, 
      GAME_CONFIG.BOX_HEIGHT, 
      this.depth
    );
    
    const hue = GAME_CONFIG.COLOR_HUE_BASE + stackIndex * GAME_CONFIG.COLOR_HUE_INCREMENT;
    const color = new THREE.Color(
      `hsl(${hue}, ${GAME_CONFIG.COLOR_SATURATION}%, ${GAME_CONFIG.COLOR_LIGHTNESS}%)`
    );
    
    const material = new THREE.MeshLambertMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    return this.mesh;
  }

  /**
   * Update block's visual position from physics body
   */
  updateFromPhysics() {
    if (this.physicsBody && this.mesh) {
      this.mesh.position.copy(this.physicsBody.position);
      this.mesh.quaternion.copy(this.physicsBody.quaternion);
    }
  }

  /**
   * Update block position (for moving blocks)
   * @param {string} direction - Movement direction ('x' or 'z')
   * @param {number} delta - Position delta
   */
  updatePosition(direction, delta) {
    if (this.mesh) {
      this.mesh.position[direction] += delta;
    }
    if (this.physicsBody) {
      this.physicsBody.position[direction] += delta;
    }
    this.position[direction] += delta;
  }

  /**
   * Cut the block to a new size and position
   * @param {number} overlap - The overlapping size
   * @param {number} originalSize - Original size in the cutting direction
   * @param {number} delta - Position adjustment
   */
  cut(overlap, originalSize, delta) {
    const direction = this.direction;
    const newWidth = direction === DIRECTIONS.X ? overlap : this.width;
    const newDepth = direction === DIRECTIONS.Z ? overlap : this.depth;

    this.width = newWidth;
    this.depth = newDepth;

    // Update visual representation
    if (this.mesh) {
      this.mesh.scale[direction] = overlap / originalSize;
      this.mesh.position[direction] -= delta / 2;
    }

    // Update physics body position
    if (this.physicsBody) {
      this.physicsBody.position[direction] -= delta / 2;
    }

    this.position[direction] -= delta / 2;
  }

  /**
   * Get the current position in a specific direction
   * @param {string} direction 
   * @returns {number}
   */
  getPosition(direction) {
    return this.position[direction];
  }

  /**
   * Get the size in a specific direction
   * @param {string} direction 
   * @returns {number}
   */
  getSize(direction) {
    return direction === DIRECTIONS.X ? this.width : this.depth;
  }

  /**
   * Check if block has moved beyond bounds
   * @param {number} bound 
   * @returns {boolean}
   */
  isOutOfBounds(bound = 10) {
    return Math.abs(this.getPosition(this.direction)) > bound;
  }

  /**
   * Mark block as falling
   */
  startFalling() {
    this.isFalling = true;
    this.isMoving = false;
  }

  /**
   * Cleanup block resources
   */
  dispose() {
    if (this.mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
    }
  }
}