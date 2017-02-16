/**
 * Created by Johnson on 2/15/2017.
 */

var previewAreaLeft, previewAreaRight;

var glyphNodeDictionary ={};        /// Object that stores uuid of left and right glyphs

var activeVR = 'left';

var nodesSelected = [];
var visibleNodes =[];               // boolean array storing nodes visibility
var shortestPathEdges = [];

var pointedNodeIdx = -1;            // index of node under the mouse
var pointedObject;                  // node object under mouse
var root;                           // the index of the root node = start point of shortest path computation
var distanceArray;                  // contain the shortest path for current selected node (root)

var thresholdModality = true;
var enableEB = true;

var spt = false;                    // enabling shortest path
var click = true;

// callback on mouse moving, expected action: node beneath pointer are drawn bigger
function onDocumentMouseMove(model, event) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    event.preventDefault();
    var intersectedObject = getIntersectedObject(event);
    // var isLeft = event.clientX < window.innerWidth/2;
    var nodeIdx, regionName, nodeRegion;
    if ( intersectedObject ) {
        nodeIdx = glyphNodeDictionary[intersectedObject.object.uuid];
        regionName = model.getRegionNameByIndex(nodeIdx);
        nodeRegion = model.getRegionByNode(nodeIdx);
    }
    var nodeExistAndVisible = (intersectedObject && visibleNodes[nodeIdx] && model.isRegionActive(nodeRegion));
    // update node information label
    if ( nodeExistAndVisible ) {
        setNodeInfoPanel(regionName, nodeIdx);
    }

    if ( nodeExistAndVisible && (nodesSelected.indexOf(nodeIdx) == -1)) { // not selected
        // create a selected node (bigger) from the pointed node
        pointedObject = intersectedObject.object;
        previewAreaLeft.updateNodeGeometry(nodeIdx, createSelectedGeometryByObject(pointedObject));
        previewAreaRight.updateNodeGeometry(nodeIdx, createSelectedGeometryByObject(pointedObject));
        // console.log("Drawing edges from node ", nodeIdx);
        pointedNodeIdx = nodeIdx;
    } else {
        if(pointedObject){
            nodeIdx = glyphNodeDictionary[pointedObject.uuid];
            pointedNodeIdx = -1;
            if(nodeIdx == root) {
                console.log("Root creation");
                previewAreaLeft.updateNodeGeometry(nodeIdx, createRootGeometryByObject(pointedObject));
                previewAreaRight.updateNodeGeometry(nodeIdx, createRootGeometryByObject(pointedObject));
            }
            else {
                previewAreaLeft.updateNodeGeometry(nodeIdx, createNormalGeometryByObject(pointedObject));
                previewAreaRight.updateNodeGeometry(nodeIdx, createNormalGeometryByObject(pointedObject));
            }
            pointedObject = null;
        }
    }
}

// callback to interact with objects in scene with double click
// selected nodes are drawn bigger
function onDblClick(event) {
    event.preventDefault();

    var intersectedObject = getIntersectedObject(event);
    if(intersectedObject) {
        removeElementsFromEdgePanel();
        var nodeIndex = glyphNodeDictionary[intersectedObject.object.uuid];
        spt = true;
        drawAllShortestPath(nodeIndex);
    }
}

