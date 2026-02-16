-- =====================================================
-- DATABASE CONSTRAINTS FOR FINANCIAL INTEGRITY
-- =====================================================

-- 1. LEDGER IMMUTABILITY
-- Prevent any modifications or deletions to the immutable ledger
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'LedgerEntry is immutable. Updates are not allowed.';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'LedgerEntry is immutable. Deletions are not allowed.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_ledger_immutability
BEFORE UPDATE OR DELETE ON "LedgerEntry"
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();

-- 2. AUDIT LOG IMMUTABILITY
-- Prevent modifications to audit logs
CREATE TRIGGER enforce_audit_immutability
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();

-- 3. WALLET BALANCE NON-NEGATIVITY
-- Ensure wallet balances never go negative
ALTER TABLE "Wallet" ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);

-- 4. LEDGER ENTRY AMOUNT NON-ZERO
-- Prevent zero-amount ledger entries (meaningless transactions)
ALTER TABLE "LedgerEntry" ADD CONSTRAINT amount_not_zero CHECK (amount != 0);
