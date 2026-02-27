import "dotenv/config";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
    const states = [
        { name: "Abia", code: "AB" },
        { name: "Adamawa", code: "AD" },
        { name: "Akwa Ibom", code: "AK" },
        { name: "Anambra", code: "AN" },
        { name: "Bauchi", code: "BA" },
        { name: "Bayelsa", code: "BY" },
        { name: "Benue", code: "BN" },
        { name: "Borno", code: "BO" },
        { name: "Cross River", code: "CR" },
        { name: "Delta", code: "DT" },
        { name: "Ebonyi", code: "EB" },
        { name: "Edo", code: "ED" },
        { name: "Ekiti", code: "EK" },
        { name: "Enugu", code: "EN" },
        { name: "FCT", code: "FC" },
        { name: "Gombe", code: "GB" },
        { name: "Imo", code: "IM" },
        { name: "Jigawa", code: "JG" },
        { name: "Kaduna", code: "KD" },
        { name: "Kano", code: "KN" },
        { name: "Katsina", code: "KT" },
        { name: "Kebbi", code: "KB" },
        { name: "Kogi", code: "KG" },
        { name: "Kwara", code: "KW" },
        { name: "Lagos", code: "LA" },
        { name: "Nasarawa", code: "NA" },
        { name: "Niger", code: "NG" },
        { name: "Ogun", code: "OG" },
        { name: "Ondo", code: "ON" },
        { name: "Osun", code: "OS" },
        { name: "Oyo", code: "OY" },
        { name: "Plateau", code: "PL" },
        { name: "Rivers", code: "RV" },
        { name: "Sokoto", code: "SK" },
        { name: "Taraba", code: "TR" },
        { name: "Yobe", code: "YB" },
        { name: "Zamfara", code: "ZM" }
    ];

    console.log("Seeding states...");

    for (const s of states) {
        await prisma.state.upsert({
            where: { name: s.name },
            update: { code: s.code },
            create: { name: s.name, code: s.code },
        });
    }

    console.log(`Successfully seeded ${states.length} states.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
