import { createCustomer } from "@/lib/stripe-helpers";

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
const email = flags["email"] ? String(flags["email"]) : undefined;
const name = flags["name"] ? String(flags["name"]) : undefined;

if (!process.env.STRIPE_TEST_SECRET_KEY) {
  console.error("Missing STRIPE_TEST_SECRET_KEY");
  process.exit(1);
}

createCustomer(email, name)
  .then((customer) => {
    console.log(JSON.stringify(customer, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
