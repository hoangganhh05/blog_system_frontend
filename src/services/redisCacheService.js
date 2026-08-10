// Dịch vụ RAM Redis Cache Layer cho hệ thống BlogViet
const memoryCache = new Map();

const redisCacheService = {
  get(key) {
    try {
      const item = memoryCache.get(key) || JSON.parse(sessionStorage.getItem(`redis_cache_${key}`) || "null");
      if (!item) return null;
      if (item.expiry && Date.now() > item.expiry) {
        this.remove(key);
        return null;
      }
      return item.value;
    } catch {
      return null;
    }
  },

  set(key, value, ttlSeconds = 300) {
    const item = {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    };
    memoryCache.set(key, item);
    try {
      sessionStorage.setItem(`redis_cache_${key}`, JSON.stringify(item));
    } catch {}
  },

  remove(key) {
    memoryCache.delete(key);
    try {
      sessionStorage.removeItem(`redis_cache_${key}`);
    } catch {}
  },

  clearAll() {
    memoryCache.clear();
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith("redis_cache_")) {
          sessionStorage.removeItem(k);
        }
      });
    } catch {}
  },
};

export default redisCacheService;
