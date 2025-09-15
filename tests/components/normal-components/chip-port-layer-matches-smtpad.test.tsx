import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("chip pcb_port layer matches smtpad layer", () => {
  const { project } = getTestFixture();

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              layer="bottom"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
    </board>,
  );

  project.render();

  const smtpad = project.db.pcb_smtpad.list()[0];
  expect(smtpad.layer).toBe("bottom");

  const pcbPort = project.db.pcb_port.list()[0];
  expect(pcbPort.layers).toContain("bottom");

  const chip = project.selectOne("chip");
  expect(chip).not.toBeNull();
});
