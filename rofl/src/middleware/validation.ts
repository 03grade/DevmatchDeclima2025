import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createLogger } from '../utils/logger';

const logger = createLogger('ValidationMiddleware');

/**
 * Validation schemas for D-Climate API endpoints
 */
export const validationSchemas = {
  // Sensor ID validation
  sensorId: Joi.string()
    .pattern(/^[A-Z]{3}[a-f0-9]{8}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}(-\d{2})?$/)
    .required()
    .messages({
      'string.pattern.base': 'Sensor ID must be in valid format (PREFIX + UUID v4)',
      'any.required': 'Sensor ID is required'
    }),

  // Climate data validation
  climateData: Joi.object({
    sensorId: Joi.string()
      .pattern(/^[A-Z]{3}[a-f0-9]{8}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}(-\d{2})?$/)
      .required(),
    timestamp: Joi.number()
      .integer()
      .min(1600000000) // Sept 2020
      .max(Math.floor(Date.now() / 1000) + 300) // Max 5 minutes in future
      .required(),
    co2: Joi.number()
      .min(300)
      .max(10000)
      .required(),
    temperature: Joi.number()
      .min(-50)
      .max(60)
      .required(),
    humidity: Joi.number()
      .min(0)
      .max(100)
      .required()
  }).required(),

  // Data submission validation
  dataSubmission: Joi.object({
    sensorId: Joi.string()
      .pattern(/^[A-Z]{3}[a-f0-9]{8}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}(-\d{2})?$/)
      .required(),
    ipfsCid: Joi.string()
      .pattern(/^Qm[A-Za-z0-9]{44}$/)
      .required()
      .messages({
        'string.pattern.base': 'IPFS CID must be in valid format (Qm + 44 characters)'
      }),
    encryptedKey: Joi.string()
      .base64()
      .required(),
    recordHash: Joi.string()
      .pattern(/^[a-f0-9]{64}$/)
      .required()
      .messages({
        'string.pattern.base': 'Record hash must be a valid 64-character hex string (SHA-256)'
      })
  }).required(),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),
    offset: Joi.number()
      .integer()
      .min(0)
      .default(0)
  }),

  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.number()
      .integer()
      .min(1600000000) // Sept 2020
      .max(Math.floor(Date.now() / 1000)),
    endDate: Joi.number()
      .integer()
      .min(Joi.ref('startDate'))
      .max(Math.floor(Date.now() / 1000))
  }),

  // Region filter validation
  regionFilter: Joi.object({
    country: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s-]+$/),
    state: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s-]+$/),
    city: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s-]+$/)
  }),

  // AI summary request validation
  aiSummaryRequest: Joi.object({
    type: Joi.string()
      .valid('daily_overview', 'regional_snapshot', 'anomaly_highlights')
      .required(),
    region: Joi.string()
      .min(2)
      .max(50)
      .when('type', {
        is: 'regional_snapshot',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    startDate: Joi.number()
      .integer()
      .min(1600000000),
    endDate: Joi.number()
      .integer()
      .min(Joi.ref('startDate'))
      .max(Math.floor(Date.now() / 1000))
  }),

  // Sensor minting validation
  sensorMinting: Joi.object({
    metadata: Joi.object({
      sensorType: Joi.string()
        .valid('climate', 'air_quality', 'weather')
        .default('climate'),
      location: Joi.string()
        .min(2)
        .max(100),
      description: Joi.string()
        .max(500)
    }),
    ipfsMetadata: Joi.string()
      .pattern(/^Qm[A-Za-z0-9]{44}$/)
      .required()
  }),

  // Wallet address validation
  walletAddress: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid Ethereum wallet address'
    })
};

/**
 * Generic validation middleware factory
 */
export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Validation failed', {
          property,
          errors: validationErrors,
          originalData: req[property]
        });

        res.status(400).json({
          error: 'Validation failed',
          message: 'Request data does not meet validation requirements',
          details: validationErrors
        });
        return;
      }

      // Replace the original data with validated and transformed data
      req[property] = value;
      next();

    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Validation processing failed'
      });
    }
  };
};

/**
 * Specific validation middleware for common use cases
 */

// Validate sensor ID in URL params
export const validateSensorId = validateRequest(
  Joi.object({ sensorId: validationSchemas.sensorId }),
  'params'
);

// Validate wallet address in URL params
export const validateWalletAddress = validateRequest(
  Joi.object({ address: validationSchemas.walletAddress }),
  'params'
);

// Validate climate data in request body
export const validateClimateData = validateRequest(
  validationSchemas.climateData,
  'body'
);

// Validate data submission in request body
export const validateDataSubmission = validateRequest(
  validationSchemas.dataSubmission,
  'body'
);

// Validate pagination in query params
export const validatePagination = validateRequest(
  validationSchemas.pagination,
  'query'
);

// Validate date range in query params
export const validateDateRange = validateRequest(
  validationSchemas.dateRange,
  'query'
);

// Validate region filter in query params
export const validateRegionFilter = validateRequest(
  validationSchemas.regionFilter,
  'query'
);

// Validate AI summary request
export const validateAISummaryRequest = validateRequest(
  validationSchemas.aiSummaryRequest,
  'body'
);

// Validate sensor minting request
export const validateSensorMinting = validateRequest(
  validationSchemas.sensorMinting,
  'body'
);

/**
 * Custom validation for complex scenarios
 */

// Validate data batch submission
export const validateDataBatch = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const batchSchema = Joi.object({
      submissions: Joi.array()
        .items(validationSchemas.dataSubmission)
        .min(1)
        .max(50)
        .required()
        .messages({
          'array.min': 'Batch must contain at least 1 submission',
          'array.max': 'Batch cannot contain more than 50 submissions'
        })
    });

    const { error, value } = batchSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      res.status(400).json({
        error: 'Batch validation failed',
        message: 'One or more submissions in the batch are invalid',
        details: validationErrors
      });
      return;
    }

    req.body = value;
    next();

  } catch (error) {
    logger.error('Batch validation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Batch validation processing failed'
    });
  }
};

// Validate time-based queries
export const validateTimeQuery = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const timeSchema = Joi.object({
      timeRange: Joi.string()
        .valid('1h', '6h', '24h', '7d', '30d', '90d', 'all')
        .default('24h'),
      startDate: Joi.number()
        .integer()
        .min(1600000000),
      endDate: Joi.number()
        .integer()
        .min(Joi.ref('startDate'))
        .max(Math.floor(Date.now() / 1000)),
      granularity: Joi.string()
        .valid('raw', 'minute', 'hour', 'day')
        .default('hour')
    }).oxor('timeRange', 'startDate') // Either timeRange OR startDate/endDate, not both
      .with('startDate', 'endDate'); // If startDate is provided, endDate is required

    const { error, value } = timeSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        error: 'Time query validation failed',
        details: validationErrors
      });
      return;
    }

    req.query = value;
    next();

  } catch (error) {
    logger.error('Time query validation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Time query validation processing failed'
    });
  }
};

/**
 * Sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Basic sanitization for string inputs
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.trim();
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);

    next();

  } catch (error) {
    logger.error('Sanitization error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Input sanitization failed'
    });
  }
};