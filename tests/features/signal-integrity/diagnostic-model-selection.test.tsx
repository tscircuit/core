import { signalintegrity } from "lib/namespaced-elements"
import { expect } from "bun:test"
import { DiagnosticBoard, lvcModel } from "./fixtures/diagnostic-board"
import {
  getSiTestFixture,
  siTest as test,
} from "./fixtures/get-si-test-fixture"

test("endpoint selection diagnoses ambiguous, invalid and non-receiving IBIS models", async () => {
  for (const kind of ["ambiguous", "invalid", "role", "pdn"]) {
    const { circuit } = getSiTestFixture()
    circuit.add(
      <DiagnosticBoard missingModel={kind === "ambiguous" ? "TX" : undefined}>
        {kind === "ambiguous" && (
          <signalintegrity.ibismodel
            componentRef=".TX"
            {...lvcModel}
            ibisPinNameToModelName={{}}
          />
        )}
        {kind === "role" && <trace from=".TX > .Y" to=".RX > .Y" />}
        <signalintegrity.simulation
          bitRate="20Mbps"
          unrouted="ideal"
          pdn={kind === "pdn" ? "extracted" : "ideal"}
        >
          <signalintegrity.signal
            name="DATA"
            driverRef={
              kind === "invalid"
                ? { pin: ".TX > .Y", model: "LVC1G04_IN_33" }
                : ".TX > .Y"
            }
            receiverRef={kind === "role" ? ".RX > .Y" : ".RX > .A"}
          />
        </signalintegrity.simulation>
      </DiagnosticBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      {
        ambiguous:
          ".TX > .Y: choose an IBIS model from LVC1G04_OUT_18, LVC1G04_OUT_25, LVC1G04_OUT_33, LVC1G04_OUT_50.",
        invalid: ".TX > .Y: selected model is not valid for this pin.",
        role: ".RX > .Y: selected model does not support receiving on this pin.",
        pdn: 'pdn="extracted" is not implemented yet.',
      }[kind],
    )
  }
})
