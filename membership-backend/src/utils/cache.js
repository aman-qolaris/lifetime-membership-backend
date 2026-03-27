import NodeCache from "node-cache";

export const cacheKeys = Object.freeze({
  settingsAll: "settings:all",
  regionsActive: "regions:active",
  regionsAll: "regions:all",
});

// stdTTL=0 => never expire by default; we invalidate explicitly on updates.
export const cache = new NodeCache({
  stdTTL: 0,
  checkperiod: 0,
  useClones: false,
});

export const cacheGetOrSet = async (key, fetcher) => {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const value = await fetcher();
  cache.set(key, value);
  return value;
};

export const cacheDel = (keys) => {
  if (!keys) return;
  if (Array.isArray(keys)) {
    cache.del(keys);
    return;
  }

  cache.del([keys]);
};
