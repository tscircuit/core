import { signalIntegrityProps } from "@tscircuit/props"
import type { SimulationSignalIntegrity } from "circuit-json"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { SignalIntegrity_doInitialPcbSimulationRender } from "./SignalIntegrity_doInitialPcbSimulationRender"
import { parseIbisModelInfo } from "lib/utils/simulation/parse-ibis-model-info"

/** Declares a coupled SI run; solvers consume its Circuit JSON separately. */
export class SignalIntegrity extends PrimitiveComponent<
  typeof signalIntegrityProps
> {
  simulation_signal_integrity_id:
    | SimulationSignalIntegrity["simulation_signal_integrity_id"]
    | null = null
  ibisModelInfoByUrl = new Map<
    string,
    ReturnType<typeof parseIbisModelInfo> | null
  >()

  get config() {
    return { componentName: "SignalIntegrity", zodProps: signalIntegrityProps }
  }

  onPropsChange(): void {
    this._markDirty("PcbSimulationRender")
  }

  doInitialPcbSimulationRender(): void {
    if (this.getInheritedProperty("analogSimulationDisabled")) return
    // A host may make vendor files available through its existing file loader.
    // Without it the asset stays a reference, as with standalone <ibismodel>.
    const platformFetch = this.root!.platform?.platformFetch
    const unreadModels = this.root!.db.simulation_ibis_model.list().filter(
      (model) => !this.ibisModelInfoByUrl.has(model.ibis_model_asset.url),
    )
    if (platformFetch && unreadModels.length) {
      for (const model of unreadModels) {
        const url = model.ibis_model_asset.url
        this.ibisModelInfoByUrl.set(url, null)
        this._queueAsyncEffect("ReadSignalIntegrityIbisModel", async () => {
          try {
            const response = await platformFetch(url)
            if (response.ok)
              this.ibisModelInfoByUrl.set(
                url,
                parseIbisModelInfo(await response.text()),
              )
          } finally {
            this._markDirty("PcbSimulationRender")
          }
        })
      }
      return
    }
    SignalIntegrity_doInitialPcbSimulationRender(this)
  }

  updatePcbSimulationRender(): void {
    this.doInitialPcbSimulationRender()
  }

  removePcbSimulationRender(): void {
    if (!this.simulation_signal_integrity_id) return
    const { db } = this.root!
    for (const signal of db.simulation_signal.list({
      simulation_signal_integrity_id: this.simulation_signal_integrity_id,
    }))
      db.simulation_signal.delete(signal.simulation_signal_id)
    db.simulation_signal_integrity.delete(this.simulation_signal_integrity_id)
    this.simulation_signal_integrity_id = null
  }
}
