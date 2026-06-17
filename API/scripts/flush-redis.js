const Redis = require('ioredis');

async function flush() {
  const client = new Redis();
  await client.flushdb();
  console.log('Redis flushed successfully');
  await client.quit();
}

flush().catch(console.error);
