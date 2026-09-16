# T113-S3 routed trace ownership fixture

`board.circuit.json.gz` is the unmodified Circuit JSON emitted by the real
91-component T113-S3 Linux board after Pipeline 9 completed. The two final MST
segments at the U4/U5 power-supervisor handoff have valid `connection_name`
values but no `source_trace_id`, which made core report five accidental
contacts and made `tsci check shorts` report four shorts between copper that is
actually in the same two electrical nets.

The fixture was captured before changing routed-trace attribution. Its exact
affected coordinates and route identifiers are retained so the regression is
not a reconstructed approximation.
