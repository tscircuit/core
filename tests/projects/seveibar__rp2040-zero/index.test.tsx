import { test, expect } from "bun:test";
import { getTestFixture } from "../../fixtures/get-test-fixture.ts";
import Project from "./index";

test("seveibar__rp2040-zero matches snapshots", async () => {
  const { circuit } = getTestFixture();
  circuit.add(<Project />);

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
