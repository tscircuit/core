import json,re
from pathlib import Path
for path in Path('../results').glob('*/attempts/matching/findings.json'):
    circuit=json.loads((path.parent/'circuit.json').read_text())
    by_id={value:row for row in circuit for key,value in row.items() if key==row['type']+'_id' and isinstance(value,str)}
    phases=[]
    for phase_path in sorted(path.parent.glob('phase-*-end.srj.json')):
        srj=json.loads(phase_path.read_text())
        phases.append((int(phase_path.name.split('-')[1]),{t['pcb_trace_id']for t in srj.get('traces',[])}))
    def stage(trace):
        return min((n for n,ids in phases if trace.get('pcb_trace_id')in ids),default=None)
    for finding in json.loads(path.read_text()).get('trace_overlap',[]):
        primary_id=finding.get('pcb_trace_id')
        primary=by_id.get(primary_id,{})
        error_id=finding.get('pcb_trace_error_id','')
        others=[row for key,row in by_id.items() if error_id in [f'overlap_{primary_id}_{key}',f'overlap_{key}_{primary_id}']]
        print('PHYSICAL_FINDING='+json.dumps({'primaryStage':stage(primary),'otherTypes':[r['type']for r in others],'otherStages':[stage(r)for r in others],'primaryWidthRange':sorted(set(p['width']for p in primary.get('route',[])if p['route_type']=='wire')),'viaParentExists':[r.get('pcb_trace_id')in by_id for r in others if r['type']=='pcb_via'],'selfShort':error_id.startswith('self_short_'),'accidentalContact':'accidental contact'in finding.get('message',''),'reportedGapMm':re.findall(r'gap: ([0-9.-]+)mm',finding.get('message',''))},separators=(',',':')))
