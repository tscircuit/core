# Autorouting threads

Set the local routing worker count in the circuit's platform configuration:

```tsx
import { Circuit } from "@tscircuit/core"

const circuit = new Circuit({
  platform: { autorouterThreads: 4 },
})
circuit.add(<board width="20mm" height="20mm">{/* components */}</board>)
await circuit.renderUntilSettled()
```

Counts above one enable worker-backed `solveAsync` for the default local
Pipeline9 autorouter on Node and Bun. Bun workers require version 1.4.2 or newer.
The count must be a positive safe integer. Omission and `1` keep the existing
stepped routing path. Browsers run inline, and cloud routing and other routing
algorithms retain their existing behavior.

`TscircuitAutorouter.solveSync()` remains synchronous and runs inline, including
when a worker count is configured. It cannot run while async routing is active.
Stopping async routing disposes its worker pool and suppresses late events;
completion and error events are emitted only after worker cleanup.
