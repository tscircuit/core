import { expect, test } from "bun:test";
import { getStraightLineTraceLengthViolations } from "lib/utils/autorouting/should-skip-autorouting-because-of-trace-length-violations";
import { RootCircuit } from "lib/RootCircuit";
import "lib/register-catalogue";
import "tests/fixtures/extend-expect-circuit-snapshot";

test("an explicit shared-path length limit is retained and checked", async () => {
	const circuit = new RootCircuit();
	circuit.add(
		<board width={32} height={14} routingDisabled schematicDisabled>
			<capacitor
				name="C1"
				capacitance="100nF"
				footprint="0402"
				pcbX={-10}
				maxDecouplingTraceLength={1}
			/>
			<resistor name="R1" resistance="1k" footprint="0402" />
			<resistor name="R2" resistance="1k" footprint="0402" pcbX={10} />
			<trace
				name="LIMITED_RAIL"
				path={["C1.pin1", "R1.pin1", "R2.pin1"]}
				maxLength={8}
			/>
			<pcbnotetext
				text="Explicit 8 mm path limit still rejects a 20 mm span"
				pcbY={5}
				fontSize={0.6}
			/>
		</board>,
	);
	await circuit.renderUntilSettled();
	const sourceTrace = circuit.db.source_trace.getWhere({
		name: "LIMITED_RAIL",
	})!;
	expect(sourceTrace.max_length).toBe(8);
	const board = circuit.firstChild!;
	expect(
		getStraightLineTraceLengthViolations({
			component: board,
			subcircuit: board as any,
		}),
	).toMatchObject([
		{
			sourceTraceId: sourceTrace.source_trace_id,
			maximumTraceLength: 8,
			straightLineDistance: 20,
		},
	]);
	expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
