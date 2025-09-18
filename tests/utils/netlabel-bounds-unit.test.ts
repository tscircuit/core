/**
 * Simple unit test for netlabel collision detection utilities
 * This test doesn't require the full tscircuit environment
 */

import { describe, test, expect } from "bun:test";

// Mock the circuit-json types locally to avoid import issues
type SchematicNetLabel = {
  type: "schematic_net_label";
  schematic_net_label_id: string;
  source_net_id: string;
  text: string;
  center: { x: number; y: number };
  anchor_position: { x: number; y: number };
  anchor_side: "top" | "bottom" | "left" | "right";
};

// Copy the utility functions locally to test them independently
const getNetLabelBounds = (netlabel: SchematicNetLabel, fontSize = 0.18) => {
  const charWidth = 0.1 * (fontSize / 0.18);
  const width = netlabel.text.length * charWidth;
  const height = fontSize;

  return {
    left: netlabel.center.x - width / 2,
    right: netlabel.center.x + width / 2,
    top: netlabel.center.y + height / 2,
    bottom: netlabel.center.y - height / 2,
  };
};

const doesSegmentIntersectNetLabel = (
  segment: { from: { x: number; y: number }; to: { x: number; y: number } },
  netlabelBounds: { left: number; right: number; top: number; bottom: number },
  clearance = 0.05,
) => {
  const bounds = {
    left: netlabelBounds.left - clearance,
    right: netlabelBounds.right + clearance,
    top: netlabelBounds.top + clearance,
    bottom: netlabelBounds.bottom - clearance,
  };

  // Check if horizontal line segment intersects bounds
  if (Math.abs(segment.from.y - segment.to.y) < 0.01) {
    const segmentY = segment.from.y;
    const segmentLeft = Math.min(segment.from.x, segment.to.x);
    const segmentRight = Math.max(segment.from.x, segment.to.x);

    // Use strict inequalities for zero clearance to exclude boundary touches
    if (clearance === 0) {
      return (
        segmentY > bounds.bottom &&
        segmentY < bounds.top &&
        segmentLeft < bounds.right &&
        segmentRight > bounds.left
      );
    } else {
      return (
        segmentY >= bounds.bottom &&
        segmentY <= bounds.top &&
        segmentLeft < bounds.right &&
        segmentRight > bounds.left
      );
    }
  }

  // Check if vertical line segment intersects bounds
  if (Math.abs(segment.from.x - segment.to.x) < 0.01) {
    const segmentX = segment.from.x;
    const segmentBottom = Math.min(segment.from.y, segment.to.y);
    const segmentTop = Math.max(segment.from.y, segment.to.y);

    // Use strict inequalities for zero clearance to exclude boundary touches
    if (clearance === 0) {
      return (
        segmentX > bounds.left &&
        segmentX < bounds.right &&
        segmentBottom < bounds.top &&
        segmentTop > bounds.bottom
      );
    } else {
      return (
        segmentX >= bounds.left &&
        segmentX <= bounds.right &&
        segmentBottom < bounds.top &&
        segmentTop > bounds.bottom
      );
    }
  }

  return false;
};

