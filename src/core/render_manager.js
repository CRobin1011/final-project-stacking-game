import * as THREE from 'three';
import { GAME_CONFIG } from '../config/game_config.js';

/**
 * Manages Three.js rendering setup and operations
 */
export class RenderManager {
  constructor() {
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the renderer, scene, and camera
   */
  initialize() {
    try {
      this.createScene();
      this.createCamera();
      this.createRenderer();
      this.setupLighting();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize RenderManager:', error);
      throw error;
    }
  }

  /**
   * Create the Three.js scene
   */
  createScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * Create and configure the orthographic camera
   */
  createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const width = GAME_CONFIG.CAMERA_WIDTH;
    const height = width / aspect;

    this.camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0,
      100
    );

    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Create and configure the WebGL renderer
   */
  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.body.appendChild(this.renderer.domElement);
  }

  /**
   * Setup scene lighting
   */
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      0xffffff, 
      GAME_CONFIG.AMBIENT_LIGHT_INTENSITY
    );
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(
      0xffffff, 
      GAME_CONFIG.DIRECTIONAL_LIGHT_INTENSITY
    );
    
    const lightPos = GAME_CONFIG.DIRECTIONAL_LIGHT_POSITION;
    directionalLight.position.set(lightPos.x, lightPos.y, lightPos.z);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    
    this.scene.add(directionalLight);
  }

  /**
   * Render the scene
   */
  render() {
    if (!this.isInitialized) {
      console.warn('RenderManager not initialized');
      return;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.camera || !this.renderer) return;

    const aspect = window.innerWidth / window.innerHeight;
    const width = GAME_CONFIG.CAMERA_WIDTH;
    const height = width / aspect;

    this.camera.left = width / -2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = height / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Update camera position for following the stack
   * @param {number} targetY - Target Y position for camera
   * @param {number} deltaTime - Time delta for smooth movement
   */
  updateCameraPosition(targetY, deltaTime) {
    if (!this.camera) return;

    const currentY = this.camera.position.y;
    const minY = targetY + 4;
    
    if (currentY < minY) {
      const speed = GAME_CONFIG.CAMERA_FOLLOW_SPEED;
      this.camera.position.y += speed * deltaTime;
    }
  }

  /**
   * Reset camera to initial position
   */
  resetCamera() {
    if (!this.camera) return;
    
    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Add object to scene
   * @param {THREE.Object3D} object 
   */
  addToScene(object) {
    if (this.scene) {
      this.scene.add(object);
    }
  }

  /**
   * Remove object from scene
   * @param {THREE.Object3D} object 
   */
  removeFromScene(object) {
    if (this.scene) {
      this.scene.remove(object);
    }
  }

  /**
   * Clear all meshes from scene
   */
  clearMeshes() {
    if (!this.scene) return;
    
    const meshesToRemove = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshesToRemove.push(child);
      }
    });
    
    meshesToRemove.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    
    this.clearMeshes();
    this.isInitialized = false;
  }
}