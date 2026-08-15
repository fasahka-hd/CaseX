'use strict';

const crypto = require('crypto');

function createQueue(options = {}) {
  const cache = options.cache || null;
  const useRedis = !!(cache && cache.driver === 'redis');
  const handlers = new Map();
  const pending = [];
  const done = [];
  const failed = [];
  const MAX_HISTORY = 200;
  let running = false;
  let processed = 0;
  let errors = 0;

  function stats() {
    return {
      driver: useRedis ? 'redis-backed' : 'in-process',
      pending: pending.length,
      processed,
      errors,
      queues: [...handlers.keys()]
    };
  }

  function on(topic, handler) {
    handlers.set(topic, handler);
  }

  function publish(topic, payload, opts = {}) {
    const job = {
      id: crypto.randomBytes(8).toString('hex'),
      topic,
      payload,
      attempts: 0,
      maxAttempts: opts.maxAttempts || 3,
      runAt: Date.now() + (opts.delayMs || 0),
      createdAt: Date.now()
    };
    pending.push(job);
    if (useRedis && cache.set) {
      cache.set(`queue:job:${job.id}`, { topic, status: 'pending', createdAt: job.createdAt }, 3600);
    }
    setImmediate(drain);
    return job.id;
  }

  async function runJob(job) {
    const handler = handlers.get(job.topic);
    if (!handler) {
      failed.push({ ...job, error: 'нет обработчика' });
      errors += 1;
      return;
    }
    job.attempts += 1;
    try {
      await handler(job.payload, job);
      processed += 1;
      done.push({ id: job.id, topic: job.topic, finishedAt: Date.now() });
      if (done.length > MAX_HISTORY) done.shift();
      if (useRedis && cache.set) {
        cache.set(`queue:job:${job.id}`, { topic: job.topic, status: 'done', finishedAt: Date.now() }, 3600);
      }
    } catch (error) {
      if (job.attempts < job.maxAttempts) {
        job.runAt = Date.now() + 250 * job.attempts;
        pending.push(job);
      } else {
        errors += 1;
        failed.push({ id: job.id, topic: job.topic, error: error.message, failedAt: Date.now() });
        if (failed.length > MAX_HISTORY) failed.shift();
        if (useRedis && cache.set) {
          cache.set(`queue:job:${job.id}`, { topic: job.topic, status: 'failed', error: error.message }, 3600);
        }
      }
    }
  }

  async function drain() {
    if (running) return;
    running = true;
    try {
      while (pending.length) {
        const now = Date.now();
        const index = pending.findIndex(job => job.runAt <= now);
        if (index === -1) {
          const soonest = Math.min(...pending.map(job => job.runAt));
          setTimeout(drain, Math.max(20, soonest - now)).unref?.();
          break;
        }
        const [job] = pending.splice(index, 1);
        await runJob(job);
      }
    } finally {
      running = false;
    }
  }

  return { on, publish, stats, recent: () => done.slice(-20).reverse(), failures: () => failed.slice(-20).reverse() };
}

module.exports = { createQueue };
