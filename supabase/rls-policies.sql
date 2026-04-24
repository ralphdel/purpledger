-- ═══════════════════════════════════════════════════════════════════════════════
-- PurpLedger — RLS Policies (Run AFTER schema.sql)
-- Allows anon key to read all data during development / demo mode
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- ── Development / Demo: Allow public read on all tables ─────────────────────
-- These will be tightened once auth is wired up.

CREATE POLICY "Allow public read merchants"
  ON merchants FOR SELECT USING (true);

CREATE POLICY "Allow public read clients"
  ON clients FOR SELECT USING (true);

CREATE POLICY "Allow public read invoices"
  ON invoices FOR SELECT USING (true);

CREATE POLICY "Allow public read line_items"
  ON line_items FOR SELECT USING (true);

CREATE POLICY "Allow public read transactions"
  ON transactions FOR SELECT USING (true);

CREATE POLICY "Allow public read audit_logs"
  ON audit_logs FOR SELECT USING (true);

CREATE POLICY "Allow public read roles"
  ON roles FOR SELECT USING (true);

CREATE POLICY "Allow public read merchant_team"
  ON merchant_team FOR SELECT USING (true);

CREATE POLICY "Allow public read pending_invites"
  ON pending_invites FOR SELECT USING (true);

CREATE POLICY "Allow public read platform_settings"
  ON platform_settings FOR SELECT USING (true);

-- ── Allow updates (for admin actions like approve/reject) ───────────────────
CREATE POLICY "Allow public update merchants"
  ON merchants FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert audit_logs"
  ON audit_logs FOR INSERT WITH CHECK (true);

-- ── Allow invoice mutations (close, reopen, edit) ──────────────────────────
CREATE POLICY "Allow public update invoices"
  ON invoices FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert line_items"
  ON line_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update line_items"
  ON line_items FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete line_items"
  ON line_items FOR DELETE USING (true);
