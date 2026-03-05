import './App.css';
import ReactFlow, {MarkerType, MiniMap, Controls, Position, getRectOfNodes, getTransformForBounds} from "reactflow";
import DecisionNode from "./DecisionNode";
import MarkDownNode from "./MarkDownNode";
import {useState} from "react";
import Select from 'react-select';
import {toPng} from "html-to-image";
import LeftDecisionNode from "./LeftDecisionNode";
import TopDecisionNode from "./TopDecisionNode";
import RoutingNode from "./RoutingNode";
import RuleStopIcon from "./icons/RuleStopIcon.tsx";
import VirtualCohortIcon from "./icons/VirtualCohortIcon.tsx";
import InputNode from "./InputNode";

const nodeTypes = {
    markdown: MarkDownNode,
    decision: DecisionNode,
    leftdecision: LeftDecisionNode,
    topdecision: TopDecisionNode,
    routingnode: RoutingNode,
    inputnode: InputNode
};

function App() {

    const [showDetail, setShowDetail] = useState(false);
    const [showPriority, setShowPriority] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [initialData, setInitialData] = useState({});
    const [iterationID, setIterationID] = useState("");

    const changeHandler = (event) => {
        if (event.target.files.length > 0 && event.target.files[0].name.endsWith(".json")) {
            const fr = new FileReader();
            fr.readAsText(event.target.files[0]);
            fr.onload = function (event) {
                setInitialData(JSON.parse(event.target.result));
                setIterationID({value: "0", label: "Please choose an iteration..."});
            };
        }
    };

    const detailChangeHandler = (event) => {
        setShowDetail(event.target.checked);
    };

    const priorityChangeHandler = (event) => {
        setShowPriority(event.target.checked);
    };

    const descriptionChangeHandler = (event) => {
        setShowDescription(event.target.checked);
    };

    const iterationChangeHandler = (event) => {
        setIterationID(event);
    };

    const downloadHandler = (event) => {
        downloadDiagram(event, initialNodes, ruleHeight, ruleWidth);
    };

    const parsedData = parseConfigRules(initialData, iterationID, showDetail, showPriority, showDescription);
    const initialNodes = parsedData.nodes;
    const ruleHeight = parsedData.ruleHeight;
    const ruleWidth = parsedData.ruleWidth;
    const initialEdges = parsedData.edges;
    const initialIterations = parsedData.iterations;
    const initialIterationID = parsedData.iterationOption;

    return (
        <div style={{width: "100vw", height: "100vh"}}>
            <div>
                <label>Select File</label>
                <input type="file" onChange={changeHandler}/>
                <label>Show Detail</label>
                <input type={"checkbox"} onChange={detailChangeHandler}/>
                <label>Show Priority</label>
                <input type={"checkbox"} onChange={priorityChangeHandler}/>
                <label>Show Description</label>
                <input type={"checkbox"} onChange={descriptionChangeHandler}/>
                <button type={"button"} onClick={downloadHandler}>Download PNG</button>
                <Select className="basic-single"
                        classNamePrefix="select"
                        isSearchable={true}
                        name="color"
                        options={initialIterations}
                        onChange={iterationChangeHandler}
                        value={initialIterationID}/>
            </div>
            <ReactFlow nodes={initialNodes} nodeTypes={nodeTypes} edges={initialEdges}>
                <MiniMap zoomable pannable/>
                <Controls/>
            </ReactFlow>
        </div>
    );
}

function downloadImage(dataUrl) {
    const a = document.createElement('a');
    a.setAttribute('download', 'vims_iteration.png');
    a.setAttribute('href', dataUrl);
    a.click();
}

function downloadDiagram(event, initialData, ruleHeight, ruleWidth) {
    const imageWidth = (400 * ruleWidth) + 300;
    const imageHeight = 200 * ruleHeight;
    const nodesBounds = getRectOfNodes(initialData);
    const transform = getTransformForBounds(nodesBounds, imageWidth, imageHeight, 0.05, 2);
    toPng(document.querySelector('.react-flow__viewport'), {
        backgroundColor: 'white',
        width: imageWidth,
        height: imageHeight,
        style: {
            width: imageWidth,
            height: imageHeight,
            transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        },
    }).then(downloadImage);
}

