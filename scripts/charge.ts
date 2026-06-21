import { createCharge } from "@/lib/stripe-helpers";

function parseArgs(args: string[]) {
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

const flags = parseArgs(process.argv.slice(2));
const amount = Number(flags["amount"]);
const currency = String(flags["currency"] || "usd");
const description = flags["description"] ? String(flags["description"]) : undefined;
const source = flags["source"] ? String(flags["source"]) : "tok_visa";

if (!Number.isFinite(amount) || amount <= 0) {
  console.error("--amount must be a positive number");
  process.exit(1);
}

if (!process.env.STRIPE_TEST_SECRET_KEY) {
  console.error("Missing STRIPE_TEST_SECRET_KEY");
  process.exit(1);
}

createCharge(amount, currency, description, source)
  .then((charge) => {
    console.log(JSON.stringify(charge, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
