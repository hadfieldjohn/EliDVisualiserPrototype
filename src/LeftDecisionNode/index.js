import { Handle, Position} from "reactflow";

export default function LeftDecisionNode({id, data}) {
    const [name, description, ...detail] = data.label.split('\\');

    return(
        <div id={id}>
            <Handle type="target" id="TN" position={Position.Top}/>
            {data.icon && <div className="icon">{data.icon}</div>}
            <div>
                <div style={{fontWeight: 'bold'}}>{name}</div>
                {description && <div style={{fontStyle: 'italic'}}>{description}</div>}
                {detail.length > 0 && <div style={{fontSize: '0.8em', opacity: 0.75, marginTop: '2px'}}>{detail.join('\\')}</div>}
            </div>
            <Handle type="source" id="N" position={Position.Bottom}/>
            <Handle type="source" id="Y" position={Position.Right}/>

        </div>
    );
}



