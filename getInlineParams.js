const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);

const REDIS_HOSTS = require('./redis-hosts.js');

const client = redis.createClient({
  host: REDIS_HOSTS['local'],
  port: 6379
});

module.exports = params => (
  client.getAsync('player-frontend:current')
    .then(currentRevision => client.getAsync(`player-frontend-code:${currentRevision}`))
    .then(playerCode => ({
      playerCode: JSON.parse(playerCode),
      videoId: params.video_id
  }))
)
