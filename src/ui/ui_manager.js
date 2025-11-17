import { gameEvents, EVENTS } from '../core/event_system.js';
import { GAME_CONFIG } from '../config/game_config.js';

/**
 * Manages UI elements and user interactions
 */
export class UIManager {
  constructor() {
    this.scoreElement = null;
    this.instructionsElement = null;
    this.resultsElement = null;
    this.score = 0;
    this.isInitialized = false;
  }

  /**
   * Initialize UI manager and get DOM elements
   */
  initialize() {
    try {
      this.scoreElement = document.getElementById(GAME_CONFIG.SCORE_ELEMENT_ID);
      this.instructionsElement = document.getElementById(GAME_CONFIG.INSTRUCTIONS_ELEMENT_ID);
      this.resultsElement = document.getElementById(GAME_CONFIG.RESULTS_ELEMENT_ID);
      
      this.setupEventListeners();
      this.setupGameEventListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize UIManager:', error);
      throw error;
    }
  }

  /**
   * Setup DOM event listeners
   */
  setupEventListeners() {
    // Mouse and touch events
    window.addEventListener('mousedown', this.handleUserInput.bind(this));
    window.addEventListener('touchstart', this.handleUserInput.bind(this));
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Results screen click to restart
    if (this.resultsElement) {
      this.resultsElement.addEventListener('click', this.handleRestartClick.bind(this));
    }
  }

  /**
   * Setup game event listeners
   */
  setupGameEventListeners() {
    gameEvents.on(EVENTS.SCORE_UPDATE, this.updateScore.bind(this));
    gameEvents.on(EVENTS.GAME_START, this.showGameUI.bind(this));
    gameEvents.on(EVENTS.GAME_OVER, this.showGameOverUI.bind(this));
    gameEvents.on(EVENTS.GAME_RESET, this.resetUI.bind(this));
  }

  /**
   * Handle user input (mouse, touch)
   * @param {Event} event 
   */
  handleUserInput(event) {
    event.preventDefault();
    gameEvents.emit(EVENTS.BLOCK_PLACED);
  }

  /**
   * Handle keyboard input
   * @param {KeyboardEvent} event 
   */
  handleKeyDown(event) {
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      gameEvents.emit(EVENTS.BLOCK_PLACED);
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    gameEvents.emit(EVENTS.WINDOW_RESIZE);
  }

  /**
   * Handle restart button click
   * @param {Event} event 
   */
  handleRestartClick(event) {
    event.preventDefault();
    gameEvents.emit(EVENTS.GAME_RESET);
  }

  /**
   * Update score display
   * @param {number} newScore 
   */
  updateScore(newScore) {
    this.score = newScore;
    if (this.scoreElement) {
      this.scoreElement.textContent = this.score.toString();
    }
  }

  /**
   * Show game UI (hide instructions, show score)
   */
  showGameUI() {
    if (this.instructionsElement) {
      this.instructionsElement.style.display = 'none';
    }
    if (this.resultsElement) {
      this.resultsElement.style.display = 'none';
    }
    this.updateScore(0);
  }

  /**
   * Show game over UI
   */
  showGameOverUI() {
    if (this.resultsElement) {
      this.resultsElement.style.display = 'flex';
    }
  }

  /**
   * Show instructions UI
   */
  showInstructionsUI() {
    if (this.instructionsElement) {
      this.instructionsElement.style.display = 'flex';
    }
    if (this.resultsElement) {
      this.resultsElement.style.display = 'none';
    }
  }

  /**
   * Reset UI to initial state
   */
  resetUI() {
    this.showInstructionsUI();
    this.updateScore(0);
  }

  /**
   * Cleanup UI resources and event listeners
   */
  dispose() {
    // Remove DOM event listeners
    window.removeEventListener('mousedown', this.handleUserInput.bind(this));
    window.removeEventListener('touchstart', this.handleUserInput.bind(this));
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    if (this.resultsElement) {
      this.resultsElement.removeEventListener('click', this.handleRestartClick.bind(this));
    }
    
    this.isInitialized = false;
  }
}