// callback to select a node on mouse click
function onClick(model, event) {

    event.preventDefault();
    var objectIntersected = getIntersectedObject(event);
    var isLeft = event.clientX < window.innerWidth/2;
    var nodeIndex;
    if ( objectIntersected ) {
        nodeIndex = glyphNodeDictionary[objectIntersected.object.uuid];
    }

    if (objectIntersected && visibleNodes[nodeIndex]) {
        if(!spt) {
            var el = nodesSelected.indexOf(nodeIndex);
            if (el == -1) {
                //if the node is not already selected -> draw edges and add in the nodesSelected Array
                var hemisphere = objectIntersected.object.userData['hemisphere'];
                previewAreaLeft.drawSelectedNode(nodeIndex, hemisphere);
                previewAreaRight.drawSelectedNode(nodeIndex, hemisphere);

                // draw edges in one two ways:
                if (thresholdModality) {
                    // 1) all edges from a given node
                    previewAreaLeft.drawEdgesGivenNode(nodeIndex);
                    previewAreaRight.drawEdgesGivenNode(nodeIndex);
                } else {
                    // 2) strongest n edges from the node
                    var n = model.getNumberOfEdges();
                    previewAreaLeft.drawTopNEdgesByNode(nodeIndex, n);
                    previewAreaRight.drawTopNEdgesByNode(nodeIndex, n);
                }

                pointedObject = null;
            } else {
                //if the node is already selected, remove edges and remove from the nodeSelected Array
                previewAreaLeft.updateNodeColor(nodeIndex, new THREE.Color(scaleColorGroup(model, model.getRegionByNode(nodeIndex), nodeIndex)));
                previewAreaRight.updateNodeColor(nodeIndex, new THREE.Color(scaleColorGroup(model, model.getRegionByNode(nodeIndex), nodeIndex)));
                previewAreaLeft.updateNodeGeometry(nodeIndex, createNormalGeometryByObject(objectIntersected.object));
                previewAreaRight.updateNodeGeometry(nodeIndex, createNormalGeometryByObject(objectIntersected.object));
                nodesSelected.splice(el, 1);
                removeEdgesGivenNodeFromScenes(nodeIndex);
            }
        } else {
            var glyphs = isLeft ? glyphsLeft:glyphsRight;
            // getShortestPathBetweenNodes(model, glyphs, root, nodeIndex);
        }
    }
    pointedNodeIdx = -1;
}

// callback on mouse press
function onMouseDown(model, event) {
    click = true;
    switch (event.button) {
        case 0: // left click
            onClick(model, event);
            break;
        case 2: // right click -> should be < 200 msec
            setTimeout(function () {click = false;}, 200);
            break;
    }
}

// callback on mouse release
function onMouseUp(event) {
    if(event.button == 2 && click){
        toggleFslMenu();
    }
}

function onKeyPress(event) {
    if (event.key === 's' || event.keyCode === 115) {
        activeVR = 'left';
        previewAreaLeft.activateVR(false);
        previewAreaRight.activateVR(false);
        setTimeout(function() { previewAreaLeft.activateVR(true); }, 500);
    }
    if (event.key === 'd' || event.keyCode === 100) {
        activeVR = 'right';
        previewAreaLeft.activateVR(false);
        previewAreaRight.activateVR(false);
        setTimeout(function() { previewAreaRight.activateVR(true); }, 500);
    }
    if (event.key === 'e' || event.keyCode === 101) {
        activeVR = 'none';
        previewAreaLeft.activateVR(false);
        previewAreaRight.activateVR(false);
    }
}

// init the canvas where we render the brain
initCanvas = function () {
    // remove start page buttons
    removeStartButton();
    removeUploadButtons();
    // add controls
    addOpacitySlider();
    addEdgeBundlingCheck();
    addModalityButton();
    addThresholdSlider();
    addGroupList();
    addGeometryRadioButtons(modelLeft, 'Left');
    addGeometryRadioButtons(modelRight, 'Right');

    // addSkyboxButton();
    addDimensionFactorSlider();
    // addFslRadioButton();
    // addSearchPanel();

    modelLeft.setRegionsActivated();
    modelRight.setRegionsActivated();

    createLegend(modelLeft);
    // create visualization
    previewAreaLeft = new PreviewArea(document.getElementById('canvasLeft'), modelLeft);
    previewAreaRight = new PreviewArea(document.getElementById('canvasRight'), modelRight);
    glyphNodeDictionary = {};
    // create left and right canvas
    previewAreaLeft.createCanvas();
    previewAreaLeft.setEventListeners(onDblClick, onMouseDown, onMouseUp, onDocumentMouseMove);
    previewAreaRight.createCanvas();
    previewAreaRight.setEventListeners(onDblClick, onMouseDown, onMouseUp, onDocumentMouseMove);
    // prepare Occulus rift
    if (vr > 0) {
        previewAreaLeft.initOculusRift();
        previewAreaRight.initOculusRift();
        window.addEventListener("keypress", onKeyPress, true);
    }
    visibleNodes = Array(modelLeft.getConnectionMatrixDimension()).fill(true);
    // draw connectomes and start animation
    drawAllRegions();
    $(window).resize(function(e){
        e.preventDefault();
        console.log("on resize event");
        previewAreaLeft.resizeScene();
        previewAreaRight.resizeScene();
    });
    animate();
};

