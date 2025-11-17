import './App.css';
import ReactFlow, {MarkerType, MiniMap, Controls, Position, getRectOfNodes, getTransformForBounds} from "reactflow";
import DecisionNode from "./DecisionNode";
import {useState} from "react";
import Select from 'react-select';
import {toPng} from "html-to-image";
import LeftDecisionNode from "./LeftDecisionNode";
import TopDecisionNode from "./TopDecisionNode";
import RoutingNode from "./RoutingNode";

const nodeTypes = {decision: DecisionNode,leftdecision: LeftDecisionNode, topdecision: TopDecisionNode, routingnode: RoutingNode,};

function App() {

    const [showDetail, setShowDetail] = useState(false);
    const [showPriority, setShowPriority] = useState(false);
    const [initialData, setInitialData] = useState(JSON.parse("{}"));
    const [iterationID, setIterationID] = useState("");

    const changeHandler = (event) => {

        if (event.target.files.length > 0 && event.target.files[0].name.endsWith(".json")) {

            var fr = new FileReader();
            fr.readAsText(event.target.files[0]);
            fr.onload = function (event) {
                setInitialData(JSON.parse(event.target.result));
                setIterationID({value:"0",label:"Please choose an interation..."});
            }
        }
    };

    const detailChangeHandler = (event) => {
        setShowDetail(event.target.checked);
    };

    const priorityChangeHandler = (event) => {
        setShowPriority(event.target.checked);
    };

    const iterationChangeHandler = ( event) => {
        setIterationID(event);
        };

    const downloadHandler = (event) => {
      downloadDiagram(event,initialNodes,ruleHeight,ruleWidth);
    };

    var parsedData = parseConfigRules(initialData,iterationID,showDetail,showPriority);
    var initialNodes = parsedData.nodes;
    var ruleHeight = parsedData.ruleHeight;
    var ruleWidth = parsedData.ruleWidth;
    var initialEdges = parsedData.edges;
    var initialIterations = parsedData.iterations;
    var initialIterationID = parsedData.iterationOption;

    return (
        <div style={{width: "100vw", height: "100vh"}}>
            <div>
                <label>Select File</label>
                <input type="file" onChange={changeHandler}/>
                <label>Show Detail</label>
                <input type={"checkbox"} onChange={detailChangeHandler}/>
                <label>Show Priority</label>
                <input type={"checkbox"} onChange={priorityChangeHandler}/>
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
                <Controls></Controls>
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
function downloadDiagram(event,initialData,ruleHeight,ruleWidth) {

    const imageWidth = (400 * ruleWidth)+300;
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
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function buildNodeLabel(myRule, showDetail, showPriority, rulePtr, lastRule) {
    var nodeLabel = myRule.Name;
    if (showDetail) {

        var myComparatorValue = "";
        if (myRule.Comparator) {
            myComparatorValue = myRule.Comparator.substring(0, 30) + (myRule.Comparator.length > 29 ? "..." : "");
        }

        if (myRule.AttributeLevel === "PERSON") {
            nodeLabel = nodeLabel + "\n(" + myRule.AttributeName + " " + myRule.Operator + " " + myComparatorValue + ")";
        } else if (myRule.AttributeLevel === "TARGET") {
            nodeLabel = nodeLabel + "\n(" + myRule.AttributeTarget + " " + myRule.AttributeName + " " + myRule.Operator + " " + myComparatorValue + ")";
        } else if (myRule.AttributeLevel === "COHORT") {
            nodeLabel = nodeLabel + "\n(" + myRule.Operator + " " + myRule.Comparator.substring(0, 50) + ")";
        }

        if ( myRule.CohortLabel && myRule.CohortLabel !== "") {
            nodeLabel = nodeLabel + "\n[" + myRule.CohortLabel + "]";
        }
    }

    if (showPriority && (rulePtr === 0 || myRule.Priority !== lastRule.Priority)) {
        nodeLabel = "(" + myRule.Priority.toString() + ") " + nodeLabel;
    }
    return nodeLabel;
}

function buildRoutingLabel(CommsRouting, routingMap, showDetail ) {
    var routingActions = '';
    (CommsRouting + '|').split('|').forEach((rp) => {
        if (rp) {
           if ( routingMap && routingMap[rp] && showDetail) {
               routingActions += rp + ' (' + routingMap[rp].ExternalRoutingCode + '/' + routingMap[rp].ActionType + ')|';
            } else if (rp) {
               routingActions += rp + '|';
            }
        }
    })
    return routingActions;
}

function parseConfigRules(configJson,iteration,showDetail,showPriority) {

    const ruleSpace = 200;

    var nodeJSON = [
        {
            id: "Suppressed",
            position: {x: 600, y: ruleSpace*2},
            data: {label: "Not Actionable"},
            type: "decision",
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            className: "react-flow__node-bigball",
            style: {
                background: 'orange',
                color: 'white',
            }
        },
        {
            id: "Filtered",
            position: {x: 600, y: ruleSpace},
            data: {label: "Not Eligible"},
            type: "decision",
            targetPosition: Position.Left,
            className: "react-flow__node-bigball",
            style: {
                background: 'red',
                color: 'white',
            },
        },
        {
            id: "Action",
            position: {x: 600, y: ruleSpace*3},
            data: {label: "Actionable"},
            type: "decision",
            targetPosition: Position.Top,
            sourcePosition: Position.Right,
            className: "react-flow__node-bigbox",
            style: {
                background: 'green',
                color: 'white',
            },
        }];

    var edgeJSON = [{
        id: "0-1", source: "0", target: "1",
        markerEnd: {
            type: MarkerType.ArrowClosed,
        }
    }];

    var iterationArrray = [{value:"0",label:"Please select file",}];
    var iterationPtr = 0;

    function addDefaultRouting(selectedIterationPtr, routingType, routingNodeType, ruleColumn, ruleRow, lastRuleId, nodeXOffset, nodeYOffset, routingMap) {
        //Handle the default comms routing for the iteration
        var targetRPPrefix =  "DFRP_" + routingNodeType + "_";

        if (configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting && configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting !== "") {
            var routingPlan = "";
            switch (routingType) {
                case 'R' : routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultCommsRouting;
                break;
                case 'X' : routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultNotEligibleRouting;
                break;
                case 'Y' : routingPlan = configJson.CampaignConfig.Iterations[selectedIterationPtr].DefaultNotActionableRouting;
                break;
                default: routingPlan = "Unknown";
            }

            if (routingPlan && routingPlan !== '') {
                var routingActions = buildRoutingLabel(routingPlan, routingMap, showDetail);
                if (routingActions) {
                    nodeJSON.push({
                        id: targetRPPrefix,
                        position: {x: nodeXOffset + (450 * ruleColumn), y: nodeYOffset + (ruleRow * 200) + 200},
                        data: {label: routingActions},
                        type: "routingnode",
                        targetPosition: Position.Top,
                        style: {
                            background: 'green',
                            color: 'white',
                            width: "400px",
                            whitespace: 'pre-wrap'
                        }
                    });
                }
            }
        } else if ( routingType === 'R' ) {

            routingPlan = configJson.CampaignConfig.DefaultCommsRouting.replace(/\|/g, "\n");

            nodeJSON.push({
                id: targetRPPrefix,
                position: {x: -75, y: ruleYOffset + (ruleSpace * (clausePtr + 1))},
                data: {label: routingPlan},
                type: "output",
                targetPosition: Position.Top,
                style: {
                    background: 'green',
                    color: 'white',
                    width: "400px",
                    whitespace: 'pre-wrap'
                }
            });

        }

        if ( routingPlan !== '') {
            if (ruleColumn > 1) {
                edgeJSON.push({
                    id: lastRuleId + "- " + targetRPPrefix,
                    source: lastRuleId,
                    target: targetRPPrefix,
                    label: "else",
                    sourceHandle: "RS",
                    targetHandle: "T",
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                    }
                });
            } else {
                edgeJSON.push({
                    id: targetRPPrefix,
                    source: routingNodeType,
                    target: targetRPPrefix,
                    label: "",
                    sourceHandle: "Y",
                    targetHandle: "T",
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                    }
                });
            }

            if ( routingType === 'R' ) {
                let lastRulePtr = myFandSRules.length;
                do {
                    lastRulePtr--;
                    edgeJSON.push({
                        id: (lastRulePtr + 1).toString() + "- " + targetRPPrefix,
                        source: (lastRulePtr + 1).toString(),
                        target: 'Action',
                        label: "N",
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                        }
                    });
console.log(myFandSRules);
console.log(lastRulePtr);
                } while (lastRulePtr > -1 && (lastRulePtr === 0 || myFandSRules[lastRulePtr].Priority === myFandSRules[lastRulePtr - 1].Priority));
            }
        }

    }

    function addRoutingRules(selectedIterationPtr, routingRules, routingType, routingMap) {

        const nodeTypes = { R: 'Action', X: 'Filtered', 'Y': 'Suppressed' };

        const highestRuleClause = Math.max(...Object.values(routingRules.reduce( function (rules, rule) { rules[rule.Priority] = ++rules[rule.Priority] || 1; return rules; }, {} )));

        const anchorNode = nodeJSON.filter(function(node) { return node.id === nodeTypes[routingType];} )[0];
        const rulePrefix = 'RP_' + routingType + '_';
        const nodeYOffset = anchorNode.position.y + 25;
        const nodeXOffset = anchorNode.position.x;
        let ruleColumn = 1;
        var ruleRow = 0;
        var maxRuleRow = 0;
        var ruleId = '';

        for (let rulePtr = 0; rulePtr < routingRules.length; rulePtr++) {

            var myRule = routingRules[rulePtr];
            var nextRule = rulePtr+1 < routingRules.length ? routingRules[rulePtr + 1] : { Type: "?", Priority: -98};
            var lastRule = rulePtr > 0 ? routingRules[rulePtr - 1] : { Type: "?", Priority: -99};
            var nodeLabel = buildNodeLabel(myRule, showDetail, showPriority, rulePtr, lastRule);
            var andRuleNext = nextRule.Priority === myRule.Priority;

            maxRuleRow = ruleRow > maxRuleRow ? ruleRow : maxRuleRow;
            ruleId = rulePrefix + (rulePtr+1).toString();

            // Render a routing rule
            nodeJSON.push({
                id: ruleId,
                position: {x: nodeXOffset + (450 * ruleColumn), y: nodeYOffset + (ruleRow * 200)},
                data: {label: nodeLabel},
                type: 'topdecision',
                style: { width: "400px"}
            });

            // Set link from status node to the first rule
            if ( rulePtr === 0 ) {
                edgeJSON.push({
                    id: nodeTypes[routingType] + "_" + rulePrefix + myRule.Name,
                    source: nodeTypes[routingType],
                    target: ruleId,
                    targetHandle: "TL",
                    sourceHandle: 'Y',
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                    }
                });
            }

            var routingActions = buildRoutingLabel(myRule.CommsRouting, routingMap, showDetail);

            // If no and clauses to follow, then render the action plan
            if ( !andRuleNext && routingActions) {

                nodeJSON.push({
                    id: ruleId + myRule.Name,
                    position: {x: nodeXOffset + (450 * ruleColumn), y: nodeYOffset + (highestRuleClause * 200)},
                    data: {label: routingActions},
                    type: "routingnode",
                    targetPosition: Position.Top,
                    style: {
                        background: 'green',
                        color: 'white',
                        width: "400px",
                        whitespace: 'pre-wrap'
                    }
                });

                // Connect the non-and rule to the routing plan
               edgeJSON.push({
                    id: (rulePtr+1).toString() + rulePrefix + myRule.Name,
                    source: rulePrefix + (rulePtr+1).toString(),
                    target: rulePrefix + (rulePtr+1) + myRule.Name,
                    label: "Then",
                    sourceHandle: "B",
                    targetHandle: "T",
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                    }
                });

               //Connect the non-and rule to the next routing rule if there is one
               if ( nextRule.Type !== '?' ) {
                   edgeJSON.push({
                       id: ruleId + myRule.Name,
                       source: ruleId,
                       target: rulePrefix + (rulePtr+2).toString(),
                       label: "No",
                       sourceHandle: "RS",
                       targetHandle: "TL",
                       markerEnd: {
                           type: MarkerType.ArrowClosed,
                       }
                   });
               }

                ruleRow = 0;
                ruleColumn++;

            } else {

                edgeJSON.push({
                    id: (rulePtr).toString() + rulePrefix + myRule.Name,
                    source: rulePrefix + (rulePtr+1).toString(),
                    target: rulePrefix + (rulePtr+2).toString(),
                    label: "And",
                    sourceHandle: "B",
                    targetHandle: "T",
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                    }
                });
                ruleRow++;
            }

        }

        addDefaultRouting(iterationPtr,routingType,nodeTypes[routingType],ruleColumn,maxRuleRow,ruleId,nodeXOffset,nodeYOffset,routingMap);

        return [ ruleColumn, maxRuleRow+1 ];

    }

    function adjustFilterSuppressActionNodes() {
        //Adjust Filtered/Suppress Columns
        for (let nodePtr = 0; nodePtr < nodeJSON.length; nodePtr++) {
            if (nodeJSON[nodePtr].id === "Filtered") {
                nodeJSON[nodePtr].position.x = (maxColPtr * 300) + 500;
                if ( filterClauseCount !== 1 ) {
                    nodeJSON[nodePtr].position.y = (filterClauseCount * ruleSpace) / 2;
                } else {
                    nodeJSON[nodePtr].position.y = (2 * ruleSpace) / 2 + 40;
                }
            }

            if (nodeJSON[nodePtr].id === "Suppressed") {
                nodeJSON[nodePtr].position.x = (maxColPtr * 300) + 500;
                nodeJSON[nodePtr].position.y = ((filterClauseCount * ruleSpace * 2) + (suppressionClauseCount * ruleSpace)) / 2;
            }

            if (nodeJSON[nodePtr].id === "Action") {
                nodeJSON[nodePtr].position.x = (maxColPtr * 300) + 500;
                nodeJSON[nodePtr].position.y = ((filterClauseCount * ruleSpace) + (suppressionClauseCount * ruleSpace) + ruleSpace + 40);
            }

            if (nodeJSON[nodePtr].id.substring(0, 3) === "RP_") {
                nodeJSON[nodePtr].position.x = (maxColPtr * 300) + 500;
            }
        }
    }

    function addInputCohorts() {

        // Render cohorts
        for (let cohortPtr = 0; cohortPtr < myCohorts.length; cohortPtr++) {
            nodeJSON.push({
                id: "CH_" + (cohortPtr + 1).toString(),
                position: {x: (300 * cohortPtr), y: 0},
                data: {label: myCohorts[cohortPtr].CohortLabel + (showPriority ? " (" + myCohorts[cohortPtr].Priority.toString() + ")" : "")},
                type: "input",
                sourcePosition: Position.Bottom,
                style: {
                    width: "250px",
                    background: 'blue',
                    color: 'white',
                }
            });
            edgeJSON.push({
                id: "CH_" + (cohortPtr + 1).toString() + "-Start",
                source: "CH_" + (cohortPtr + 1).toString(),
                target: "1",
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                }
            });
            maxCohortPtr++;
        }
    }

    if ( configJson.hasOwnProperty("CampaignConfig") ) {

        //Extract iterations if more than one
        iterationArrray = configJson.CampaignConfig.Iterations.map(buildLabel);

        if ( iteration.value !== "" && iteration.value !== "0") {
            iterationPtr = configJson.CampaignConfig.Iterations.findIndex(p => p.ID === iteration.value);
        }

        var myFandSRules = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationRules,'Priority').filter(function (rl) { return ['F','S'].includes(rl.Type)});
        var myRRules = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationRules,'Priority').filter(function (rl) { return rl.Type === 'R'});
        var myXRules = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationRules,'Priority').filter(function (rl) { return rl.Type === 'X'});
        var myYRules = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationRules,'Priority').filter(function (rl) { return rl.Type === 'Y'});
        var myRoutingMap = configJson.CampaignConfig.Iterations[iterationPtr].ActionsMapper;

        var myCohorts = sortByKey(configJson.CampaignConfig.Iterations[iterationPtr].IterationCohorts,'Priority');
        var clausePtr = 0;
        var filterClauseCount = 0;
        var suppressionClauseCount = 0;
        var colPtr = 0;
        var andRule= false;
        var maxColPtr = 0;
        var maxCohortPtr = 0;
        var ruleYOffset = 100;
        var routingColMax;

        addInputCohorts();

        for (let rulePtr = 0; rulePtr < myFandSRules.length; rulePtr++) {

            var myRule = myFandSRules[rulePtr];

            var nodeLabel = buildNodeLabel(myRule, showDetail, showPriority, rulePtr, lastRule);

            if (rulePtr === 0 || myRule.Type !== lastRule.Type || myRule.Priority !== lastRule.Priority) {

                // Tie up loose ends from ands by adding N's
                if (andRule) {
                    for ( var nPtr = colPtr; nPtr > 0; nPtr--) {
                        edgeJSON.push({
                            id: (rulePtr-nPtr).toString() + "-" + (rulePtr + 1).toString(),
                            source: (rulePtr-nPtr).toString(),
                            target: (rulePtr + 1).toString(),
                            label: "N",
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                            }
                        });
                    }
                }

                colPtr = 0;
                clausePtr++;
                andRule = false;

                if ( myRule.Type === "S") suppressionClauseCount++;
                if ( myRule.Type === "F") filterClauseCount++;


            } else if (myRule.Type === lastRule.Type && myRule.Priority === lastRule.Priority) {
                colPtr++;
                andRule = true;
            }

            nodeJSON.push({
                id: (rulePtr+1).toString(),
                position: {x: (300 * colPtr), y: ruleYOffset + (ruleSpace * (clausePtr))},
                data: {label: nodeLabel},
                type: andRule ? "decision" : "leftdecision",
                sourcePosition: Position.Bottom,
                style: { width: "250px"}
            });


            // Connections are from last node (rulePtr) to this (rulePtr + 1)
            if (rulePtr > 0) {

                if (lastRule.Type === "F" && !andRule) {
                    edgeJSON.push({
                        id: (rulePtr).toString() + "-Filtered",
                        source: (rulePtr).toString(),
                        target: "Filtered",
                        label: "Y",
                        sourceHandle: "Y",
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                        }
                    });
                }

                if (lastRule.Type === "S" && !andRule) {
                    edgeJSON.push({
                        id: (rulePtr).toString() + "-Suppressed",
                        source: (rulePtr).toString(),
                        target: "Suppressed",
                        label: "Y",
                        sourceHandle: "Y",
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                        }
                    });
                }

                //Not the last rule
                if (rulePtr < myFandSRules.length) {
                    if (andRule) {
                        edgeJSON.push({
                            id: (rulePtr).toString() + "-" + (rulePtr + 1).toString(),
                            source: (rulePtr).toString(),
                            target: (rulePtr + 1).toString(),
                            label: "And",
                            sourceHandle: "Y",
                            targetHandle: "TY",
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                            }
                        });
                    } else {
                    edgeJSON.push({
                        id: (rulePtr).toString() + "-" + (rulePtr + 1).toString(),
                        source: (rulePtr).toString(),
                        target: (rulePtr + 1).toString(),
                        label: "N",
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                        }
                    });
                    }
                }
            }

            var lastRule = myRule;
            var lastRulePtr = rulePtr;
            if (colPtr > maxColPtr) maxColPtr = colPtr;
        }

        // Tidy up a dangling filter or suppression
        if (lastRule.Type === "F") {
            edgeJSON.push({
                id: (lastRulePtr).toString() + "-Filtered",
                source: (lastRulePtr).toString(),
                target: "Filtered",
                label: "Y",
                sourceHandle: "Y",
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                }
            });
        }

        if (lastRule.Type === "S") {
            edgeJSON.push({
                id: (lastRulePtr+1).toString() + "-Suppressed",
                source: (lastRulePtr+1).toString(),
                target: "Suppressed",
                label: "Y",
                sourceHandle: "Y",
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                }
            });
        }

        adjustFilterSuppressActionNodes();

        const [colsR, rowsR] = addRoutingRules(iterationPtr,myRRules,'R',myRoutingMap);
        const [colsX, rowsX] = addRoutingRules(iterationPtr,myXRules,'X',myRoutingMap);
        const [colsY, rowsY] = addRoutingRules(iterationPtr,myYRules,'Y',myRoutingMap);
        routingColMax = Math.max(colsR,colsX,colsY);
    }

    return {nodes: nodeJSON,
            edges:edgeJSON,
            iterations:iterationArrray,
            iterationOption:iterationArrray[iterationPtr],
            ruleHeight:(clausePtr+1),
            ruleWidth:((maxCohortPtr>(maxColPtr + routingColMax)?maxCohortPtr:maxColPtr + routingColMax + 3)+1)};
}

function buildLabel(iteration)
{
    return {"label": iteration.Name, "value": iteration.ID}
}
export default App;
