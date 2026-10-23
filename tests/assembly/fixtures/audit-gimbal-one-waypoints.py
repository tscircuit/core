"""Optional FreeCAD audit of emitted native cables against the original BReps.

Run with FreeCAD's Python: audit-gimbal-one-waypoints.py original.FCStd routed.circuit.json.
Coordinates are circuit-world mm: +X right, +Y top, +Z above. This checks the
neutral pose, conservative 2.6 mm wire-bundle capsules and PH3 housing boxes.
It does not qualify motor lead exits, moving cables, bend radius or manufacture.
"""
import gzip
import hashlib
import itertools
import json
from pathlib import Path
import sys
import FreeCAD as App
import Part

cad_file, circuit_file = map(Path, sys.argv[1:3])
mesh_file = Path(__file__).with_name("gimbal-one-mechanical.json.gz")
names = {p["name"] for p in json.loads(gzip.decompress(mesh_file.read_bytes()))}
doc = App.openDocument(str(cad_file))
shapes = {o.Name: o.Shape for o in doc.Objects if o.Name in names and hasattr(o, "Shape")}
cables = [c for c in json.loads(circuit_file.read_text()) if c["type"] == "cad_cable"]
assert len(shapes) == 221 and len(cables) == 3
assert all(c["cableprinter_string"] == "jst_ph_pins3" for c in cables)


def point(p):
    return App.Vector(p["x"], p["y"], p["z"])


def nearby(a, b, margin):
    return all(getattr(a, axis + "Max") + margin >= getattr(b, axis + "Min")
               and getattr(a, axis + "Min") - margin <= getattr(b, axis + "Max")
               for axis in "XYZ")


edges = {c["name"]: [Part.makeLine(point(a), point(b))
                    for a, b in zip(c["path"], c["path"][1:])] for c in cables}
wire_hits, housing_hits, bundle_hits, closest = [], [], [], []
checks = 0
for cable in cables:
    minimum = None
    for segment, edge in enumerate(edges[cable["name"]]):
        for name, shape in shapes.items():
            if not nearby(edge.BoundBox, shape.BoundBox, 5):
                continue
            checks += 1
            gap = edge.distToShape(shape)[0] - 2.6
            result = dict(cable=cable["name"], part=name, segment=segment,
                          clearance_mm=round(gap, 4))
            if minimum is None or gap < minimum["clearance_mm"]:
                minimum = result
            if gap < -0.001:
                wire_hits.append(result)
    closest.append(minimum)
    for side, endpoint, tangent in [("from", 0, 1), ("to", -1, -2)]:
        # These are actual emitted exits and pin-1 frames, not authored routes.
        exit = point(cable["path"][endpoint])
        normal = (point(cable["path"][tangent]) - exit).normalize()
        mating = exit - normal * 6.85
        x_axis = (mating - point(cable[side + "_connector_pin1_position"])).normalize()
        y_axis = normal.cross(x_axis)
        transform = App.Matrix()
        for column, vector in enumerate([x_axis, y_axis, normal, mating], start=1):
            for row, value in enumerate([vector.x, vector.y, vector.z], start=1):
                setattr(transform, f"A{row}{column}", value)
        body = Part.makeBox(7.8, 4.5, 6.85, App.Vector(-3.9, -2.25, 0))
        body.transformShape(transform)
        for name, shape in shapes.items():
            if not nearby(body.BoundBox, shape.BoundBox, 0):
                continue
            volume = body.common(shape).Volume
            if volume > 0.001:
                housing_hits.append(dict(cable=cable["name"], side=side, part=name,
                                         intersection_mm3=round(volume, 4)))

bundle_minimum = float("inf")
for a, b in itertools.combinations(cables, 2):
    for ea in edges[a["name"]]:
        for eb in edges[b["name"]]:
            if not nearby(ea.BoundBox, eb.BoundBox, 20):
                continue
            gap = ea.distToShape(eb)[0] - 5.2
            bundle_minimum = min(bundle_minimum, gap)
            if gap < -0.001:
                bundle_hits.append(dict(a=a["name"], b=b["name"], clearance_mm=round(gap, 4)))

report = dict(
    scope="New emitted native cad_cable paths, neutral pose, 2.6 mm capsules and PH3 housing boxes",
    source_sha256=hashlib.sha256(cad_file.read_bytes()).hexdigest(),
    circuit_sha256=hashlib.sha256(circuit_file.read_bytes()).hexdigest(),
    mechanical_fixture_sha256=hashlib.sha256(mesh_file.read_bytes()).hexdigest(),
    parts=len(shapes), cables=len(cables), checked_segment_part_pairs=checks,
    minimum_rigid_clearances=closest,
    minimum_bundle_to_bundle_clearance_mm=round(bundle_minimum, 4),
    wire_interferences=wire_hits, housing_interferences=housing_hits,
    bundle_interferences=bundle_hits,
)
print(json.dumps(report, indent=2))
assert not wire_hits and not housing_hits and not bundle_hits, "Native cable clearance failed"
