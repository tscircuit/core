import { expect, test } from "bun:test";
import { getStraightLineTraceLengthViolations } from "lib/utils/autorouting/should-skip-autorouting-because-of-trace-length-violations";
import { RootCircuit } from "lib/RootCircuit";
import "lib/register-catalogue";
import "tests/fixtures/extend-expect-circuit-snapshot";

test("shared power paths do not inherit a capacitor's local decoupling limit", async () => {
	const circuit = new RootCircuit();
	circuit.add(
		<board width={40} height={16} routingDisabled schematicDisabled>
			<chip name="U1" pcbX={-10} footprint="soic8" />
			<capacitor
				name="C1"
				capacitance="100nF"
				footprint="0402"
				pcbX={-3}
				maxDecouplingTraceLength={1}
			/>
			<capacitor
				name="C2"
				capacitance="100nF"
				footprint="0402"
				pcbX={8}
				maxDecouplingTraceLength={1}
			/>
			<trace
				name="POWER_RAIL"
				path={["U1.pin8", "C1.pin1", "C2.pin1", "net.VCC"]}
			/>
			<trace
				name="GROUND_RAIL"
				path={["U1.pin4", "C1.pin2", "C2.pin2", "net.GND"]}
			/>
			<pcbnotetext
				text="Shared rail spans 20 mm; 1 mm capacitor limit is local"
				pcbY={6}
				fontSize={0.7}
			/>
		</board>,
	);
	await circuit.renderUntilSettled();
	for (const name of ["POWER_RAIL", "GROUND_RAIL"]) {
		expect(
			circuit.db.source_trace.getWhere({ name })?.max_length,
		).toBeUndefined();
	}
	const board = circuit.firstChild!;
	expect(
		getStraightLineTraceLengthViolations({
			component: board,
			subcircuit: board as any,
		}),
	).toEqual([]);
	expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
