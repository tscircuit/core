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

  ibisModelLoadError?: Error

  get config() {
    return { componentName: "SignalIntegrity", zodProps: signalIntegrityProps }
  }

  onPropsChange(): void {
    this._markDirty("PcbSimulationRender")
  }

  doInitialPcbSimulationRender(): void {
    if (this.getInheritedProperty("analogSimulationDisabled")) return
    if (this._hasIncompleteAsyncEffectsInSubtreeForPhase("PcbSimulationRender"))
      return
    if (this.ibisModelLoadError) throw this.ibisModelLoadError
    const platformFetch = this.root!.platform?.platformFetch
    const unreadModelUrls = new Set(
      this.root!.db.simulation_ibis_model.list()
        .map((model) => model.ibis_model_asset.url)
        .filter((url) => !this.ibisModelInfoByUrl.has(url)),
    )
    if (unreadModelUrls.size && !platformFetch)
      throw new Error(
        "<signalintegrity> needs IBIS contents for validation; configure platformFetch to load the declared model assets.",
      )
    if (platformFetch && unreadModelUrls.size) {
      for (const url of unreadModelUrls) {
        this.ibisModelInfoByUrl.set(url, null)
        this._queueAsyncEffect("ReadSignalIntegrityIbisModel", async () => {
          try {
            const response = await platformFetch(url)
            if (!response.ok) throw new Error("IBIS asset request failed")
            this.ibisModelInfoByUrl.set(
              url,
              parseIbisModelInfo(await response.text()),
            )
          } catch {
            // Throw synchronously on the next render; async-effect errors alone
            // are logged by the renderer and do not reject renderUntilSettled.
            this.ibisModelLoadError = new Error(
              "<signalintegrity> could not load the declared IBIS contents for validation.",
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
