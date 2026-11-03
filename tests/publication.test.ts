import test from "node:test";
import assert from "node:assert/strict";
import { prepareSonjapgoPreview } from "../src/adapters/sonjapgo.js";
import { landing, choiceStory } from "../src/examples.js";
test("existing publish adapter never pretends arbitrary sjg can be imported", () => {
  const plan = prepareSonjapgoPreview(landing);
  assert.equal(plan.ready, false);
  assert.equal(plan.sourceWorkId, landing.id);
  assert.ok(plan.issues.some((i) => i.feature === "sjg-import"));
  assert.equal(plan.artifact.id, landing.id);
});
test("choice logic is reported unsupported and artifact is retained", () => {
  const plan = prepareSonjapgoPreview(choiceStory);
  assert.ok(plan.issues.some((i) => i.feature === "sontool/choice"));
  assert.deepEqual(plan.artifact, choiceStory);
});
