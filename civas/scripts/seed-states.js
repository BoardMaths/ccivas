require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const isLocalhost = databaseUrl.includes("127.0.0.1") || databaseUrl.includes("localhost");
const isPgBouncer = databaseUrl.includes("pgbouncer=true");

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isLocalhost || isPgBouncer ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const states = [
    { name: 'Ebonyi', code: 'EB' },
    { name: 'Edo', code: 'ED' },
    { name: 'Imo', code: 'IM' },
    { name: 'Abia', code: 'AB' },
    { name: 'Adamawa', code: 'AD' },
    { name: 'Akwa Ibom', code: 'AK' },
    { name: 'Anambra', code: 'AN' },
    { name: 'Bauchi', code: 'BA' },
    { name: 'Bayelsa', code: 'BY' },
    { name: 'Benue', code: 'BE' },
    { name: 'Borno', code: 'BO' },
    { name: 'Cross River', code: 'CR' },
    { name: 'Delta', code: 'DE' },
    { name: 'Ekiti', code: 'EK' },
    { name: 'Enugu', code: 'EN' },
    { name: 'Gombe', code: 'GO' },
    { name: 'Jigawa', code: 'JI' },
    { name: 'Kaduna', code: 'KA' },
    { name: 'Kano', code: 'KN' },
    { name: 'Katsina', code: 'KT' },
    { name: 'Kebbi', code: 'KE' },
    { name: 'Kogi', code: 'KO' },
    { name: 'Kwara', code: 'KW' },
    { name: 'Lagos', code: 'LA' },
    { name: 'Nasarawa', code: 'NA' },
    { name: 'Niger', code: 'NI' },
    { name: 'Ogun', code: 'OG' },
    { name: 'Ondo', code: 'ON' },
    { name: 'Osun', code: 'OS' },
    { name: 'Oyo', code: 'OY' },
    { name: 'Plateau', code: 'PL' },
    { name: 'Rivers', code: 'RI' },
    { name: 'Sokoto', code: 'SO' },
    { name: 'Taraba', code: 'TA' },
    { name: 'Yobe', code: 'YO' },
    { name: 'Zamfara', code: 'ZA' },
    { name: 'FCT Abuja', code: 'FC' }
];

async function main() {
    console.log('--- CIVAS Regional Registry Expansion ---');

    for (const state of states) {
        try {
            const existing = await prisma.state.findUnique({
                where: { code: state.code }
            });

            if (!existing) {
                await prisma.state.create({ data: state });
                console.log(`✅ Activated: ${state.name} (${state.code})`);
            } else {
                console.log(`ℹ️ Already Active: ${state.name}`);
            }
        } catch (e) {
            console.error(`❌ Failed: ${state.name}`, e.message);
        }
    }

    console.log('--- Expansion Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
