import { Handle, Position} from "reactflow";

export default function LeftDecisionNode({id, data}) {

    return(
        <div id={id}>
            <Handle type="target" id="TN" position={Position.Top}/>
            {data.icon && <div className="icon">{data.icon}</div>}
            <div>
               <label>{data.label}</label>
            </div>
            <Handle type="source" id="N" position={Position.Bottom}/>
            <Handle type="source" id="Y" position={Position.Right}/>

        </div>
    );
}



