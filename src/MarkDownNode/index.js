import {Handle, NodeProps, Position} from "reactflow";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Collapsible from 'react-collapsible';

export default function MarkDownNode({id, data}) {
    const markdown = '# Hi, *Pluto*!';

    return (
        <div>
            <Handle type="target" id="TN" position={Position.Top}/>
            <div>
                <table>
                    <tbody>
                    {data.label.split('|').map(labelItem => (
                        <tr key={labelItem}>
                            <td>
                                {labelItem ?
                                    <Collapsible trigger={">" + labelItem.split('~')[0]}>
                                        <Markdown remarkPlugins={[remarkGfm]}>{labelItem.split("~")[1]}</Markdown>
                                    </Collapsible> : null}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}