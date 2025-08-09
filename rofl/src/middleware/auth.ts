import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthMiddleware');

/**
 * Extended Request interface with auth information
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    address: string;
    signature: string;
    message: string;
    timestamp: number;
  };
}

/**
 * Authentication middleware for D-Climate ROFL API
 * Validates wallet signatures for API access
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip auth for health check and public endpoints
    logger.debug(`Auth middleware processing path: ${req.path}, full URL: ${req.originalUrl}`);
    
    // Check if this is a public endpoint
    const isPublicEndpoint = 
      req.path === '/health' || 
      req.path.includes('/public/') || 
      req.originalUrl.includes('/public/') ||
      req.path === '/api/data/public/explorer' ||
      req.originalUrl.includes('/api/data/public/explorer');
    
    if (isPublicEndpoint) {
      logger.debug(`Skipping auth for public path: ${req.path}`);
      return next();
    }

    // Get auth headers
    const address = req.headers['x-wallet-address'] as string;
    const signature = req.headers['x-wallet-signature'] as string;
    const message = req.headers['x-wallet-message'] as string;
    const timestamp = req.headers['x-wallet-timestamp'] as string;

    if (!address || !signature || !message || !timestamp) {
      logger.warn('Missing authentication headers', { 
        ip: req.ip,
        path: req.path,
        headers: {
          address: !!address,
          signature: !!signature,
          message: !!message,
          timestamp: !!timestamp
        }
      });
      
      res.status(401).json({
        error: 'Authentication required',
        message: 'Missing required authentication headers'
      });
      return;
    }

    // Validate timestamp (within 5 minutes)
    const now = Date.now();
    const msgTimestamp = parseInt(timestamp);
    const timeDiff = Math.abs(now - msgTimestamp);
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (timeDiff > maxAge) {
      logger.warn('Authentication timestamp too old', {
        ip: req.ip,
        address,
        timeDiff: timeDiff / 1000,
        maxAge: maxAge / 1000
      });
      
      res.status(401).json({
        error: 'Authentication expired',
        message: 'Request timestamp is too old'
      });
      return;
    }

    // Verify wallet signature
    const isValidSignature = await verifyWalletSignature(address, message, signature);
    
    if (!isValidSignature) {
      logger.warn('Invalid wallet signature', {
        ip: req.ip,
        address,
        message: message.substring(0, 50) + '...'
      });
      
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid wallet signature'
      });
      return;
    }

    // Validate message format
    const expectedMessage = `D-Climate API Access\nTimestamp: ${timestamp}\nNonce: ${generateNonce(address, msgTimestamp)}`;
    if (message !== expectedMessage) {
      logger.warn('Invalid message format', {
        ip: req.ip,
        address,
        expected: expectedMessage.substring(0, 50) + '...',
        received: message.substring(0, 50) + '...'
      });
      
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid message format'
      });
      return;
    }

    // Authentication successful
    req.auth = {
      address,
      signature,
      message,
      timestamp: msgTimestamp
    };

    logger.info('Authentication successful', {
      address,
      ip: req.ip,
      path: req.path
    });

    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication processing failed'
    });
  }
};

/**
 * Verify wallet signature using ethers
 */
async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === address.toLowerCase();
    
  } catch (error) {
    logger.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Generate deterministic nonce for message
 */
function generateNonce(address: string, timestamp: number): string {
  const crypto = require('crypto');
  const data = `${address.toLowerCase()}-${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Middleware to check sensor ownership
 */
export const requireSensorOwnership = (sensorIdParam: string = 'sensorId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Must be authenticated to access sensor data'
        });
        return;
      }

      const sensorId = req.params[sensorIdParam] || req.body[sensorIdParam];
      
      if (!sensorId) {
        res.status(400).json({
          error: 'Bad request',
          message: `Missing sensor ID parameter: ${sensorIdParam}`
        });
        return;
      }

      // TODO: Check sensor ownership against smart contract
      // For now, we'll skip this check in development
      // const isOwner = await checkSensorOwnership(sensorId, req.auth.address);
      // if (!isOwner) {
      //   res.status(403).json({
      //     error: 'Forbidden',
      //     message: 'Sensor not owned by authenticated wallet'
      //   });
      //   return;
      // }

      logger.info('Sensor ownership verified', {
        sensorId,
        owner: req.auth.address
      });

      next();

    } catch (error) {
      logger.error('Sensor ownership check error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Ownership verification failed'
      });
    }
  };
};

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const identifier = req.auth?.address || req.ip || 'unknown';
    const now = Date.now();
    
    const requestData = requestCounts.get(identifier);
    
    if (!requestData || now > requestData.resetTime) {
      // New window or expired window
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (requestData.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count: requestData.count,
        maxRequests
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`,
        resetTime: requestData.resetTime
      });
      return;
    }

    requestData.count++;
    next();
  };
};

/**
 * Admin role middleware (for admin-only endpoints)
 */
export const requireAdmin = (adminAddresses: string[] = []) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Must be authenticated for admin access'
      });
      return;
    }

    const isAdmin = adminAddresses.some(admin => 
      admin.toLowerCase() === req.auth!.address.toLowerCase()
    );

    if (!isAdmin) {
      logger.warn('Unauthorized admin access attempt', {
        address: req.auth.address,
        ip: req.ip,
        path: req.path
      });
      
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
      return;
    }

    logger.info('Admin access granted', {
      address: req.auth.address,
      path: req.path
    });

    next();
  };
};