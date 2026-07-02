/**
 * Almacén de estado de flujo por contacto.
 * Usa Redis si está disponible; fallback en memoria para desarrollo sin Docker.
 */

type FlowStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
};

class MemoryFlowStore implements FlowStore {
  private readonly map = new Map<string, string>();

  async get(key: string) {
    return this.map.get(key) ?? null;
  }

  async set(key: string, value: string) {
    this.map.set(key, value);
  }

  async del(key: string) {
    this.map.delete(key);
  }
}

let memoryStore: MemoryFlowStore | null = null;
let redisStore: FlowStore | null = null;
let redisUnavailable = false;

async function getRedisStore(): Promise<FlowStore | null> {
  if (redisUnavailable || !process.env.REDIS_URL) {
    return null;
  }
  if (redisStore) return redisStore;

  try {
    const { default: Redis } = await import("ioredis");
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      lazyConnect: true,
    });
    await client.connect();
    redisStore = {
      get: (key) => client.get(key),
      set: (key, value) => client.set(key, value).then(() => undefined),
      del: (key) => client.del(key).then(() => undefined),
    };
    return redisStore;
  } catch {
    redisUnavailable = true;
    console.warn("[flow-store] Redis no disponible; usando memoria en proceso.");
    return null;
  }
}

function getMemoryStore(): FlowStore {
  if (!memoryStore) memoryStore = new MemoryFlowStore();
  return memoryStore;
}

export async function getFlowStore(): Promise<FlowStore> {
  const redis = await getRedisStore();
  return redis ?? getMemoryStore();
}

export function flowContactKey(contactId: string) {
  return `flow:contact:${contactId}:currentNodeId`;
}
