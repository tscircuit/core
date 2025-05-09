import type { RootCircuit } from "lib/RootCircuit";
import type { SourceFailedToCreateComponentError } from "circuit-json";
import { PrimitiveComponent } from "../base-components/PrimitiveComponent/PrimitiveComponent";
import { z } from "zod";

class ErrorPlaceholderComponent extends PrimitiveComponent {
  constructor(props: any, error: any) {
    super(props);
    this._parsedProps = {
      ...props,
      error,
      type: props.type || "unknown",
      component_name: props.name,
      error_type: "source_failed_to_create_component_error",
      message: error instanceof Error ? error.message : String(error),
      pcb_center: {
        x: props.pcbX || 0,
        y: props.pcbY || 0,
      },
      schematic_center: {
        x: props.schX || 0,
        y: props.schY || 0,
      },
    };
  }

  get config() {
    return {
      componentName: "ErrorPlaceholder",
      zodProps: z.object({}).passthrough(),
    };
  }

  doInitialSourceRender() {
    if (this.root?.db) {
      this.root.db.source_failed_to_create_component_error.insert({
        component_name: this._parsedProps.component_name,
        message: this._parsedProps.message,
        pcb_center: this._parsedProps.pcb_center,
        schematic_center: this._parsedProps.schematic_center,
      });
    }

    return {
      componentType: this._parsedProps.type,
      errorMessage: this._parsedProps.message,
      errorType: "source_failed_to_create_component_error",
    };
  }
}

export function createErrorPlaceholderComponent(props: any, error: any) {
  return new ErrorPlaceholderComponent(props, error);
}