function sortByKey(array, key) {
    return array.sort((a, b) => {
        const x = a[key];
        const y = b[key];
        return x < y ? -1 : x > y ? 1 : 0;
    });
}

// Creates a ReactFlow edge with a standard closed arrow marker.
function makeEdge(id, source, target, {label = "", sourceHandle, targetHandle} = {}) {
    const edge = {id, source, target, label, markerEnd: {type: MarkerType.ArrowClosed}};
    if (sourceHandle !== undefined) edge.sourceHandle = sourceHandle;
    if (targetHandle !== undefined) edge.targetHandle = targetHandle;
    return edge;
}

// Creates the green collapsible markdown node used to display a routing action plan.
function makeRoutingActionNode(id, x, y, label) {
    return {
        id,
        position: {x, y},
        data: {label},
        type: "markdown",
        targetPosition: Position.Top,
        style: {background: 'green', color: 'white', width: "400px", whitespace: 'pre-wrap'},
    };
}

function buildNodeLabel(myRule, showDetail, showPriority, showDescription, rulePtr, lastRule, andRule) {

    console.log(myRule.Type, myRule, andRule);

    let nodeLabel = (andRule && showDescription ? "" : myRule.Name) + "\\";

    if (showDescription) {
        nodeLabel = nodeLabel + myRule.Description.substring(0, 100) + (myRule.Description.length > 100 ? "..." : "") + '\\';
    }

    if (showDetail) {
        let myComparatorValue = "";
        if (myRule.Comparator) {
            myComparatorValue = myRule.Comparator.substring(0, 30) + (myRule.Comparator.length > 29 ? "..." : "");
        }

        let myCohortLabel = "";
        const cohortLabelList = myRule.CohortLabel ? myRule.CohortLabel.split(',') : null;
        if (myRule.CohortLabel) {
            myCohortLabel = cohortLabelList.slice(0, 4).join('\n') + (cohortLabelList.length > 4 ? "(and more)" : "");
        }

        if (myRule.AttributeLevel === "PERSON") {
            nodeLabel += "\n(" + myRule.AttributeName + " " + myRule.Operator + " " + myComparatorValue + ")";
        } else if (myRule.AttributeLevel === "TARGET") {
            nodeLabel += "\n(" + myRule.AttributeTarget + " " + myRule.AttributeName + " " + myRule.Operator + " " + myComparatorValue + ")";
        } else if (myRule.AttributeLevel === "COHORT") {
            nodeLabel += "\n(" + myRule.Operator + " " + myRule.Comparator.substring(0, 50) + ")";
        }

        if (myCohortLabel !== "") {
            nodeLabel += "\n[" + myCohortLabel + "]";
        }
    }

    if (showPriority && (rulePtr === 0 || myRule.Priority !== lastRule.Priority)) {
        nodeLabel = "(" + myRule.Priority.toString() + ") " + nodeLabel;
    }
    return nodeLabel;
}

function buildRoutingLabel(CommsRouting, routingMap, showDetail) {
    if (!CommsRouting) return '';
    return (CommsRouting + '|').split('|')
        .filter(rp => rp)
        .map(rp => {
            if (routingMap && routingMap[rp] && showDetail) {
                return rp + ' (' + routingMap[rp].ExternalRoutingCode + '/' + routingMap[rp].ActionType + ')~' + routingMap[rp].ActionDescription + '|';
            }
            return rp + '~|';
        })
        .join('');
}

