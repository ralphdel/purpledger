-- 1. Add the column
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS workspace_code VARCHAR(15) UNIQUE;

-- 2. Backfill existing merchants with a random PL code
UPDATE public.merchants 
SET workspace_code = 'PL' || lpad(floor(random() * 100000000000)::text, 11, '0')
WHERE workspace_code IS NULL;

-- 3. Make it required for future rows (optional, but good practice if you handle it in API)
-- ALTER TABLE public.merchants ALTER COLUMN workspace_code SET NOT NULL;
