import { type Contestant, ContestantSchema } from "../lib/types";

export const contestants: Contestant[] = [
  { id: "agent-surface", name: "Surface (builder re-entered)", kind: "hermes_profile" },
  { id: "engine-bot", name: "Engine Bot", kind: "hermes_profile" },
  { id: "external-agent", name: "External Evaluator", kind: "external", endpoint: "https://eval.example.com/agent" },
];

contestants.forEach((c) => ContestantSchema.parse(c));
