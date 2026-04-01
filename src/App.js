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

/**
 * @typedef {Object} IterationRule
 * @property {string}  Name
 * @property {'F'|'S'|'R'|'X'|'Y'} Type
 * @property {number}  Priority
 * @property {string}  [Comparator]
 * @property {string}  [CohortLabel]
 * @property {'PERSON'|'TARGET'|'COHORT'} [AttributeLevel]
 * @property {string}  [AttributeName]
 * @property {string}  [AttributeTarget]
 * @property {string}  [Operator]
 * @property {string}  [CommsRouting]
 * @property {'Y'|'N'} [RuleStop]
 */

/**
 * @typedef {Object} RoutingAction
 * @property {string} ExternalRoutingCode
 * @property {string} ActionType
 * @property {string} ActionDescription
 */

/**
 * @typedef {Object} IterationCohort
 * @property {string} CohortLabel
 * @property {number} Priority
 * @property {string} [Virtual]
 */

/**
 * @typedef {Object} Iteration
 * @property {string}           ID
 * @property {string}           Name
 * @property {string}           IterationDate
 * @property {IterationRule[]}  IterationRules
 * @property {IterationCohort[]} IterationCohorts
 * @property {string}           [DefaultCommsRouting]
 * @property {string}           [DefaultNotEligibleRouting]
 * @property {string}           [DefaultNotActionableRouting]
 * @property {Object.<string, RoutingAction>} [ActionsMapper]
 */

/**
 * @typedef {Object} ConfigJson
 * @property {{ Iterations: Iteration[], DefaultCommsRouting: string }} [CampaignConfig]
 */

