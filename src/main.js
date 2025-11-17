import { RenderManager } from './core/render_manager.js';
import { PhysicsManager } from './core/physics_manager.js';
import { UIManager } from './ui/ui_manager.js';
import { GameLogic } from './game/game_logic.js';
import { gameEvents, EVENTS } from './core/event_system.js';
import { GAME_CONFIG } from './config/game_config.js';

/**
 * Main game class that orchestrates all systems
 */
export class StackGame {
  constructor() {
    this.renderManager = null;
    this.physicsManager = null;
    this.uiManager = null;
    this.gameLogic = null;
    
    this.isRunning = false;
    this.lastTime = 0;
    this.animationId = null;
    
    // Bind methods to maintain context
    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Initialize the game
   */
  async initialize() {
    try {
      // Initialize core systems
      this.renderManager = new RenderManager();
      this.physicsManager = new PhysicsManager();
      this.uiManager = new UIManager();
      
      await this.renderManager.initialize();
      await this.physicsManager.initialize();
      await this.uiManager.initialize();
      
      // Initialize game logic
      this.gameLogic = new GameLogic(this.renderManager, this.physicsManager);
      this.gameLogic.initialize();
      
      // Setup global event listeners
      this.setupEventListeners();
      
      // Start the game loop
      this.start();
      
      console.log('Stack Game initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Stack Game:', error);
      throw error;
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    gameEvents.on(EVENTS.WINDOW_RESIZE, this.handleResize);
    
    // Handle visibility change to pause/resume game
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = 0;
    this.animate(0);
    
    // Show instructions initially
    this.uiManager.resetUI();
  }

  /**
   * Pause the game
   */
  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.isRunning) return;
    
    this.start();
  }

  /**
   * Main animation loop
   * @param {number} currentTime 
   */
  animate(currentTime) {
    if (!this.isRunning) return;
    
    // Calculate delta time
    let deltaTime = 0;
    if (this.lastTime > 0) {
      deltaTime = currentTime - this.lastTime;
    }
    this.lastTime = currentTime;
    
    try {
      // Update game logic
      if (this.gameLogic) {
        this.gameLogic.update(deltaTime);
      }
      
      // Update physics
      if (this.physicsManager) {
        this.physicsManager.step(deltaTime);
      }
      
      // Render the scene
      if (this.renderManager) {
        this.renderManager.render();
      }
    } catch (error) {
      console.error('Error in animation loop:', error);
      this.pause();
      return;
    }
    
    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.renderManager) {
      this.renderManager.handleResize();
    }
  }

  /**
   * Restart the game
   */
  restart() {
    if (this.gameLogic) {
      this.gameLogic.startGame();
    }
  }

  /**
   * Get current game statistics
   * @returns {Object}
   */
  getGameStats() {
    if (!this.gameLogic) return null;
    
    return {
      score: this.gameLogic.getScore(),
      stackHeight: this.gameLogic.getStackHeight(),
      isAutopilot: this.gameLogic.isInAutopilot(),
      isGameEnded: this.gameLogic.hasGameEnded()
    };
  }

  /**
   * Cleanup and dispose of all resources
   */
  dispose() {
    this.pause();
    
    // Clear event listeners
    gameEvents.clear();
    document.removeEventListener('visibilitychange', () => {});
    
    // Dispose of systems
    if (this.gameLogic) {
      this.gameLogic.clearGame();
    }
    
    if (this.uiManager) {
      this.uiManager.dispose();
    }
    
    if (this.renderManager) {
      this.renderManager.dispose();
    }
    
    if (this.physicsManager) {
      this.physicsManager.dispose();
    }
    
    console.log('Stack Game disposed');
  }
}

// Auto-initialize when DOM is ready
let game = null;

function initializeGame() {
  try {
    game = new StackGame();
    game.initialize();
    
    // Make game globally accessible for debugging
    window.stackGame = game;
  } catch (error) {
    console.error('Failed to start Stack Game:', error);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (game) {
    game.dispose();
  }
});

export default StackGame;