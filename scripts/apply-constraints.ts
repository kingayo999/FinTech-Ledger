import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Apply database-level integrity constraints
 * Run this script AFTER Prisma migrations: node scripts/apply-constraints.ts
 */
async function applyConstraints() {
    console.log('Applying database integrity constraints...\n');

    try {
        // 1. Create function to prevent ledger modifications
        console.log('1. Creating immutability function...');
        await prisma.$executeRaw`
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
        `;
        console.log('   ✅ Function created\n');

        // 2. Apply trigger to LedgerEntry
        console.log('2. Applying trigger to LedgerEntry...');
        await prisma.$executeRaw`
            DROP TRIGGER IF EXISTS enforce_ledger_immutability ON "LedgerEntry";
        `;
        await prisma.$executeRaw`
            CREATE TRIGGER enforce_ledger_immutability
            BEFORE UPDATE OR DELETE ON "LedgerEntry"
            FOR EACH ROW
            EXECUTE FUNCTION prevent_ledger_modification();
        `;
        console.log('   ✅ Ledger immutability enforced\n');

        // 3. Apply trigger to AuditLog
        console.log('3. Applying trigger to AuditLog...');
        await prisma.$executeRaw`
            DROP TRIGGER IF EXISTS enforce_audit_immutability ON "AuditLog";
        `;
        await prisma.$executeRaw`
            CREATE TRIGGER enforce_audit_immutability
            BEFORE UPDATE OR DELETE ON "AuditLog"
            FOR EACH ROW
            EXECUTE FUNCTION prevent_ledger_modification();
        `;
        console.log('   ✅ Audit log immutability enforced\n');

        // 4. Add balance non-negativity constraint
        console.log('4. Adding balance non-negativity constraint...');
        try {
            await prisma.$executeRaw`
                ALTER TABLE "Wallet" ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);
            `;
            console.log('   ✅ Balance constraint added\n');
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                console.log('   ⚠️  Constraint already exists\n');
            } else {
                throw error;
            }
        }

        // 5. Add ledger entry amount non-zero constraint
        console.log('5. Adding amount non-zero constraint...');
        try {
            await prisma.$executeRaw`
                ALTER TABLE "LedgerEntry" ADD CONSTRAINT amount_not_zero CHECK (amount != 0);
            `;
            console.log('   ✅ Amount constraint added\n');
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                console.log('   ⚠️  Constraint already exists\n');
            } else {
                throw error;
            }
        }

        console.log('✅ All database integrity constraints applied successfully!\n');

        // Verify constraints
        console.log('Verifying constraints...');
        const result = await prisma.$queryRaw<any[]>`
            SELECT 
                tc.table_name, 
                tc.constraint_name, 
                tc.constraint_type
            FROM information_schema.table_constraints tc
            WHERE tc.table_schema = 'public'
            AND tc.table_name IN ('LedgerEntry', 'AuditLog', 'Wallet')
            AND tc.constraint_type IN ('CHECK')
            ORDER BY tc.table_name, tc.constraint_type;
        `;

        console.log('\nActive constraints:');
        result.forEach(row => {
            console.log(`  - ${row.table_name}: ${row.constraint_name} (${row.constraint_type})`);
        });

    } catch (error) {
        console.error('❌ Error applying constraints:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

applyConstraints();
