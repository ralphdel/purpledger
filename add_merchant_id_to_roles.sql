ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id);
