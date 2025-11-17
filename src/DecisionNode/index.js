import { Handle, NodeProps, Position} from "reactflow";

export default function DecisionNode({id, data}) {

    return(
        <div>
            <div>
               <label>{data.label}</label>
            </div>
            <Handle type="source" id="N" position={Position.Bottom}/>
            <Handle type="source" id="Y" position={Position.Right}/>
            <Handle type="target" id="TY" position={Position.Left}/>

        </div>
    );
}



