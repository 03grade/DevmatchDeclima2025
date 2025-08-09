import winston from 'winston';

/**
 * Logger utility for D-Climate ROFL runtime
 * Provides structured logging with different levels and formats
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Console format with colors and timestamps
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'ROFL'}] ${level}: ${message} ${metaStr}`;
  })
);

// File format without colors
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: consoleFormat,
  }),
];

// Add file transports in production or if LOG_TO_FILE is enabled
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Handle unhandled rejections
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

/**
 * Create a child logger with service context
 */
export function createLogger(service: string): winston.Logger {
  return logger.child({ service });
}

/**
 * Default logger instance
 */
export default logger;

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  startTime: number,
  metadata?: Record<string, any>
): void {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...metadata,
  });
}

/**
 * Log security events
 */
export function logSecurity(
  event: string,
  details: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  logger.log(level, `Security: ${event}`, {
    securityEvent: event,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Log blockchain interactions
 */
export function logBlockchain(
  action: string,
  details: {
    contract?: string;
    method?: string;
    txHash?: string;
    gasUsed?: number;
    blockNumber?: number;
    [key: string]: any;
  }
): void {
  logger.info(`Blockchain: ${action}`, {
    blockchainAction: action,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Log data operations
 */
export function logDataOperation(
  operation: string,
  details: {
    sensorId?: string;
    dataSize?: number;
    ipfsCid?: string;
    validationResult?: boolean;
    [key: string]: any;
  }
): void {
  logger.info(`Data: ${operation}`, {
    dataOperation: operation,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Log AI operations
 */
export function logAI(
  operation: string,
  details: {
    model?: string;
    inputSize?: number;
    outputSize?: number;
    processingTime?: number;
    [key: string]: any;
  }
): void {
  logger.info(`AI: ${operation}`, {
    aiOperation: operation,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Log reward calculations
 */
export function logReward(
  operation: string,
  details: {
    sensorId?: string;
    amount?: number;
    reputation?: number;
    qualityScore?: number;
    [key: string]: any;
  }
): void {
  logger.info(`Reward: ${operation}`, {
    rewardOperation: operation,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Create logs directory if it doesn't exist
 */
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  const fs = require('fs');
  const path = require('path');
  
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}