import { Handle, Position} from "reactflow";

export default function TopDecisionNode({id, data}) {
    const [name, description, ...detail] = data.label.split('\\');
    return(
        <div id={id}>
            <Handle type="target" id="T" position={Position.Top}/>
            <Handle type="target" id="R" position={Position.Right}/>
            <Handle type="target" id="TL" position={Position.Left}/>
            <div>
                {name && <div style={{fontWeight: 'bold'}}>{name}</div>}
                {description && <div style={{fontStyle: 'italic'}}>{description}</div>}
                {detail.length > 0 && <div style={{fontSize: '0.8em', opacity: 0.75, marginTop: '2px'}}>{detail.join('\\')}</div>}
            </div>
            <Handle type="source" id="B" position={Position.Bottom}/>
            <Handle type="source" id="L" position={Position.Left}/>
            <Handle type="source" id="RS" position={Position.Right}/>

        </div>
    );
}