function parseConfigRules(configJson, iteration, showDetail, showPriority, showDescription) {

    const ruleSpace = 200;

    const nodeJSON = [
        {
            id: "Suppressed",
            position: {x: 600, y: ruleSpace * 2},
            data: {label: "Not Actionable"},
            type: "decision",
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            className: "react-flow__node-bigball",
            style: {background: 'orange', color: 'white'},
        },
        {
            id: "Filtered",
            position: {x: 600, y: ruleSpace},
            data: {label: "Not Eligible"},
            type: "decision",
            targetPosition: Position.Left,
            className: "react-flow__node-bigball",
            style: {background: 'red', color: 'white'},
        },
        {
            id: "Action",
            position: {x: 600, y: ruleSpace * 3},
            data: {label: "Actionable"},
            type: "decision",
            targetPosition: Position.Top,
            sourcePosition: Position.Right,
            className: "react-flow__node-bigbox",
            style: {background: 'green', color: 'white'},
        }];

    const edgeJSON = [makeEdge("0-1", "0", "1")];

    let iterationArray = [{value: "0", label: "Please select file"}];
    let iterationPtr = 0;

    // Shared state accessed by nested functions and the return statement.
    // Must be declared at function scope (not inside the if block) so nested
    // function closures can reach them regardless of block scoping.
    let myFandSRules = [];
    let myCohorts = [];
    let clausePtr = 0;
    let filterClauseCount = 0;
    let suppressionClauseCount = 0;
    let maxColPtr = 0;
    let maxCohortPtr = 0;
    let ruleYOffset = 100;
    let routingColMax = 0;

    function addDefaultRouting(selectedIterationPtr, routingType, routingNodeType, ruleColumn, ruleRow, lastRuleId, nodeXOffset, nodeYOffset, routingMap) {
        const targetRPPrefix = "DFRP_" + routingNodeType + "_";
        let routingPlan = null;

        if (configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting && configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting !== "") {
            routingPlan = "";
            switch (routingType) {
                case 'R':
                    routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting;
                    break;
                case 'X':
                    routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultNotEligibleRouting;
                    break;
                case 'Y':
                    routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultNotActionableRouting;
                    break;
                default:
                    routingPlan = "Unknown";
            }

            if (routingPlan && routingPlan !== '') {
                const routingActions = buildRoutingLabel(routingPlan, routingMap, showDetail);
                if (routingActions) {
                    nodeJSON.push(makeRoutingActionNode(
                        targetRPPrefix,
                        nodeXOffset + (450 * ruleColumn),
                        nodeYOffset + (ruleRow * 200) + 200,
                        routingActions,
                    ));
                }
            }
        } else if (routingType === 'R') {
            routingPlan = configJson.CampaignConfig.DefaultCommsRouting.replace(/\|/g, "\n");
            nodeJSON.push({
                id: targetRPPrefix,
                position: {x: -75, y: ruleYOffset + (ruleSpace * (clausePtr + 1))},
                data: {label: routingPlan},
                type: "output",
                targetPosition: Position.Top,
                style: {background: 'green', color: 'white', width: "400px", whitespace: 'pre-wrap'},
            });
        }

        if (routingPlan) {
            if (ruleColumn > 1) {
                edgeJSON.push(makeEdge(lastRuleId + "- " + targetRPPrefix, lastRuleId, targetRPPrefix, {
                    label: "else",
                    sourceHandle: "RS",
                    targetHandle: "T"
                }));
            } else {
                edgeJSON.push(makeEdge(targetRPPrefix, routingNodeType, targetRPPrefix, {
                    sourceHandle: "Y",
                    targetHandle: "T"
                }));
            }

            if (routingType === 'R') {
                let lastRulePtr = myFandSRules.length;
                do {
                    lastRulePtr--;
                    edgeJSON.push(makeEdge((lastRulePtr + 1).toString() + "- " + targetRPPrefix, (lastRulePtr + 1).toString(), 'Action', {label: "N"}));
                } while (lastRulePtr > -1 && (lastRulePtr === 0 || myFandSRules[lastRulePtr].Priority === myFandSRules[lastRulePtr - 1].Priority));
            }
        }
    }

    function addRoutingRules(selectedIterationPtr, routingRules, routingType, routingMap) {

        const routingNodeTypes = {R: 'Action', X: 'Filtered', Y: 'Suppressed'};

        const highestRuleClause = routingRules.length === 0 ? 1 : Math.max(...Object.values(routingRules.reduce((rules, rule) => {
            rules[rule.Priority] = (rules[rule.Priority] ?? 0) + 1;
            return rules;
        }, {})));

        const anchorNode = nodeJSON.find(node => node.id === routingNodeTypes[routingType]);
        const rulePrefix = 'RP_' + routingType + '_';
        const nodeYOffset = anchorNode.position.y + 25;
        const nodeXOffset = anchorNode.position.x;
        let ruleColumn = 1;
        let ruleRow = 0;
        let maxRuleRow = 0;
        let ruleId = '';

        for (let rulePtr = 0; rulePtr < routingRules.length; rulePtr++) {

            const myRule = routingRules[rulePtr];
            const nextRule = rulePtr + 1 < routingRules.length ? routingRules[rulePtr + 1] : {Type: "?", Priority: -98};
            const lastRule = rulePtr > 0 ? routingRules[rulePtr - 1] : {Type: "?", Priority: -99};
            const andRuleNext = nextRule.Priority === myRule.Priority;
            const andRule = lastRule.Priority === myRule.Priority;

            const nodeLabel = buildNodeLabel(myRule, showDetail, showPriority, showDescription, rulePtr, lastRule, andRule);


            maxRuleRow = ruleRow > maxRuleRow ? ruleRow : maxRuleRow;
            ruleId = rulePrefix + (rulePtr + 1).toString();

            nodeJSON.push({
                id: ruleId,
                position: {x: nodeXOffset + (450 * ruleColumn), y: nodeYOffset + (ruleRow * 200)},
                data: {label: nodeLabel},
                type: 'topdecision',
                style: {width: "400px"},
            });

            if (rulePtr === 0) {
                edgeJSON.push(makeEdge(routingNodeTypes[routingType] + "_" + rulePrefix + myRule.Name, routingNodeTypes[routingType], ruleId, {
                    targetHandle: "TL",
                    sourceHandle: 'Y'
                }));
            }

            const routingActions = buildRoutingLabel(myRule.CommsRouting, routingMap, showDetail);

            if (!andRuleNext && routingActions) {

                nodeJSON.push(makeRoutingActionNode(
                    ruleId + myRule.Name,
                    nodeXOffset + (450 * ruleColumn),
                    nodeYOffset + (highestRuleClause * 200),
                    routingActions,
                ));

                edgeJSON.push(makeEdge((rulePtr + 1).toString() + rulePrefix + myRule.Name, rulePrefix + (rulePtr + 1).toString(), rulePrefix + (rulePtr + 1) + myRule.Name, {
                    label: "Then",
                    sourceHandle: "B",
                    targetHandle: "T"
                }));

                if (nextRule.Type !== '?') {
                    edgeJSON.push(makeEdge(ruleId + myRule.Name, ruleId, rulePrefix + (rulePtr + 2).toString(), {
                        label: "No",
                        sourceHandle: "RS",
                        targetHandle: "TL"
                    }));
                }

                ruleRow = 0;
                ruleColumn++;

            } else {
                edgeJSON.push(makeEdge((rulePtr).toString() + rulePrefix + myRule.Name, rulePrefix + (rulePtr + 1).toString(), rulePrefix + (rulePtr + 2).toString(), {
                    label: "And",
                    sourceHandle: "B",
                    targetHandle: "T"
                }));
                ruleRow++;
            }
        }

        addDefaultRouting(iterationPtr, routingType, routingNodeTypes[routingType], ruleColumn, maxRuleRow, ruleId, nodeXOffset, nodeYOffset, routingMap);

        return [ruleColumn, maxRuleRow + 1];
    }

    function adjustFilterSuppressActionNodes() {
        for (let nodePtr = 0; nodePtr < nodeJSON.length; nodePtr++) {
            if (nodeJSON[nodePtr].id === "Filtered") {
                nodeJSON[nodePtr].position.x = (maxColPtr * 300) + 500;
                nodeJSON[nodePtr].position.y = filterClauseCount !== 1
                    ? (filterClauseCount * ruleSpace) / 2
                    : (2 * ruleSpace) / 2 + 40;
            }

            if (nodeJSON[nodePtr].id === "Suppressed") {
                nodeJSON[nodePtr].position.x = (maxColPtr * 300) + 500;
                nodeJSON[nodePtr].position.y = ((filterClauseCount * ruleSpace * 2) + (suppressionClauseCount * ruleSpace)) / 2;
            }

            if (nodeJSON[nodePtr].id === "Action") {
                nodeJSON[nodePtr].position.x = (maxColPtr * 300) + 500;
                nodeJSON[nodePtr].position.y = (filterClauseCount * ruleSpace) + (suppressionClauseCount * ruleSpace) + ruleSpace + 40;
            }

            if (nodeJSON[nodePtr].id.startsWith("RP_")) {
                nodeJSON[nodePtr].position.x = (maxColPtr * 300) + 500;
            }
        }
    }

    function addInputCohorts() {
        for (let cohortPtr = 0; cohortPtr < myCohorts.length; cohortPtr++) {
            const virtual = myCohorts[cohortPtr].Virtual && "Yy".indexOf(myCohorts[cohortPtr].Virtual) > -1;
            nodeJSON.push({
                id: "CH_" + (cohortPtr + 1).toString(),
                position: {x: (300 * cohortPtr), y: 0},
                data: {
                    label: myCohorts[cohortPtr].CohortLabel + (showPriority ? " (" + myCohorts[cohortPtr].Priority.toString() + ")" : ""),
                    icon: virtual ? <VirtualCohortIcon/> : "",
                },
                type: "inputnode",
                sourcePosition: Position.Bottom,
                style: {width: "250px", background: 'blue', color: 'white'},
            });
            edgeJSON.push(makeEdge("CH_" + (cohortPtr + 1).toString() + "-Start", "CH_" + (cohortPtr + 1).toString(), "1"));
            maxCohortPtr++;
        }
    }

    if (configJson.hasOwnProperty("CampaignConfig")) {

        iterationArray = configJson.CampaignConfig.Iterations.map(buildLabel);

        if (iteration.value !== "" && iteration.value !== "0") {
            iterationPtr = configJson.CampaignConfig.Iterations.findIndex(p => p.ID === iteration.value);
        }

        myFandSRules = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationRules, 'Priority').filter(rl => ['F', 'S'].includes(rl.Type));
        const myRRules = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationRules, 'Priority').filter(rl => rl.Type === 'R');
        const myXRules = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationRules, 'Priority').filter(rl => rl.Type === 'X');
        const myYRules = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationRules, 'Priority').filter(rl => rl.Type === 'Y');
        const myRoutingMap = configJson.CampaignConfig.Iterations[iterationPtr].ActionsMapper;

        myCohorts = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationCohorts, 'Priority');
        let colPtr = 0;
        let andRule = false;
        let lastRule = {Type: null, Priority: null};
        let lastRulePtr = 0;

        addInputCohorts();

        for (let rulePtr = 0; rulePtr < myFandSRules.length; rulePtr++) {

            const myRule = myFandSRules[rulePtr];
            const nextRule = myFandSRules[rulePtr + 1] ? myFandSRules[rulePtr + 1] : {Priority: -27};
            const nodeLabel = buildNodeLabel(myRule, showDetail, showPriority, showDescription, rulePtr, lastRule, rulePtr !== 0 && myRule.Priority === lastRule.Priority);

            if (rulePtr === 0 || myRule.Type !== lastRule.Type || myRule.Priority !== lastRule.Priority) {

                if (andRule) {
                    for (let nPtr = colPtr; nPtr > 0; nPtr--) {
                        edgeJSON.push(makeEdge((rulePtr - nPtr).toString() + "-" + (rulePtr + 1).toString(), (rulePtr - nPtr).toString(), (rulePtr + 1).toString(), {label: "N"}));
                    }
                }

                colPtr = 0;
                clausePtr++;
                andRule = false;

                if (myRule.Type === "S") suppressionClauseCount++;
                if (myRule.Type === "F") filterClauseCount++;

            } else if (myRule.Type === lastRule.Type && myRule.Priority === lastRule.Priority) {
                colPtr++;
                andRule = true;
            }

            nodeJSON.push({
                id: (rulePtr + 1).toString(),
                position: {x: (300 * colPtr), y: ruleYOffset + (ruleSpace * clausePtr)},
                data: {
                    label: nodeLabel,
                    icon: myRule.Type === "S" && nextRule.Priority !== myRule.Priority && myRule.RuleStop === "Y" ?
                        <RuleStopIcon/> : "",
                },
                type: andRule ? "decision" : "leftdecision",
                sourcePosition: Position.Bottom,
                style: {width: "250px"},
            });

            if (rulePtr > 0) {

                if (!andRule) {
                    edgeJSON.push(makeEdge((rulePtr).toString() + "-Suppressed", (rulePtr).toString(), lastRule.Type === "F" ? "Filtered" : "Suppressed", {
                        label: "Y",
                        sourceHandle: "Y"
                    }));
                }

                if (rulePtr < myFandSRules.length) {
                    if (andRule) {
                        edgeJSON.push(makeEdge((rulePtr).toString() + "-" + (rulePtr + 1).toString(), (rulePtr).toString(), (rulePtr + 1).toString(), {
                            label: "And",
                            sourceHandle: "Y",
                            targetHandle: "TY"
                        }));
                    } else {
                        edgeJSON.push(makeEdge((rulePtr).toString() + "-" + (rulePtr + 1).toString(), (rulePtr).toString(), (rulePtr + 1).toString(), {label: "N"}));
                    }
                }
            }

            lastRule = myRule;
            lastRulePtr = rulePtr;
            if (colPtr > maxColPtr) maxColPtr = colPtr;
        }

        if (lastRule && lastRule.Type === "F") {
            edgeJSON.push(makeEdge((lastRulePtr).toString() + "-Filtered", (lastRulePtr).toString(), "Filtered", {
                label: "Y",
                sourceHandle: "Y"
            }));
        }

        if (lastRule && lastRule.Type === "S") {
            edgeJSON.push(makeEdge((lastRulePtr + 1).toString() + "-Suppressed", (lastRulePtr + 1).toString(), "Suppressed", {
                label: "Y",
                sourceHandle: "Y"
            }));
        }

        adjustFilterSuppressActionNodes();

        const [colsR] = addRoutingRules(iterationPtr, myRRules, 'R', myRoutingMap);
        const [colsX] = addRoutingRules(iterationPtr, myXRules, 'X', myRoutingMap);
        const [colsY] = addRoutingRules(iterationPtr, myYRules, 'Y', myRoutingMap);
        routingColMax = Math.max(colsR, colsX, colsY);
    }

    return {
        nodes: nodeJSON,
        edges: edgeJSON,
        iterations: iterationArray,
        iterationOption: iterationArray[iterationPtr],
        ruleHeight: clausePtr + 1,
        ruleWidth: (maxCohortPtr > (maxColPtr + routingColMax) ? maxCohortPtr : maxColPtr + routingColMax + 3) + 1,
    };
}

function buildLabel(iteration) {
    return {label: iteration.Name + " (" + iteration.IterationDate + ")", value: iteration.ID};
}

export {sortByKey, buildNodeLabel, buildRoutingLabel, parseConfigRules};
export default App;