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
    if ( nodeIdx === undefined)
        return;

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
            if ( nodeIdx === undefined)
                return;
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
function onMiddleClick(event) {
    event.preventDefault();

    var intersectedObject = getIntersectedObject(event);
    if(intersectedObject) {
        var nodeIndex = glyphNodeDictionary[intersectedObject.object.uuid];
        if (nodeIndex == undefined || nodeIndex < 0)
            return;
        if (root == nodeIndex) { // disable spt and reset nodes visibility
            spt = false;
            root = undefined;
            visibleNodes.fill(true);
        } else { // enable spt
            spt = true;
            // compute the shortest path for the two models
            previewAreaLeft.computeShortestPathForNode(nodeIndex);
            previewAreaRight.computeShortestPathForNode(nodeIndex);
        }
        updateScenes();
        enableShortestPathFilterButton(spt);
    }
}

// callback to select a node on mouse click
function onLeftClick(model, event) {

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
            // var glyphs = isLeft ? glyphsLeft:glyphsRight;
            // getShortestPathBetweenNodes(model, glyphs, root, nodeIndex);
        }
    }
    pointedNodeIdx = -1;
}

// callback on mouse press
function onMouseDown(event) {
    click = true;
    switch (event.button) {
        case 2: // right click -> should be < 200 msec
            setTimeout(function () {click = false;}, 200);
            break;
    }
}

// callback on mouse release
function onMouseUp(model, event) {

    switch (event.button) {
        case 0:
            onLeftClick(model, event);
            break;
        case 1:
            onMiddleClick(event);
            break;
        case 2:
            toggleFslMenu();
            break;
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

    addShortestPathFilterButton();
    addDistanceSlider();
    addShortestPathHopsSlider();
    enableShortestPathFilterButton(false);

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
    previewAreaLeft.setEventListeners(onMouseDown, onMouseUp, onDocumentMouseMove);
    previewAreaRight.createCanvas();
    previewAreaRight.setEventListeners(onMouseDown, onMouseUp, onDocumentMouseMove);
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
updateScenes = function () {
    console.log("Scene update");
    previewAreaLeft.updateScene();
    previewAreaRight.updateScene();
    createLegend(modelLeft);
};

redrawNodes = function () {
    previewAreaLeft.redrawNodes();
    previewAreaRight.redrawNodes();
};

redrawEdges = function () {
    previewAreaLeft.redrawEdges();
    previewAreaRight.redrawEdges();
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

updateOpacity = function (opacity) {
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
            break;
        case 'Right':
        case 'right':
            previewAreaRight.updateScene();
            break;
    }
};

// change the active geometry
changeActiveGeometry = function (model, side, type) {
    console.log("Change Active Geometry to: ", type);
    model.setActiveTopology(type);
    redrawScene(side);
};

// draw shortest path for the left and right scenes = prepare the edges and plot them
updateShortestPathEdges = function (side) {
    if (!spt)
        return;
    switch (side) {
        case ('left'):
            previewAreaLeft.updateShortestPathEdges();
            break;
        case ('right'):
            previewAreaRight.updateShortestPathEdges();
            break;
        case ('both'):
            previewAreaLeft.updateShortestPathEdges();
            previewAreaRight.updateShortestPathEdges();
            break;
    }
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