import { verifyWebhookSignature } from "@/lib/stripe-helpers";

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
const secret = flags["secret"];
const payload = flags["payload"];
const signature = flags["sig"];

if (!secret || !payload || !signature) {
  console.error("--secret, --payload, and --sig are required");
  process.exit(1);
}

try {
  const event = verifyWebhookSignature(
    String(payload),
    String(signature),
    String(secret)
  );
  console.log(JSON.stringify(event, null, 2));
} catch (err) {
  console.error(err);
  process.exit(1);
}
