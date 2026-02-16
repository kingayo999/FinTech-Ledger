import prisma from './src/config/prisma';

async function main() {
    const sum = await prisma.ledgerEntry.aggregate({
        _sum: { amount: true }
    });

    console.log('Raw sum result:', JSON.stringify(sum, null, 2));

    if (sum._sum.amount) {
        console.log('Amount value:', sum._sum.amount.toString());
        console.log('Is Zero?', sum._sum.amount.isZero());
    } else {
        console.log('Amount is null (Empty ledger)');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
