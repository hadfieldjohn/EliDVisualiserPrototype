import { Handle, NodeProps, Position} from "reactflow";

export default function InputNode({id, data}) {

    return(
        <div>
            <div>
                <label>
                    {data.icon && <div className="icon">{data.icon}{data.label}</div>}
                    {!data.icon && <div className="label">{data.label}</div>}
                </label>
            </div>
            <Handle type="source" id="N" position={Position.Bottom}/>
        </div>
    );
}