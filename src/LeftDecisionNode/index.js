import { Handle, NodeProps, Position} from "reactflow";

export default function LeftDecisionNode({id, data}) {

    return(
        <div>
            <Handle type="target" id="TN" position={Position.Top}/>
            <div>
               <label>{data.label}</label>
            </div>
            <Handle type="source" id="N" position={Position.Bottom}/>
            <Handle type="source" id="Y" position={Position.Right}/>

        </div>
    );
}



