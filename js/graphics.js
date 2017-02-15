/**
 * Created by giorgioconte on 31/01/15.
 */

var cameraLeft, cameraRight;        // left and right cameras
var canvasLeft, canvasRight;        // left and right canvas
var rendererLeft, rendererRight;    // left and right renderers
var controlsLeft, controlsRight;    // left and right mouse controls
var sceneLeft, sceneRight;          // left and right scenes
var glyphsLeft, glyphsRight;        // left and right glyphs (spheres and cubes)

var glyphNodeDictionary ={};        /// Object that stores uuid of glyphsLeft and glyphsRight

var oculusControlLeft, oculusControlRight;
var effectLeft, effectRight;
var activeVR = 'left';
var controllerLeft, controllerRight;
var dimensionScale;


var nodesSelected = [];
var visibleNodes =[];               // boolean array storing nodes visibility
var displayedEdgesLeft = [],
    displayedEdgesRight = [];       // store displayed edges for left and right scenes
var shortestPathEdges = [];
var edgeOpacity = 1.0;              // edge opacity

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
        glyphsLeft[nodeIdx].geometry = createSelectedGeometryByObject(pointedObject);
        glyphsRight[nodeIdx].geometry = createSelectedGeometryByObject(pointedObject);
        // console.log("Drawing edges from node ", nodeIdx);
        pointedNodeIdx = nodeIdx;
    } else {
        if(pointedObject){
            nodeIdx = glyphNodeDictionary[pointedObject.uuid];
            pointedNodeIdx = -1;
            if(nodeIdx == root) {
                console.log("Root creation");
                glyphsLeft[nodeIdx].geometry = createRootGeometryByObject(pointedObject);
                glyphsRight[nodeIdx].geometry = createRootGeometryByObject(pointedObject);
            }
            else {
                glyphsLeft[nodeIdx].geometry = createNormalGeometryByObject(pointedObject);
                glyphsRight[nodeIdx].geometry = createNormalGeometryByObject(pointedObject);
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
    var glyphs = isLeft ? glyphsLeft:glyphsRight;
    var nodeIndex;
    if ( objectIntersected ) {
        nodeIndex = glyphNodeDictionary[objectIntersected.object.uuid];
    }

    if (objectIntersected && visibleNodes[nodeIndex]) {
        if(!spt) {
            var el = nodesSelected.indexOf(nodeIndex);
            if (el == -1) {
                //if the node is not already selected -> draw edges and add in the nodesSelected Array
                drawSelectedNode(nodeIndex, objectIntersected.object);

                // draw edges in one two ways:
                if (thresholdModality) {
                    // 1) all edges from a given node
                    drawEdgesGivenNode(modelLeft, glyphsLeft, sceneLeft, displayedEdgesLeft, nodeIndex);
                    drawEdgesGivenNode(modelRight, glyphsRight, sceneRight, displayedEdgesRight, nodeIndex);
                } else {
                    // 2) strongest n edges from the node
                    var n = model.getNumberOfEdges();
                    console.log("Drawing top " + n + " edges");
                    drawTopNEdgesByNode(modelLeft, glyphsLeft, sceneLeft, displayedEdgesLeft, nodeIndex, n);
                    drawTopNEdgesByNode(modelRight, glyphsRight, sceneRight, displayedEdgesRight, nodeIndex, n);
                }

                pointedObject = null;
            } else {
                //if the node is already selected, remove edges and remove from the nodeSelected Array
                glyphsLeft[nodeIndex].material.color = new THREE.Color(scaleColorGroup(model, model.getRegionByNode(nodeIndex), nodeIndex));
                glyphsRight[nodeIndex].material.color = new THREE.Color(scaleColorGroup(model, model.getRegionByNode(nodeIndex), nodeIndex));
                glyphsLeft[nodeIndex].geometry = createNormalGeometryByObject(objectIntersected.object);
                glyphsRight[nodeIndex].geometry = createNormalGeometryByObject(objectIntersected.object);
                nodesSelected.splice(el, 1);
                removeEdgesGivenNodeFromScenes(nodeIndex);
            }
        } else {
            getShortestPathBetweenNodes(model, glyphs, root, nodeIndex);
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
        effectLeft.exitPresent();
        effectRight.exitPresent();
        setTimeout(function() { effectLeft.requestPresent(); }, 500);
    }
    if (event.key === 'd' || event.keyCode === 100) {
        activeVR = 'right';
        effectLeft.exitPresent();
        effectRight.exitPresent();
        setTimeout(function() { effectRight.requestPresent(); }, 500);
    }
    if (event.key === 'e' || event.keyCode === 101) {
        activeVR = 'none';
        effectLeft.exitPresent();
        effectRight.exitPresent();
    }
}
/*
setPreviewArea = function (status) {
    if (activeVR == status)
        return;
    switch (status) {
        case ('left'):
            activeVR = 'left';
            effectLeft.exitPresent();
            effectRight.exitPresent();
            setTimeout(function() { effectLeft.requestPresent(); }, 500);
            // controllerLeft.standingMatrix = oculusControlLeft.getStandingMatrix();
            // controllerRight.standingMatrix = oculusControlLeft.getStandingMatrix();
            // sceneLeft.add(controllerLeft);
            // sceneLeft.add(controllerRight);
            break;
        case ('right'):
            activeVR = 'right';
            effectLeft.exitPresent();
            effectRight.exitPresent();
            setTimeout(function() { effectRight.requestPresent(); }, 500);
            // controllerLeft.standingMatrix = oculusControlRight.getStandingMatrix();
            // controllerRight.standingMatrix = oculusControlRight.getStandingMatrix();
            // sceneRight.add(controllerLeft);
            // sceneRight.add(controllerRight);
            break;
        default:
            activeVR = 'none';
            effectLeft.exitPresent();
            effectRight.exitPresent();
            break;
    }
};
*/
initOculusTouch = function () {
    controllerLeft = new THREE.ViveController( 0 );
    controllerRight = new THREE.ViveController( 1 );

    var loader = new THREE.OBJLoader();
    loader.setPath( 'js/external-libraries/vr/models/obj/vive-controller/' );
    loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

        var loader = new THREE.TextureLoader();
        loader.setPath( 'js/external-libraries/vr/models/obj/vive-controller/' );

        var controller = object.children[ 0 ];
        controller.material.map = loader.load( 'onepointfive_texture.png' );
        controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

        controllerLeft.add( object.clone() );
        controllerRight.add( object.clone() );
    } );
};

// initialize scene: init 3js scene, canvas, renderer and camera; add axis and light to the scene
initScene = function (model, scene, canvas, renderer, camera) {

    canvas.addEventListener('dblclick', onDblClick, true);
    canvas.addEventListener('mousedown', function(e) {onMouseDown(model,e);}, true);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', function(e){onDocumentMouseMove(model,e);} , true );

    renderer.setSize(canvas.clientWidth, window.innerHeight);
    canvas.appendChild(renderer.domElement);

    camera.position.z = 50;

    //Adding light
    scene.add( new THREE.HemisphereLight(0x606060, 0x080820, 1.5));
    scene.add( new THREE.AmbientLight(0x606060, 1.5));
    var light = new THREE.PointLight( 0xffffff, 1.0, 10000 );
    light.position.set( 1000, 1000, 100 );
    scene.add(light);

    var axisHelper = new THREE.AxisHelper( 5 );
    scene.add( axisHelper );
};

// create 3js elements: scene, canvas, camera and controls; and init them and add skybox to the scene
createCanvas = function() {
    sceneLeft = new THREE.Scene();
    canvasLeft = document.getElementById('canvasLeft');
    rendererLeft = new THREE.WebGLRenderer({antialias: true});
    cameraLeft = new THREE.PerspectiveCamera(75, canvasLeft.clientWidth / window.innerHeight, 0.1, 3000);
    initScene(modelLeft, sceneLeft, canvasLeft, rendererLeft, cameraLeft);
    controlsLeft = new THREE.TrackballControls(cameraLeft, rendererLeft.domElement);
    controlsLeft.rotateSpeed = 0.5;

    sceneRight = new THREE.Scene();
    canvasRight = document.getElementById('canvasRight');
    rendererRight = new THREE.WebGLRenderer({antialias: true});
    cameraRight = new THREE.PerspectiveCamera(75, canvasRight.clientWidth / window.innerHeight, 0.1, 3000);
    initScene(modelRight, sceneRight, canvasRight, rendererRight, cameraRight);
    controlsRight = new THREE.TrackballControls(cameraRight, rendererRight.domElement);
    controlsRight.rotateSpeed = 0.5;

    addSkybox(sceneLeft);
    addSkybox(sceneRight);
};


// init the canvas where we render the brain
initCanvas = function () {
    // remove start page buttons
    removeStartButton();
    removeUploadButtons();
    // add controls
    addOpacitySlider();
    addThresholdSlider();
    addGroupList();
    // addModalityButton();
    addGeometryRadioButtons(modelLeft, 'Left');
    addGeometryRadioButtons(modelRight, 'Right');

    // addSkyboxButton();
    addDimensionFactorSlider();
    // addFslRadioButton();
    // addSearchPanel();

    modelLeft.setRegionsActivated();
    modelRight.setRegionsActivated();

    //setThreshold(30);

    createLegend(modelLeft);
    // create visualization
    glyphsLeft = [];
    glyphsRight = [];
    glyphNodeDictionary = {};
    // create left and right canvas
    createCanvas();
    // prepare Occulus rift
    if (vr > 0) {
        oculusControlLeft = new THREE.VRControls(cameraLeft, function (message) {
            console.log("VRControlsL: ", message);
        });
        effectLeft = new THREE.VREffect(rendererLeft, function (message) {
            console.log("VREffectL ", message);
        });
        // effectLeft.setSize(window.innerWidth, window.innerHeight);

        oculusControlRight = new THREE.VRControls(cameraRight, function (message) {
            console.log("VRControlsR: ", message);
        });
        effectRight = new THREE.VREffect(rendererRight, function (message) {
            console.log("VREffectR ", message);
        });
        // effectRight.setSize(window.innerWidth, window.innerHeight);

        var navigator = window.navigator;
        if (navigator.getVRDisplays) {
            navigator.getVRDisplays()
                .then(function (displays) {
                    effectLeft.setVRDisplay(displays[0]);
                    oculusControlLeft.setVRDisplay(displays[0]);

                    effectRight.setVRDisplay(displays[0]);
                    oculusControlRight.setVRDisplay(displays[0]);
                })
                .catch(function () {

                });
        }

        // initOculusTouch();
        window.addEventListener("keypress", onKeyPress, true);
    }


    visibleNodes = Array(modelLeft.getConnectionMatrixDimension()).fill(true);
    // draw connectomes and start animation
    drawAllRegions();
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

    removeEdgesFromScene(sceneLeft, displayedEdgesLeft);
    removeEdgesFromScene(sceneRight, displayedEdgesRight);
    displayedEdgesLeft = [];
    displayedEdgesRight = [];

    drawConnections(modelLeft, glyphsLeft, sceneLeft, displayedEdgesLeft);
    drawConnections(modelRight, glyphsRight, sceneRight, displayedEdgesRight);
};

// updating scenes: redrawing glyphs and displayed edges
updateScenes = function() {
    console.log("Scene update");
    updateLeftScene();
    updateRightScene();
};
updateLeftScene = function () {
    console.log("Scene update left");
    displayedEdgesLeft = updateScene(modelLeft, glyphsLeft, sceneLeft, displayedEdgesLeft);
};
updateRightScene = function () {
    console.log("Scene update right");
    displayedEdgesRight = updateScene(modelRight,glyphsRight, sceneRight, displayedEdgesRight);
};
updateScene = function(model, glyphs, scene, displayedEdges){
    removeNodesFromScene(scene, glyphs);
    removeEdgesFromScene(scene, displayedEdges);
    displayedEdges = [];

    drawRegions(model, model.getDataset(), glyphs, scene);
    drawConnections(model, glyphs, scene, displayedEdges);
    createLegend(model);

    return displayedEdges;
};

removeNodesFromScene = function (scene, glyphs) {
    var l = glyphs.length;

    for (var i=0; i < l; ++i){
        scene.remove(glyphs[i]);
        delete glyphNodeDictionary[glyphs[i].uuid];
    }
    glyphs = [];
};

removeEdgesFromScene = function (scene, displayedEdges) {
    for(var i=0; i < displayedEdges.length; ++i){
        scene.remove(displayedEdges[i]);
    }
};
/*
scanOculusTouch = function () {
    if (controllerLeft.getButtonState('trigger'))
        setPreviewArea('left');
    if(controllerRight.getButtonState('trigger'))
        setPreviewArea('right');

    // setTimeout(function() { scanOculusTouch(); }, 100);
};*/

// animate scenes and capture control inputs
animate = function () {
    if (vr > 0) {
        if (activeVR == 'left')
            effectLeft.requestAnimationFrame(animate);
        else if (activeVR == 'right')
            effectRight.requestAnimationFrame(animate);

        // controllerLeft.update();
        // controllerRight.update();
    } else {
        requestAnimationFrame(animate);
        controlsLeft.update();
        controlsRight.update();
    }
    if(vr > 0 ) {
        if (activeVR == 'left')
            oculusControlLeft.update();
        else if (activeVR == 'right')
            oculusControlRight.update();
    }
    render();
};

// perform rendering for left and right scenes
render = function() {
    if(vr == 0){
        rendererLeft.render(sceneLeft, cameraLeft);
        rendererRight.render(sceneRight, cameraRight);
    } else { // occulus rift
        if (activeVR == 'left') {
            effectLeft.render(sceneLeft, cameraLeft);
        } else if (activeVR == 'right') {
            effectRight.render(sceneRight, cameraRight);
        }
    }
};

// determine if a region should be drawn
shouldDrawRegion = function(model, region) {
    return (model.isRegionActive(region.group) && model.getLabelVisibility(region.label));
};

// draw the brain regions as glyphs (the edges)
drawAllRegions = function() {
    drawRegions(modelLeft, modelLeft.getDataset(), glyphsLeft, sceneLeft);
    drawRegions(modelRight, modelRight.getDataset(), glyphsRight, sceneRight);
};
drawRegions = function(model, dataset, glyphs, scene) {

    var l = dataset.length;

    var material;
    var geometry = new THREE.CircleGeometry( 1.0, 10);

    for(var i=0; i < l; i++){
        glyphs[i] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        if(shouldDrawRegion(model, dataset[i])) {
            material = getNormalMaterial(model, dataset[i].group,i);

            if(nodesSelected.indexOf(i) == -1) {
                //if the node is not selected
                geometry = createNormalGeometry(dataset[i].hemisphere);
            } else {
                // selected node
                geometry = createSelectedGeometry(dataset[i].hemisphere);
            }

            if(root && root == i){
                // root node
                geometry = createRootGeometry(dataset[i].hemisphere);
                material.transparent = false;
            }

            glyphs[i] = new THREE.Mesh(geometry, material);
            glyphs[i].userData.hemisphere = dataset[i].hemisphere;
            glyphs[i].position.set(dataset[i].position.x, dataset[i].position.y, dataset[i].position.z);

            glyphNodeDictionary[glyphs[i].uuid] = i;

            if(visibleNodes[i]){
                scene.add(glyphs[i]);
            }
        }
        glyphs[i].userData.hemisphere = dataset[i].hemisphere;
    }
};


// draw all connections between the selected nodes, needs the connection matrix.
// don't draw edges belonging to inactive nodes
drawConnections = function(model, glyphs, scene, displayedEdges) {
    var nodeIdx;
    for(var i= 0; i < nodesSelected.length; i++){
        nodeIdx = nodesSelected[i];
        // draw only edges belonging to active nodes
        if(model.isRegionActive(model.getRegionByNode(nodeIdx))) {
            // two ways to draw edges
            if(thresholdModality) {
                // 1) filter edges according to threshold
                drawEdgesGivenNode(model, glyphs, scene, displayedEdges, nodeIdx);
            } else {
                // 2) draw top n edges connected to the selected node
                drawTopNEdgesByNode(model, glyphs, scene, nodeIdx, model.getNumberOfEdges());
            }
        }
    }

    // draw all edges belonging to the shortest path array
    for(i=0; i < shortestPathEdges.length; i++){
        displayedEdges[displayedEdges.length] = shortestPathEdges[i];
        scene.add(shortestPathEdges[i]);
    }

    // setEdgesColor(displayedEdges);
};

// set the color and thickness of displayed edges
var setEdgesColor = function (displayedEdges) {

    for(var i = 0; i < displayedEdges.length; i++){
        // displayedEdges[i].material.color = 0xff0000;
    }

    // updateEdgeLegend();
};

var updateOpacity = function (opacity) {
    edgeOpacity = opacity;
    updateEdgeOpacity(displayedEdgesLeft, opacity);
    updateEdgeOpacity(displayedEdgesRight, opacity);
};

var updateEdgeOpacity = function (displayedEdges, opacity) {
    for(var i = 0; i < displayedEdges.length; i++){
        displayedEdges[i].material.opacity = opacity;
    }
};

// draw the top n edges connected to a specific node
drawTopNEdgesByNode = function (model, glyphs, scene, displayedEdges, nodeIndex, n) {

    var row = model.getTopConnectionsByNode(nodeIndex, n);
    // var edges = model.getActiveEdges()
    // var edgeIdx = model.getEdgesIndeces();
    console.log("drawTopNEdgesByNode row " + row);
    for (var obj in row) {
        if (model.isRegionActive(model.getRegionByNode(obj)) && visibleNodes[obj]) {
            var start = new THREE.Vector3(  glyphs[nodeIndex].position.x,
                                            glyphs[nodeIndex].position.y,
                                            glyphs[nodeIndex].position.z );
            var end = new THREE.Vector3(glyphs[obj].position.x, glyphs[obj].position.y, glyphs[obj].position.z);
            displayedEdges[displayedEdges.length] = drawEdgeWithName(scene, start, end, row[obj]);
        }
    }

    // setEdgesColor(displayedEdges);
};

// draw edges given a node following edge threshold
drawEdgesGivenNode = function(model, glyphs, scene, displayedEdges, indexNode) {

    var row = model.getConnectionMatrixRow(indexNode);
    var edges = model.getActiveEdges();
    var edgeIdx = model.getEdgesIndeces();
    if (enableEB) {
        model.performEBOnNode(indexNode);
    }

    for(var i=0; i < row.length ; i++){
        if((i != indexNode) && row[i] > model.getThreshold()  && model.isRegionActive(model.getRegionByNode(i)) && visibleNodes[i]) {
            displayedEdges[displayedEdges.length] = drawEdgeWithName(scene, edges[edgeIdx[indexNode][i]], indexNode);
        }
    }
    // setEdgesColor(displayedEdges);
};

// create a line using start and end points and give it a name
// TODO use this to allow different line sizes
// https://github.com/spite/THREE.MeshLine#create-a-threemeshline-and-assign-the-geometry
// geometry.vertices.push(end);
// var line = new THREE.MeshLine();
// line.setGeometry( geometry );
// material = new THREE.MeshLineMaterial();
// var mesh  = new THREE.Mesh(line.geometry, material);
createLine = function(edge, ownerNode){
    var material = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: edgeOpacity,
        color: 0xff0000
        // lights: true
        // Due to limitations in the ANGLE layer, with the WebGL renderer on Windows platforms linewidth
        // will always be 1 regardless of the set value.!!!
    });
    var geometry = new THREE.Geometry();
    geometry.vertices = edge;
    var line  = new THREE.Line(geometry, material);
    line.name = ownerNode;
    return line;
};

