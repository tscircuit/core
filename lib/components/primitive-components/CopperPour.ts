import { copperPourProps, type CopperPourProps } from "@tscircuit/props";
import { PrimitiveComponent } from "../base-components/PrimitiveComponent";
import { z } from "zod";
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson";
import Flatten from "@flatten-js/core";
import type { Net } from "./Net";
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map";
import type { LayerRef } from "circuit-json";
import {
  generateApproximatingRects,
  type RotatedRect,
} from "lib/utils/obstacles/generateApproximatingRects";

export { type CopperPourProps };

export class CopperPour extends PrimitiveComponent<typeof copperPourProps> {
  isPcbPrimitive = true;

  get config() {
    return {
      componentName: "CopperPour",
      zodProps: copperPourProps,
    };
  }

  getPcbSize(): { width: number; height: number } {
    return { width: 0, height: 0 };
  }

  doInitialPcbCopperPourRender() {
    if (this.root?.pcbDisabled) return;
    this._queueAsyncEffect("PcbCopperPourRender", async () => {
      const { db } = this.root!;
      const { _parsedProps: props } = this;

      const net = this.getSubcircuit().selectOne(
        props.connectsTo,
      ) as Net | null;
      if (!net || !net.source_net_id) {
        this.renderError(`Net "${props.connectsTo}" not found for copper pour`);
        return;
      }

      const board = db.pcb_board.list()[0];
      if (!board) {
        this.renderError("No board found for copper pour");
        return;
      }

      let boardPolygon: Flatten.Polygon;
      if (board.outline && board.outline.length > 0) {
        boardPolygon = new Flatten.Polygon(
          board.outline.map((p) => Flatten.point(p.x, p.y)),
        );
      } else {
        boardPolygon = new Flatten.Polygon(
          new Flatten.Box(
            board.center.x - board.width / 2,
            board.center.y - board.height / 2,
            board.center.x + board.width / 2,
            board.center.y + board.height / 2,
          ).toPoints(),
        );
      }

      const connMap = getFullConnectivityMapFromCircuitJson(db.toArray());

      const obstaclesRaw = getObstaclesFromCircuitJson(
        db.toArray(),
        connMap,
      ).filter((o) => o.layers.includes(props.layer));

      // Add trace obstacles
      for (const pcb_trace of db.pcb_trace.list()) {
        if (!pcb_trace.route) continue;

        for (let i = 0; i < pcb_trace.route.length - 1; i++) {
          const p1 = pcb_trace.route[i];
          const p2 = pcb_trace.route[i + 1];

          if (p1.route_type !== "wire" || p2.route_type !== "wire") continue;
          if (p1.layer !== props.layer) continue;

          const segmentWidth = p1.width;
          if (segmentWidth === 0) continue;

          const segmentLength = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (segmentLength === 0) continue;

          const centerX = (p1.x + p2.x) / 2;
          const centerY = (p1.y + p2.y) / 2;
          const rotationDeg =
            (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;

          const rotatedRect: RotatedRect = {
            center: { x: centerX, y: centerY },
            width: segmentLength,
            height: segmentWidth,
            rotation: rotationDeg,
          };

          const approximatingRects = generateApproximatingRects(rotatedRect);

          for (const rect of approximatingRects) {
            obstaclesRaw.push({
              type: "rect",
              layers: [p1.layer] as LayerRef[],
              center: rect.center,
              width: rect.width,
              height: rect.height,
              connectedTo: pcb_trace.source_trace_id
                ? [pcb_trace.source_trace_id]
                : [],
              obstacle_type: "trace",
            } as any);
          }
        }
      }

      const rectObstaclesToSubtract: Flatten.Polygon[] = [];
      const circularObstacles: Array<{
        center: { x: number; y: number };
        radius: number;
      }> = [];

      const traceMargin = props.traceMargin ?? 0.2;
      const padMargin = props.padMargin ?? 0.2;

      for (const obs of obstaclesRaw as any[]) {
        const isOnNet = obs.connectedTo.some((id: string) =>
          connMap.areIdsConnected(id, net.source_net_id!),
        );

        if (isOnNet) {
          continue;
        }

        // For circular plated hole pads
        if (obs.type === "oval" && obs.width === obs.height) {
          const radius = obs.width / 2 + padMargin;
          circularObstacles.push({
            center: obs.center,
            radius: radius,
          });
          continue;
        }

        // For non-plated holes (which are board-wide obstacles)
        if (
          obs.type === "rect" &&
          obs.width === obs.height &&
          obs.connectedTo.length === 0
        ) {
          const radius = obs.width / 2; // No margin for holes
          circularObstacles.push({
            center: obs.center,
            radius: radius,
          });
          continue;
        }

        // For all other obstacles (rectangular pads, oval pads, traces)
        const margin = traceMargin;

        const b = new Flatten.Box(
          obs.center.x - obs.width / 2 - margin,
          obs.center.y - obs.height / 2 - margin,
          obs.center.x + obs.width / 2 + margin,
          obs.center.y + obs.height / 2 + margin,
        );
        rectObstaclesToSubtract.push(new Flatten.Polygon(b.toPoints()));
      }

      let pourPolygons: Flatten.Polygon | Flatten.Polygon[] = boardPolygon;
      if (rectObstaclesToSubtract.length > 0) {
        const obstacleUnion = rectObstaclesToSubtract.reduce((acc, p) =>
          Flatten.BooleanOperations.unify(acc, p),
        );
        if (obstacleUnion && !obstacleUnion.isEmpty()) {
          pourPolygons = Flatten.BooleanOperations.subtract(
            boardPolygon,
            obstacleUnion,
          );
        }
      }

      if (!Array.isArray(pourPolygons)) {
        pourPolygons = [pourPolygons];
      }

      for (const p of pourPolygons) {
        const islands = p.splitToIslands();

        for (const island of islands) {
          if (island.isEmpty()) continue;

          const faces = [...island.faces] as Flatten.Face[];
          const outer_face_ccw = faces.find(
            (f) => f.orientation() === Flatten.ORIENTATION.CCW,
          );
          const inner_faces_cw = faces.filter(
            (f) => f.orientation() === Flatten.ORIENTATION.CW,
          );

          if (!outer_face_ccw) continue;

          if (!db.pcb_copper_pour) {
            this.renderError(
              "db.pcb_copper_pour not found. The database schema may be outdated.",
            );
            return;
          }

          const faceToVertices = (face: Flatten.Face) =>
            face.edges.map((e) => {
              const pt: { x: number; y: number; bulge?: number } = {
                x: e.start.x,
                y: e.start.y,
              };
              if (e.isArc) {
                const bulge = Math.tan((e.shape as Flatten.Arc).sweep / 4);
                // Don't add bulge if it's negligible
                if (Math.abs(bulge) > 1e-9) {
                  pt.bulge = bulge;
                }
              }
              return pt;
            });

          // BRep requires outer ring to be CW and inner rings to be CCW.
          // Flatten-js provides outer face as CCW and inner faces as CW.
          // We need to reverse them.
          outer_face_ccw.reverse();
          const outer_ring_vertices = faceToVertices(outer_face_ccw);
          const inner_rings = inner_faces_cw.map((f) => {
            f.reverse();
            return { vertices: faceToVertices(f) };
          });

          // Add circular obstacles as inner rings if they are contained in the island
          for (const circle of circularObstacles) {
            const centerPoint = Flatten.point(circle.center.x, circle.center.y);
            const isContained = island.contains(centerPoint);

            if (isContained) {
              inner_rings.push({
                vertices: [
                  {
                    x: circle.center.x,
                    y: circle.center.y - circle.radius,
                    bulge: 1,
                  },
                  {
                    x: circle.center.x,
                    y: circle.center.y + circle.radius,
                    bulge: 1,
                  },
                ],
              });
            }
          }

          db.pcb_copper_pour.insert({
            shape: "brep",
            layer: props.layer,
            brep_shape: {
              outer_ring: { vertices: outer_ring_vertices },
              inner_rings,
            },
            source_net_id: net.source_net_id,
            subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
          } as any);
        }
      }
    });
  }
}
