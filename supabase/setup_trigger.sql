-- 1. Add the test mode column securely
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_test_mode BOOLEAN DEFAULT false;

-- 2. Build the Trigger Function
-- This trigger fires SYNCHRONOUSLY when a new auth.users row is created.
-- It reads business_name and plan from raw_user_meta_data (set by the webhook's createUser call).
-- If no plan is provided (e.g. free registration), it defaults to 'starter'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_role_id UUID;
  v_plan TEXT;
BEGIN
  -- Read the plan from user metadata (set by the Paystack webhook).
  -- If not set (e.g. free Starter registration), default to 'starter'.
  v_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'starter');

  -- Insert the new Merchant record natively syncing with Supabase Auth
  INSERT INTO public.merchants (
    user_id,
    business_name,
    email,
    phone,
    subscription_plan,
    merchant_tier,
    verification_status,
    is_test_mode
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Default Business'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    v_plan,
    v_plan,
    'unverified',
    false
  )
  RETURNING id INTO v_merchant_id;

  -- Find the secure 'owner' role identifier
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'owner' LIMIT 1;

  -- Map the registering user securely into the team map
  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.merchant_team (
      merchant_id,
      user_id,
      role_id,
      is_active
    ) VALUES (
      v_merchant_id,
      NEW.id,
      v_role_id,
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Bind the trigger identically to auth insertions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
