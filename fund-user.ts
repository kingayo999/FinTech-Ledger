import prisma from './src/config/prisma';
import { LedgerService } from './src/services/ledger.service';
import { WalletService } from './src/services/wallet.service';

/*
 * Usage: npx tsx fund-user.ts <email> <amount>
 * Example: npx tsx fund-user.ts user@example.com 1000
 */

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: npx tsx fund-user.ts <email> <amount>');
        process.exit(1);
    }

    const email = args[0];
    const amount = parseFloat(args[1]);

    if (isNaN(amount) || amount <= 0) {
        console.error('Error: Amount must be a positive number');
        process.exit(1);
    }

    console.log(`Funding user ${email} with $${amount}...`);

    try {
        // 1. Find User
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.error(`Error: User with email '${email}' not found`);
            process.exit(1);
        }

        // 2. Find Wallet
        // We assume the user has a USD wallet (default)
        const wallets = await WalletService.getWalletsByUser(user.id);
        const wallet = wallets.find(w => w.currency === 'USD');

        if (!wallet) {
            console.error(`Error: User has no USD wallet`);
            process.exit(1);
        }

        console.log(`Found wallet: ${wallet.id} (Current Balance: ${wallet.balance})`);

        // 3. Fund Wallet
        const transaction = await LedgerService.fund(wallet.id, amount);

        console.log('✅ Funding Successful!');
        console.log('Transaction ID:', transaction.id);
        console.log('New Balance:', transaction.newBalance);

    } catch (error: any) {
        console.error('❌ Funding Failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
