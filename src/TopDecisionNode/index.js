import { Handle, NodeProps, Position} from "reactflow";

export default function TopDecisionNode({id, data}) {

    return(
        <div>
            <Handle type="target" id="T" position={Position.Top}/>
            <Handle type="target" id="R" position={Position.Right}/>
            <Handle type="target" id="TL" position={Position.Left}/>
            <div>
               <label>{data.label}</label>
            </div>
            <Handle type="source" id="B" position={Position.Bottom}/>
            <Handle type="source" id="L" position={Position.Left}/>
            <Handle type="source" id="RS" position={Position.Right}/>

        </div>
    );
}



