-- Global API rate limiting table
CREATE TABLE IF NOT EXISTS public."ApiRateLimit" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL, -- e.g., user:<userId> or ip:<ip>
  route TEXT NOT NULL,
  windowStart TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  requestCount INTEGER NOT NULL DEFAULT 1,
  lastRequestAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apiratelimit_key_route ON public."ApiRateLimit"(key, route);
CREATE INDEX IF NOT EXISTS idx_apiratelimit_window ON public."ApiRateLimit"(windowStart);