var drawEdgeWithName = function (scene, edge, ownerNode) {
    var line = createLine(edge, ownerNode);
    scene.add(line);
    return line;
};

removeEdgesGivenNodeFromScenes = function(nodeIndex) {
    displayedEdgesLeft = removeEdgesGivenNode(glyphsLeft, sceneLeft, displayedEdgesLeft, nodeIndex);
    displayedEdgesRight = removeEdgesGivenNode(glyphsRight, sceneRight, displayedEdgesRight, nodeIndex);

    // setEdgesColor(displayedEdgesLeft);
    // setEdgesColor(displayedEdgesRight);
};

// give a specific node index, remove all edges from a specific node in a specific scene
removeEdgesGivenNode = function(glyphs, scene, displayedEdges, indexNode) {
    var l = displayedEdges.length;

    // keep a list of removed edges indexes
    var removedEdges = [];
    for(var i=0; i < l; i++){
        var edge = displayedEdges[i];
        //removing only the edges that starts from that node
        if(edge.name == indexNode && shortestPathEdges.indexOf(edge) == -1){
            removedEdges[removedEdges.length] = i;
            scene.remove(edge);
        }
    }

    // update the displayedEdges array
    var updatedDisplayEdges = [];
    for(i=0; i < displayedEdges.length; i++){
        //if the edge should not be removed
        if( removedEdges.indexOf(i) == -1){
            updatedDisplayEdges[updatedDisplayEdges.length] = displayedEdges[i];
        }
    }

    for(i=0; i < shortestPathEdges.length; i++){
        updatedDisplayEdges[updatedDisplayEdges.length] = shortestPathEdges[i];
    }
    return updatedDisplayEdges;
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

    var camera = isLeft? cameraLeft:cameraRight;
    var glyphs = isLeft? glyphsLeft:glyphsRight;

    vector = vector.unproject( camera );

    var ray = new THREE.Raycaster( camera.position,
        vector.sub( camera.position ).normalize() );

    var objectsIntersected = ray.intersectObjects( glyphs );

    if(objectsIntersected[0]){
        return objectsIntersected[0];
    }

    return undefined;
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

// callback when window is resized
resizeScene = function(camera, renderer){
    camera.aspect = window.innerWidth/2.0 / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth/2.0, window.innerHeight);
    animate();
};


