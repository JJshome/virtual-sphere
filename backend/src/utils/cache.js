/**
 * Cache Utility - VirtualSphere System
 * Redis 기반 캐싱 시스템
 */

const redis = require('redis');
const logger = require('./logger');

class Cache {
  constructor(defaultTTL = 3600) {
    this.client = null;
    this.defaultTTL = defaultTTL;
    this.isConnected = false;
    this.hitCount = 0;
    this.missCount = 0;
  }

  async initialize() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
        retry_delay_on_failure: 2000,
        max_attempts: 3
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis cache connected');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis cache error:', err);
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.warn('Redis cache disconnected');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis cache:', error);
      // Continue without cache if Redis is not available
    }
  }

  async get(key) {
    if (!this.isConnected) {
      this.missCount++;
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value !== null) {
        this.hitCount++;
        return JSON.parse(value);
      } else {
        this.missCount++;
        return null;
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      this.missCount++;
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      const expiration = ttl || this.defaultTTL;
      
      await this.client.setEx(key, expiration, serializedValue);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async clear() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  getHitRate() {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  getStats() {
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: this.getHitRate(),
      isConnected: this.isConnected
    };
  }

  async close() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis cache connection closed');
    }
  }
}

module.exports = Cache;
