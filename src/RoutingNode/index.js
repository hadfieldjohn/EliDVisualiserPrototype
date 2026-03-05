import {Handle, Position} from "reactflow";

export default function RoutingNode({id, data}) {

    return (
        <div id={id}>
            <Handle type="target" id="TN" position={Position.Top}/>
            <div>
                <table>
                    <tbody>
                    {data.label.split('|').map(labelItem => (
                        <tr key={labelItem}><td>{labelItem}</td></tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}