// set the threshold for both models
setThreshold = function(value) {
    modelLeft.setThreshold(value);
    modelRight.setThreshold(value);
};

// enable edge bundling
enableEdgeBundling = function (enable) {
    if (enableEB == enable)
        return;

    enableEB = enable;

    modelLeft.computeEdgesForTopology(modelLeft.getActiveTopology());
    modelRight.computeEdgesForTopology(modelRight.getActiveTopology());

    previewAreaLeft.removeEdgesFromScene();
    previewAreaRight.removeEdgesFromScene();

    previewAreaLeft.drawConnections();
    previewAreaRight.drawConnections();
};

// updating scenes: redrawing glyphs and displayed edges
updateScenes = function() {
    console.log("Scene update");
    previewAreaLeft.updateScene();
    previewAreaRight.updateScene();
    createLegend(modelLeft);
};

// animate scenes and capture control inputs
animate = function () {
    if (vr == 0) {
        requestAnimationFrame(animate);
        previewAreaLeft.animate();
        previewAreaRight.animate();
    } else { // VR
        if (activeVR == 'left') {
            previewAreaLeft.requestAnimate(animate);
            previewAreaLeft.animateVR();
        } else if (activeVR == 'right') {
            previewAreaRight.requestAnimate(animate);
            previewAreaRight.animateVR();
        } else { // need to be recalled continuously in case user reactivate VR
            requestAnimationFrame(animate);
        }
    }
};

// draw the brain regions as glyphs (the edges)
drawAllRegions = function() {
    previewAreaLeft.drawRegions();
    previewAreaRight.drawRegions();
};

var updateOpacity = function (opacity) {
    previewAreaLeft.updateEdgeOpacity(opacity);
    previewAreaRight.updateEdgeOpacity(opacity);
};

removeEdgesGivenNodeFromScenes = function(nodeIndex) {
    previewAreaLeft.removeEdgesGivenNode(nodeIndex);
    previewAreaRight.removeEdgesGivenNode(nodeIndex);

    // setEdgesColor();
    // setEdgesColor();
};

// get intersected object beneath the mouse pointer
// detects which scene: left or right
// return undefined if no object was found
getIntersectedObject = function(event) {

    var isLeft = event.clientX < window.innerWidth/2;

    // mapping coordinates of the viewport to (-1,1), (1,1), (-1,-1), (1,-1)
    // TODO: there is a glitch for the right side
    var vector = new THREE.Vector3(
        ( event.clientX / window.innerWidth ) * 4 - (isLeft?1:3),
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5
    );

    return isLeft ? previewAreaLeft.getIntersectedObject(vector) : previewAreaRight.getIntersectedObject(vector);
};

// draw shortest path for the left and right scenes
drawAllShortestPath = function(nodeIndex) {
    drawShortestPathLeft(nodeIndex);
    drawShortestPathRight(nodeIndex);
    // setEdgesColor(displayedEdgesLeft);
    // setEdgesColor(displayedEdgesRight);
    updateScenes();
};
drawShortestPathLeft = function(nodeIndex) { drawShortestPath(modelLeft, glyphsLeft,  nodeIndex);};
drawShortestPathRight = function(nodeIndex) { drawShortestPath(modelRight, glyphsRight, nodeIndex);};

