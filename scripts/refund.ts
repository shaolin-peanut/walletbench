import { refundCharge } from "@/lib/stripe-helpers";

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
const chargeId = flags["charge"];
const amount = flags["amount"] ? Number(flags["amount"]) : undefined;

if (!chargeId) {
  console.error("--charge is required");
  process.exit(1);
}

if (!process.env.STRIPE_TEST_SECRET_KEY) {
  console.error("Missing STRIPE_TEST_SECRET_KEY");
  process.exit(1);
}

refundCharge(String(chargeId), amount)
  .then((refund) => {
    console.log(JSON.stringify(refund, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
