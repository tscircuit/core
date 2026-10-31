import { expect, test } from "bun:test"
import { getSavedJunctionReviewSvg } from "tests/fixtures/get-saved-junction-review-svg"
import type { FanoutTracePath } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const wire = (x: number, y: number) => ({
  route_type: "wire" as const,
  x,
  y,
  layer: "top" as const,
  width: 0.2,
})

test("joining saved copper merges distinct trees without hiding a disconnected tree", async () => {
  for (const joinsOtherTree of [false, true]) {
    const paths: FanoutTracePath[] = [
      { connection: "A.1", route: [wire(-4, 0), wire(4, 0)] },
      { connection: "C.1", route: [wire(0, 3), wire(4, 3)] },
      {
        connection: "B.1",
        route: [wire(4, 0), wire(2, joinsOtherTree ? 3 : 0)],
      },
    ]
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={16} height={12}>
        {[
          { name: "A", x: -4, y: 0 },
          { name: "B", x: 4, y: 0 },
          { name: "C", x: 0, y: 3 },
          { name: "D", x: 4, y: 3 },
        ].map(({ name, x, y }) => (
          <chip
            key={name}
            name={name}
            pcbX={x}
            pcbY={y}
            pinLabels={{ pin1: "SIGNAL" }}
            footprint={
              <footprint>
                <smtpad
                  portHints={["1"]}
                  width={0.6}
                  height={0.6}
                  shape="rect"
                />
              </footprint>
            }
            connections={{ SIGNAL: "net.SIGNAL" }}
          />
        ))}
        <autoroutingphase pcbTracePaths={paths} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const messages = circuit.db.pcb_autorouting_error
      .list()
      .map((e) => e.message)
    await expect(
      getSavedJunctionReviewSvg(
        circuit.getCircuitJson(),
        paths,
        joinsOtherTree
          ? "JOIN TWO ROUTED TREES"
          : "SELF-JOIN LEAVES A TREE DISCONNECTED",
        [
          "All four pads share SIGNAL. A-B is the lower trunk; C-D is the upper trunk.",
          joinsOtherTree
            ? "The diagonal path from B joins the C-D trunk: one connected tree."
            : "The third path doubles back along A-B. C-D remains disconnected.",
        ],
        messages,
      ),
    ).toMatchSvgSnapshot(
      import.meta.path,
      `saved-junction-tree-${joinsOtherTree ? "merged" : "disconnected"}`,
    )
    if (joinsOtherTree) {
      expect(messages).toEqual([])
      expect(circuit.db.pcb_trace.list()).toHaveLength(3)
    } else {
      expect(messages.join("\n")).toContain(
        "must end at another connection endpoint",
      )
    }
  }
})