// draw shortest path for a specific node
drawShortestPath = function(model, glyphs, nodeIndex) {
    console.log("Draw Shortest Path");
    root = nodeIndex;

    var len = model.getConnectionMatrixDimension();
    var dist = getShortestPathDistances(model, nodeIndex);
    distanceArray = [];
    for(var i=0; i < model.getConnectionMatrixDimension(); i++){
        distanceArray[i] = dist[i];
    }
    model.setDistanceArray(distanceArray);

    if(!document.getElementById("distanceThresholdSlider")){
        addDistanceSlider(distanceArray);
    }

    shortestPathDistanceUI();

    nodesSelected = [];
    shortestPathEdges = [];

    // show only nodes with shortest paths distance less than a threshold
    for(i=0; i < len; i++){
        visibleNodes[i] = (dist[i] < model.getDistanceThreshold());
    }

    for(i=0; i < visibleNodes.length; i++){
        if(visibleNodes[i]){
            var prev = glyphs[previousMap[i]];
            if(prev) {
                var start = new THREE.Vector3(glyphs[i].position.x, glyphs[i].position.y, glyphs[i].position.z);
                var end = new THREE.Vector3(prev.position.x, prev.position.y, prev.position.z);
                shortestPathEdges[shortestPathEdges.length] = createLine(start, end, model.getConnectionMatrix()[i][previousMap[i]] );
            }
        }
    }
};

changeColorGroup = function (n) {
    modelLeft.setActiveGroup(parseInt(n));
    modelRight.setActiveGroup(parseInt(n));

    modelLeft.setRegionsActivated();
    modelRight.setRegionsActivated();
    setColorGroupScale();

    updateScenes();
};

redrawScene = function (side) {
    updateNeeded = true;
    switch(side) {
        case 'Left':
        case 'left':
            previewAreaLeft.updateScene();
            if(spt) {
                drawShortestPathLeft(root);
            }
            break;
        case 'Right':
        case 'right':
            previewAreaRight.updateScene();
            if(spt) {
                drawShortestPathRight(root);
            }
            break;
    }
};

// change the active geometry
changeActiveGeometry = function (model, side, type) {
    console.log("Change Active Geometry to: ", type);
    model.setActiveTopology(type);
    redrawScene(side);
};

// draw shortest path from root node up to a number of hops
drawShortestPathHops = function(model, glyphs, rootNode, hops){
    var hierarchy = getHierarchy(model, rootNode);

    shortestPathEdges = [];
    for(var i = 0; i < hierarchy.length; i++){
        if( i < hops + 1 ) {
            //Visible node branch
            for(var j=0; j < hierarchy[i].length; j++){
                visibleNodes[hierarchy[i][j]] = true;
                var prev = glyphs[previousMap[hierarchy[i][j]]];
                if(prev){
                    var start = new THREE.Vector3(  glyphs[hierarchy[i][j]].position.x,
                        glyphs[hierarchy[i][j]].position.y,
                        glyphs[hierarchy[i][j]].position.z);
                    var end = new THREE.Vector3(prev.position.x, prev.position.y, prev.position.z);
                    shortestPathEdges[shortestPathEdges.length] = createLine(start, end,
                        model.getConnectionMatrix()[hierarchy[i][j]][previousMap[hierarchy[i][j]]]);
                }
            }
        } else {
            for(var j=0; j < hierarchy[i].length; j++){
                visibleNodes[hierarchy[i][j]] = false;
            }
        }
    }

    shortestPathSliderHops();
    updateScenes();
};

// change the subject in a specific scene
changeSceneToSubject = function (subjectId, model, previewArea, side) {
    var fileNames = dataFiles[subjectId];
    removeGeometryButtons(side);
    model.clearModel();

    previewArea.clearScene();

    queue()
        .defer(loadSubjectNetwork, fileNames, model)
        .awaitAll(function () {
            queue()
            // PLACE depends on connection matrix
                .defer(loadSubjectTopology, fileNames, model)
                .awaitAll( function () {
                    console.log("Loading data done.");
                    model.createGroups();
                    addGeometryRadioButtons(model, side);
                    model.setRegionsActivated();
                    redrawScene(side);
                })
            ;
        });
};