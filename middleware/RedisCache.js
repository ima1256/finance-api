const Redis = require('redis');

class RedisCache {
  constructor() {
    this.redisClient = Redis.createClient();

    this.redisClient.on('error', (error) => {
      console.error('Redis error:', error);
    });

    // Ensure the Redis client is connected before starting the server
    (async () => {
      await this.redisClient.connect();
      //console.log('Connected to Redis');
    })();


    this.DEFAULT_EXPIRATION = 3600;
  }

  async getOrSetData(key, cb) {
    return new Promise(async (resolve, reject) => {
      try {
        // Attempt to get data from Redis
        const data = await this.redisClient.get(key);

        if (data != null) {
          // Data exists in Redis, resolve with parsed data
          return resolve(JSON.parse(data));
        }

        // Data does not exist in Redis, call the callback to get fresh data
        const freshData = await cb();

        // Set the fresh data in Redis with an expiration
        await this.redisClient.setEx(key, this.DEFAULT_EXPIRATION, JSON.stringify(freshData));

        // Resolve with the fresh data
        return resolve(freshData);
        
      } catch (error) {
        // Reject the promise if any error occurs
        return reject(error);
      }
    });
  }
}

module.exports = RedisCache;