function App() {

    const [showDetail, setShowDetail] = useState(false);
    const [showPriority, setShowPriority] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [initialData, setInitialData] = useState({});
    const [iterationID, setIterationID] = useState({value:"0",label:""});
    const [nodeWidth, setNodeWidth] = useState(250);
    const [nodeHeight, setNodeHeight] = useState(200);

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

    const nodeWidthChangeHandler = (event) => {
        setNodeWidth(Number(event.target.value));
    };

    const nodeHeightChangeHandler = (event) => {
        setNodeHeight(Number(event.target.value));
    };

    const downloadHandler = (event) => {
        downloadDiagram(event, initialNodes, ruleHeight, ruleWidth, nodeWidth, nodeHeight);
    };

    const parsedData = parseConfigRules(initialData, iterationID, showDetail, showPriority, nodeWidth, nodeHeight, showDescription);
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
                <label>Node Width</label>
                <input type="range" min="150" max="500" value={nodeWidth} onChange={nodeWidthChangeHandler}/>
                <span>{nodeWidth}px</span>
                <label>Node Height</label>
                <input type="range" min="100" max="400" value={nodeHeight} onChange={nodeHeightChangeHandler}/>
                <span>{nodeHeight}px</span>
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

function downloadDiagram(event, initialData, ruleHeight, ruleWidth, nodeWidth, nodeHeight) {
    const largeWidth = Math.round(nodeWidth * 8 / 5);
    const imageWidth = (largeWidth * ruleWidth) + 300;
    const imageHeight = nodeHeight * ruleHeight;
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
function makeRoutingActionNode(id, x, y, label, width) {
    return {
        id,
        position: {x, y},
        data: {label},
        type: "markdown",
        targetPosition: Position.Top,
        style: {background: 'green', color: 'white', width: width + "px", whitespace: 'pre-wrap'},
    };
}

/**
 * @param {IterationRule} myRule
 * @param {boolean} showDetail
 * @param {boolean} showPriority
 * @param {boolean} showDescription
 * @param {number} rulePtr
 * @param {IterationRule} lastRule
 * @param {boolean} lastRule
 * @param {boolean} andRule
 */
function buildNodeLabel(myRule, showDetail, showPriority, showDescription, rulePtr, lastRule, andRule) {

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

/**
 * @param {string} CommsRouting
 * @param {Object.<string, RoutingAction>} routingMap
 * @param {boolean} showDetail
 */
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

/**
 * @param {ConfigJson} configJson
 * @param {{value: string, label: string}|string} iteration
 * @param {boolean} showDetail
 * @param {boolean} showPriority
 * @param {number} nodeWidth
 * @param {number} nodeHeight
 * @param {boolean} showDescription
 */
function parseConfigRules(configJson, iteration, showDetail, showPriority, nodeWidth, nodeHeight, showDescription) {

    const smallWidth = nodeWidth;
    const largeWidth = Math.round(nodeWidth * 8 / 5);
    const smallColPitch = smallWidth + 50;
    const largeColPitch = largeWidth + 50;

    const ruleSpace = nodeHeight;

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
        let routingPlan = "Unknown";

        if (routingType === "R" && configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting && configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting !== "") {
            routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting;
        } else if (routingType === "R" && configJson.CampaignConfig.DefaultCommsRouting && configJson.CampaignConfig.DefaultCommsRouting !== "") {
            routingPlan = configJson.CampaignConfig.DefaultCommsRouting;
        } else if ( routingType !== "R" ) {
            switch (routingType) {
                case 'X':
                    routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultNotEligibleRouting;
                    break;
                case 'Y':
                    routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultNotActionableRouting;
                    break;
                default:
                    routingPlan = "Unknown";
            }
        }

        if (routingPlan !== "Unknown" && routingPlan !== "") {
            const routingActions = buildRoutingLabel(routingPlan, routingMap, showDetail);
            if (routingActions) {
                nodeJSON.push(makeRoutingActionNode(
                    targetRPPrefix,
                    nodeXOffset + (largeColPitch * ruleColumn),
                    nodeYOffset + (ruleRow * ruleSpace) + ruleSpace,
                    routingActions,
                    largeWidth,
                ));
            }

            if (ruleColumn > 1) {
                edgeJSON.push(makeEdge(lastRuleId + "- " + targetRPPrefix, lastRuleId, targetRPPrefix, {
                    //label: "N",
                    sourceHandle: "RS",
                    targetHandle: "T"
                }));
            } else {
                edgeJSON.push(makeEdge( targetRPPrefix + 'Default', routingNodeType, targetRPPrefix, {
                    sourceHandle: "Y",
                    targetHandle: "T"
                }));
            }
        }
    }

    function addRoutingRules(selectedIterationPtr, routingRules, routingType, routingMap) {

        const routingNodeTypes = {R: 'Action', X: 'Filtered', Y: 'Suppressed'};

        const highestRuleClause = routingRules.length === 0 ? 1 : Math.max(...Object.values(routingRules.reduce((rules, rule) => {
            rules[rule.Priority] = (rules[rule.Priority] ?? 0) + 1;
            return rules;
        }, {})));

        const anchorNode = nodeJSON.find(node => node !== undefined && node.id === routingNodeTypes[routingType]);
        const nodeYOffset = anchorNode?.position.y + 25;
        const nodeXOffset = anchorNode?.position.x;

        const rulePrefix = 'RP_' + routingType + '_';
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
                position: {x: nodeXOffset + (largeColPitch * ruleColumn), y: nodeYOffset + (ruleRow * ruleSpace)},
                data: {label: nodeLabel},
                type: 'topdecision',
                style: {width: largeWidth + "px"},
            });

           if (rulePtr === 0) {
                edgeJSON.push(makeEdge(routingNodeTypes[routingType] + "_" + rulePrefix + myRule.Name, routingNodeTypes[routingType], ruleId, {
                    targetHandle: "TL",
                    sourceHandle: 'Y',
                    label: "N"
                }));
            }

            const routingActions = buildRoutingLabel(myRule.CommsRouting, routingMap, showDetail);

            if (!andRuleNext && routingActions) {

                nodeJSON.push(makeRoutingActionNode(
                    ruleId + myRule.Name,
                    nodeXOffset + (largeColPitch * ruleColumn),
                    nodeYOffset + (highestRuleClause * ruleSpace),
                    routingActions,
                    largeWidth,
                ));

                edgeJSON.push(makeEdge((rulePtr + 1).toString() + rulePrefix + myRule.Name, rulePrefix + (rulePtr + 1).toString(), rulePrefix + (rulePtr + 1) + myRule.Name, {
                    label: "Y",
                    sourceHandle: "B",
                    targetHandle: "T"
                }));

                if (nextRule.Type !== '?') {
                    edgeJSON.push(makeEdge(ruleId + myRule.Name, ruleId, rulePrefix + (rulePtr + 2).toString(), {
                        label: "N",
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

    function adjustFilterSuppressActionNodes(filterClausCount,suppressionClauseCount) {
        for (let nodePtr = 0; nodePtr < nodeJSON.length; nodePtr++) {
            if (nodeJSON[nodePtr].id === "Filtered") {
                if ( filterClausCount === 0) {
                    delete nodeJSON[nodePtr];
                } else {
                    nodeJSON[nodePtr].position.x = (maxColPtr * smallColPitch) + 500;
                    nodeJSON[nodePtr].position.y = filterClauseCount !== 1
                        ? (filterClauseCount * ruleSpace) / 2
                        : (2 * ruleSpace) / 2 + 40;
                }
            } else if (nodeJSON[nodePtr].id === "Suppressed")  {
                if ( suppressionClauseCount === 0) {
                    delete nodeJSON[nodePtr];
                 } else {
                    nodeJSON[nodePtr].position.x = (maxColPtr * smallColPitch) + 500;
                    nodeJSON[nodePtr].position.y = ((filterClauseCount * ruleSpace * 2) + (suppressionClauseCount * ruleSpace)) / 2;
                }
            } else if (nodeJSON[nodePtr].id === "Action") {
                nodeJSON[nodePtr].position.x = (maxColPtr * smallColPitch) + 500;
                nodeJSON[nodePtr].position.y = (filterClauseCount * ruleSpace) + (suppressionClauseCount * ruleSpace) + ruleSpace + 40;
            } else if (nodeJSON[nodePtr].id.startsWith("RP_")) {
                nodeJSON[nodePtr].position.x = (maxColPtr * smallColPitch) + 500;
            }
        }
    }

    function addInputCohorts(noRules) {
        for (let cohortPtr = 0; cohortPtr < myCohorts.length; cohortPtr++) {
            const virtual = myCohorts[cohortPtr].Virtual && "Yy".indexOf(myCohorts[cohortPtr].Virtual) > -1;
            nodeJSON.push({
                id: "CH_" + (cohortPtr + 1).toString(),
                position: {x: (smallColPitch * cohortPtr), y: 0},
                data: {
                    label: myCohorts[cohortPtr].CohortLabel + (showPriority ? " (" + myCohorts[cohortPtr].Priority.toString() + ")" : ""),
                    icon: virtual ? <VirtualCohortIcon/> : "",
                },
                type: "inputnode",
                sourcePosition: Position.Bottom,
                style: {width: smallWidth + "px", background: 'blue', color: 'white'},
            });
            edgeJSON.push(makeEdge("CH_" + (cohortPtr + 1).toString() + "-Start", "CH_" + (cohortPtr + 1).toString(), noRules ? "Action" : "1"));
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

        addInputCohorts(myFandSRules.length === 0);

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
                position: {x: (smallColPitch * colPtr), y: ruleYOffset + (ruleSpace * clausePtr)},
                data: {
                    label: nodeLabel,
                    icon: myRule.Type === "S" && nextRule.Priority !== myRule.Priority && myRule.RuleStop === "Y" ?
                        <RuleStopIcon/> : "",
                },
                type: andRule ? "decision" : "leftdecision",
                sourcePosition: Position.Bottom,
                style: {width: smallWidth + "px"},
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

        adjustFilterSuppressActionNodes(filterClauseCount,suppressionClauseCount);

        const [colsR] = addRoutingRules(iterationPtr, myRRules, 'R', myRoutingMap);
        const [colsX] = filterClauseCount > 0 ? addRoutingRules(iterationPtr, myXRules, 'X', myRoutingMap) : [0,1];
        const [colsY] = suppressionClauseCount > 0 ? addRoutingRules(iterationPtr, myYRules, 'Y', myRoutingMap) : [0,1];
        routingColMax = Math.max(colsR, colsX, colsY);

        // Add closing N to Action
        lastRulePtr = myFandSRules.length;
        do {
            lastRulePtr--;
            edgeJSON.push(makeEdge((lastRulePtr + 1).toString() + "- lastrule", (lastRulePtr + 1).toString(), 'Action', {label: "N"}));
        } while (lastRulePtr > -1 && (lastRulePtr === 0 || myFandSRules[lastRulePtr].Priority === myFandSRules[lastRulePtr - 1].Priority));

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