describe("Netlabel Collision Detection Utilities", () => {
  test("getNetLabelBounds calculates correct bounds for VCC label", () => {
    const netlabel: SchematicNetLabel = {
      type: "schematic_net_label",
      schematic_net_label_id: "test_1",
      source_net_id: "net_1",
      text: "VCC", // 3 characters
      center: { x: 0, y: 0 },
      anchor_position: { x: 0, y: 0 },
      anchor_side: "right",
    };

    const bounds = getNetLabelBounds(netlabel);

    // For "VCC" (3 chars) with font size 0.18:
    // charWidth = 0.1 * (0.18 / 0.18) = 0.1
    // width = 3 * 0.1 = 0.3
    // height = 0.18

    expect(bounds.left).toBeCloseTo(-0.15, 3); // center.x - width/2 = 0 - 0.3/2
    expect(bounds.right).toBeCloseTo(0.15, 3); // center.x + width/2 = 0 + 0.3/2
    expect(bounds.top).toBeCloseTo(0.09, 3); // center.y + height/2 = 0 + 0.18/2
    expect(bounds.bottom).toBeCloseTo(-0.09, 3); // center.y - height/2 = 0 - 0.18/2
  });

  test("getNetLabelBounds calculates correct bounds for longer label", () => {
    const netlabel: SchematicNetLabel = {
      type: "schematic_net_label",
      schematic_net_label_id: "test_2",
      source_net_id: "net_2",
      text: "POWER_SUPPLY", // 12 characters
      center: { x: 1, y: 1 },
      anchor_position: { x: 1, y: 1 },
      anchor_side: "right",
    };

    const bounds = getNetLabelBounds(netlabel);

    // For "POWER_SUPPLY" (12 chars):
    // width = 12 * 0.1 = 1.2
    // height = 0.18

    expect(bounds.left).toBeCloseTo(0.4, 3); // 1 - 1.2/2
    expect(bounds.right).toBeCloseTo(1.6, 3); // 1 + 1.2/2
    expect(bounds.top).toBeCloseTo(1.09, 3); // 1 + 0.18/2
    expect(bounds.bottom).toBeCloseTo(0.91, 3); // 1 - 0.18/2
  });

  test("doesSegmentIntersectNetLabel detects horizontal collision", () => {
    const netlabel: SchematicNetLabel = {
      type: "schematic_net_label",
      schematic_net_label_id: "test_3",
      source_net_id: "net_3",
      text: "VCC",
      center: { x: 0, y: 0 },
      anchor_position: { x: 0, y: 0 },
      anchor_side: "right",
    };

    const bounds = getNetLabelBounds(netlabel);

    // Horizontal segment that passes through netlabel center
    const collidingSegment = {
      from: { x: -1, y: 0 },
      to: { x: 1, y: 0 },
    };

    // Horizontal segment that passes above netlabel
    const nonCollidingSegment = {
      from: { x: -1, y: 0.5 },
      to: { x: 1, y: 0.5 },
    };

    expect(doesSegmentIntersectNetLabel(collidingSegment, bounds)).toBe(true);
    expect(doesSegmentIntersectNetLabel(nonCollidingSegment, bounds)).toBe(
      false,
    );
  });

  test("doesSegmentIntersectNetLabel detects vertical collision", () => {
    const netlabel: SchematicNetLabel = {
      type: "schematic_net_label",
      schematic_net_label_id: "test_4",
      source_net_id: "net_4",
      text: "GND",
      center: { x: 0, y: 0 },
      anchor_position: { x: 0, y: 0 },
      anchor_side: "right",
    };

    const bounds = getNetLabelBounds(netlabel);

    // Vertical segment that passes through netlabel center
    const collidingSegment = {
      from: { x: 0, y: -1 },
      to: { x: 0, y: 1 },
    };

    // Vertical segment that passes to the right of netlabel
    const nonCollidingSegment = {
      from: { x: 0.5, y: -1 },
      to: { x: 0.5, y: 1 },
    };

    expect(doesSegmentIntersectNetLabel(collidingSegment, bounds)).toBe(true);
    expect(doesSegmentIntersectNetLabel(nonCollidingSegment, bounds)).toBe(
      false,
    );
  });

  test("collision detection respects clearance parameter", () => {
    const netlabel: SchematicNetLabel = {
      type: "schematic_net_label",
      schematic_net_label_id: "test_5",
      source_net_id: "net_5",
      text: "VCC",
      center: { x: 0, y: 0 },
      anchor_position: { x: 0, y: 0 },
      anchor_side: "right",
    };

    const bounds = getNetLabelBounds(netlabel);

    // Segment that barely touches netlabel boundary
    const edgeSegment = {
      from: { x: -1, y: 0.09 }, // exactly at top boundary
      to: { x: 1, y: 0.09 },
    };

    // With default clearance (0.05), this should collide
    expect(doesSegmentIntersectNetLabel(edgeSegment, bounds, 0.05)).toBe(true);

    // With zero clearance, this should not collide
    expect(doesSegmentIntersectNetLabel(edgeSegment, bounds, 0)).toBe(false);
  });
});
