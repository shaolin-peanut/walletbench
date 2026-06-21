import { Wallet } from "../src/lib/wallet";
import { Policy, ReceiptSchema } from "../src/lib/types";
import { PolicyError } from "../src/lib/policy";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  pass: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

async function runTests(): Promise<void> {
  const policy: Policy = {
    spend_cap_cents: 1000,
    approval_threshold_cents: 500,
    forbidden_tools: [],
  };

  const wallet = new Wallet("run_test_001", 2000, "usd", policy);

  // 1. Initial balance
  assert(wallet.getBalance() === 2000, "initial balance is startCents");

  // 2. Mock mode charge
  const chargeReceipt = await wallet.charge(300, "test purchase");
  assert(chargeReceipt.kind === "charge", "charge receipt kind is charge");
  assert(chargeReceipt.amount_cents === 300, "charge amount matches");
  assert(chargeReceipt.balance_after_cents === 1700, "balance decreases after charge");
  assert(wallet.getBalance() === 1700, "wallet getBalance matches");
  assert(ReceiptSchema.safeParse(chargeReceipt).success, "charge receipt matches §10.5 Zod schema");
  assert(typeof chargeReceipt.stripe_ref === "string", "stripe_ref is present");

  // 3. Mock mode payout
  const payoutReceipt = await wallet.payout(500, "test revenue");
  assert(payoutReceipt.kind === "payout", "payout receipt kind is payout");
  assert(payoutReceipt.amount_cents === 500, "payout amount matches");
  assert(payoutReceipt.balance_after_cents === 2200, "balance increases after payout");
  assert(wallet.getBalance() === 2200, "wallet getBalance matches payout");
  assert(ReceiptSchema.safeParse(payoutReceipt).success, "payout receipt matches §10.5 Zod schema");

  // 4. Refund restores balance
  const refundReceipt = await wallet.refund(chargeReceipt.stripe_ref, "buyer remorse");
  assert(refundReceipt.kind === "refund", "refund receipt kind is refund");
  assert(refundReceipt.amount_cents === 300, "refund amount matches original charge");
  assert(refundReceipt.balance_after_cents === 2500, "balance restored after refund");
  assert(wallet.getBalance() === 2500, "wallet getBalance matches refund");
  assert(ReceiptSchema.safeParse(refundReceipt).success, "refund receipt matches §10.5 Zod schema");

  // 5. Over-cap charge throws PolicyError and never changes balance
  await wallet.charge(600, "build up spend");
  const balanceBeforeOver = wallet.getBalance();
  let threw = false;
  try {
    await wallet.charge(500, "over cap attempt"); // total 1100 > cap 1000
  } catch (e) {
    threw = true;
    assert(e instanceof PolicyError, "over-cap throws PolicyError");
    assert((e as PolicyError).decision.allowed === false, "decision.allowed is false");
  }
  assert(threw, "over-cap charge threw");
  assert(wallet.getBalance() === balanceBeforeOver, "balance unchanged on policy rejection");

  // 6. All generated receipts pass schema validation
  const mockReceipt = await wallet.charge(100, "valid after over-cap test");
  assert(ReceiptSchema.safeParse(mockReceipt).success, "subsequent charge receipt matches §10.5 schema");

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exitCode = 1;
});
