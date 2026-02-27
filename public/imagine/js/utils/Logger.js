// utils/Logger.js – Simple logging with levels
export const Logger = {
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },
    currentLevel: 0, // set to 0 for production? but we keep debug for now
    
    debug(...args) {
        if (this.currentLevel <= this.levels.DEBUG) {
            console.debug('[DEBUG]', ...args);
        }
    },
    
    info(...args) {
        if (this.currentLevel <= this.levels.INFO) {
            console.info('[INFO]', ...args);
        }
    },
    
    warn(...args) {
        if (this.currentLevel <= this.levels.WARN) {
            console.warn('[WARN]', ...args);
        }
    },
    
    error(...args) {
        if (this.currentLevel <= this.levels.ERROR) {
            console.error('[ERROR]', ...args);
        }
    }
};