changeColorGroup = function (n) {
    modelLeft.setActiveGroup(parseInt(n));
    modelRight.setActiveGroup(parseInt(n));

    modelLeft.setRegionsActivated();
    modelRight.setRegionsActivated();
    setColorGroupScale();

    updateScenes();
};

redrawScene = function (model, side) {
    updateNeeded = true;
    switch(side) {
        case 'Left':
        case 'left':
            updateLeftScene();
            if(spt) {
                drawShortestPathLeft(root);
            }
            break;
        case 'Right':
        case 'right':
            updateRightScene();
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
    redrawScene(model, side);
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

// draw skybox from images
addSkybox = function(scene){
    var folder = 'darkgrid';
    var images = [
        'images/'+folder+'/negx.png',
        'images/'+folder+'/negy.png',
        'images/'+folder+'/negz.png',
        'images/'+folder+'/posx.png',
        'images/'+folder+'/posy.png',
        'images/'+folder+'/posz.png'
    ];

    var cubemap = THREE.ImageUtils.loadTextureCube(images); // load textures
    cubemap.format = THREE.RGBFormat;

    var shader = THREE.ShaderLib['cube']; // init cube shader from built-in lib
    shader.uniforms['tCube'].value = cubemap; // apply textures to shader

    // create shader material
    var skyBoxMaterial = new THREE.ShaderMaterial( {
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    });

    // create skybox mesh
    var skybox = new THREE.Mesh(
        new THREE.CubeGeometry(1500, 1500, 1500),
        skyBoxMaterial
    );

    skybox.name = "skybox";
    scene.add(skybox);
};

// toggle skybox visibility
setSkyboxVisibility = function(scene, visible){
    var results = scene.children.filter(function(d) {return d.name == "skybox"});
    var skybox = results[0];
    skybox.visible = visible;
};

// draw a selected node in both scenes
drawSelectedNode = function (nodeIndex, mesh) {
    // if node not selected, draw the edges connected to it and add it to selected nodes
    if(nodesSelected.indexOf(nodeIndex) == -1) {
        nodesSelected[nodesSelected.length] = nodeIndex;
    }
    glyphsLeft[nodeIndex].geometry = createSelectedGeometry(mesh.userData['hemisphere']);
    glyphsRight[nodeIndex].geometry = createSelectedGeometry(mesh.userData['hemisphere'])
};

// change the subject in a specific scene
changeSceneToSubject = function (subjectId, model, scene, glyphs, displayedEdges, side) {
    var fileNames = dataFiles[subjectId];
    removeGeometryButtons(side);
    model.clearModel();

    removeNodesFromScene(scene, glyphs);
    removeEdgesFromScene(scene, displayedEdges);

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
                    redrawScene(model, side);
                })
            ;
        });
};