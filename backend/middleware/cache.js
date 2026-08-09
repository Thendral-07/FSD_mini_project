import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 }); // cache for 5 minutes

export const cacheMiddleware = (req, res, next) => {
  // Use user id and original url as the cache key to keep user data private
  const key = `__express__${req.userId || "public"}__${req.originalUrl || req.url}`;
  const cachedBody = cache.get(key);

  if (cachedBody) {
    return res.json(cachedBody);
  } else {
    // Override res.json to store the response in cache before sending
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful GET responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body);
      }
      originalJson(body);
    };
    next();
  }
};

export const clearCache = (userId, urlPattern = null) => {
  const keys = cache.keys();
  const prefix = `__express__${userId || "public"}__`;
  
  const keysToDelete = keys.filter(key => {
    if (!key.startsWith(prefix)) return false;
    if (urlPattern && !key.includes(urlPattern)) return false;
    return true;
  });

  cache.del(keysToDelete);
};
