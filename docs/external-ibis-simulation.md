# External IBIS simulation declarations

`ibismodel`, `analog.digitalstimulus`, and `analog.eyediagram` declare inputs for an external runner. They do not download models, install executables, or execute simulation during rendering. Existing transient simulations retain native execution when `executionMode` is omitted.

```tsx
import { analog } from "@tscircuit/core"

export const Example = () => (
  <board routingDisabled>
    <chip name="U1" footprint="soic4"
      pinLabels={{ pin1: "DATA", pin2: "VCC", pin3: "GND" }} />
    <ibismodel componentRef=".U1"
      source={{ file: "./models/driver.ibs" }} component="DRIVER"
      pinMap={{ "1": "DATA", "2": "VCC", "3": "GND" }}
      references={{ "1": { pullup: "VCC", pulldown: "GND" } }}
      corner="typical" packagePolicy="vendor" />
    <analog.transientsimulation name="switching" executionMode="external"
      spiceEngine="ngspice" duration="100ns" timePerStep="20ps"
      ibisPinStates={{ ".U1 > .DATA": { mode: "output", enabled: true } }} />
    <analog.digitalstimulus name="data" simulationRef=".switching"
      drives=".U1 > .DATA" unitInterval="2ns" startTime="0ns"
      initialState={0} pattern={{ type: "bits", bits: "010011", repeat: true }} />
    <voltageprobe name="data" connectsTo=".U1 > .DATA" referenceTo=".U1 > .GND" />
    <analog.eyediagram name="data-eye" simulationRef=".switching"
      probeRef=".data" unitInterval="2ns" timeOrigin="0ns"
      startTime="10ns" endTime="100ns" />
  </board>
)
```

This is a declaration example, not a complete board suitable for parasitic extraction. A local runner still needs routed geometry, board stackup, return-path and termination choices, compatible vendor buffers, and separately installed tools.

Selectors must identify one component, physical pin, experiment, or probe in the declaration's subcircuit. `pinMap` maps vendor pin numbers to the selected chip's port labels. Explicit reference roles use that chip's labels too. A model is shared across experiments; `ibisPinStates` belongs to each experiment so direction and output enable can change between runs. Aliases resolving to the same physical pin cannot assign multiple states. Traffic names and driven pins must be unique within an experiment.

Numeric times are milliseconds; unit strings such as `"2ns"` are normalized to milliseconds in Circuit JSON. A non-repeating pattern must cover the requested run; that and electrical/model compatibility are runner validation responsibilities. Eye gates default to the experiment's recording window, must stay inside it, and must contain at least two bit intervals. `timeOrigin` is explicit. An eye declaration is a measurement request, not a compliance verdict.

Remote sources require a SHA-256 digest of downloaded bytes. Archives name a member and may additionally pin its extracted bytes with `memberSha256`. Core writes the corresponding snake_case Circuit JSON fields. Local path resolution and hash checks belong to the runner; core does not read model files.

## Integration boundary

Core exports standard Circuit JSON IDs and associations. `execution_mode: "external"` prevents the built-in SPICE render phase from executing those experiments. An explicit CLI/local-runner command must validate the exported records, check installed tools, perform extraction and simulation, and write result records, CSVs, and the interactive HTML report. Those command/UI hooks are a separate change. No solver binaries or Python runtime are added here.
