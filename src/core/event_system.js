/**
 * Simple event system for decoupled communication between game components
 */
export class EventSystem {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventName)?.delete(callback);
    };
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName 
   * @param {*} data 
   */
  emit(eventName, data = null) {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName 
   */
  removeAllListeners(eventName) {
    this.listeners.delete(eventName);
  }

  /**
   * Clear all event listeners
   */
  clear() {
    this.listeners.clear();
  }
}

// Global event system instance
export const gameEvents = new EventSystem();

// Event constants
export const EVENTS = {
  GAME_START: 'game_start',
  GAME_OVER: 'game_over',
  GAME_RESET: 'game_reset',
  SCORE_UPDATE: 'score_update',
  BLOCK_PLACED: 'block_placed',
  BLOCK_MISSED: 'block_missed',
  LAYER_ADDED: 'layer_added',
  WINDOW_RESIZE: 'window_resize'
};