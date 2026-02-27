import "dotenv/config";

const url = process.env.DATABASE_URL || "";
// Mask password
const masked = url.replace(/:[^:@]+@/, ":****@");
console.log("URL:", masked);
const hasBackslash = url.includes("\\$");
const hasDollar = url.includes("$Secure");
console.log("Has \\$:", hasBackslash);
console.log("Has $Secure:", hasDollar);
