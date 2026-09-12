import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';

export const cache = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (!redis || redis.status !== 'ready' || req.method !== 'GET') {
      return next();
    }

    // Build a unique key based on URL and query params
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redis.get(key);
      if (cachedData) {
        logger.info(`Cache hit for ${key}`);
        res.json(JSON.parse(cachedData));
        return;
      }

      logger.info(`Cache miss for ${key}`);

      // Override res.json to capture the response and save it to Redis
      const originalJson = res.json.bind(res);
      res.json = (body: unknown) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis!.setex(key, durationInSeconds, JSON.stringify(body)).catch((err: Error) => {
            logger.error(err, `Failed to set cache for ${key}`);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error(error, 'Cache middleware error');
      next();
    }
  };
};

export const clearCache = async (pattern: string) => {
  try {
    if (!redis || redis.status !== 'ready') return;
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) await redis.unlink(...keys);
    } while (cursor !== '0');
  } catch (error) {
    logger.error(error, 'Error clearing cache');
  }
};
