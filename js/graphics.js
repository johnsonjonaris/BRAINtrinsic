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

var oculusControl;

var dimensionScale;
var effect;

var nodesSelected = [];
var visibleNodes =[];               // boolean array storing nodes visibility
var displayedEdges = [];            // store displayed edges
var shortestPathEdges = [];

var pointedObject;                  // node object under mouse
var root;                           // the index of the root node = start point of shortest path computation
var distanceArray;                  // contain the shortest path for current selected node (root)

var thresholdModality = true;

var spt = false;                    // enabling shortest path
var click = true;

// callback on mouse moving, expected action: node beneath pointer are drawn bigger
function onDocumentMouseMove( event ) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    event.preventDefault();
    var intersectedObject = getIntersectedObject(event);
    // var isLeft = event.clientX < window.innerWidth/2;
    var nodeIdx, regionName, nodeRegion;
    if ( intersectedObject ) {
        nodeIdx = glyphNodeDictionary[intersectedObject.object.uuid];
        regionName = getRegionNameByIndex(nodeIdx);
        nodeRegion = getRegionByNode(nodeIdx);
    }
    var nodeExistAndVisible = (intersectedObject && visibleNodes[nodeIdx] && isRegionActive(nodeRegion));
    // update node information label
    if ( nodeExistAndVisible ) {
        setNodeInfoPanel(regionName, nodeIdx);
    }

    if ( nodeExistAndVisible && (nodesSelected.indexOf(nodeIdx) == -1) ) { // not selected
        // create a selected node (bigger) from the pointed node
        pointedObject = intersectedObject.object;
        glyphsLeft[nodeIdx].geometry = createSelectedGeometryByObject(pointedObject);
        glyphsRight[nodeIdx].geometry = createSelectedGeometryByObject(pointedObject);
        // console.log("Drawing edges from node ", nodeIdx);
        // draw edges in one two ways:
        if(thresholdModality) {
            // 1) all edges from a given node
            drawEdgesGivenNode(glyphsLeft, sceneLeft, nodeIdx);
            drawEdgesGivenNode(glyphsRight, sceneRight, nodeIdx);
        } else{
            // 2) strongest n edges from the node
            var n = getNumberOfEdges();
            console.log("Drawing top " + n + " edges");
            drawTopNEdgesByNode(glyphsLeft, sceneLeft, nodeIdx, n);
            drawTopNEdgesByNode(glyphsRight, sceneRight, nodeIdx, n);
        }
    } else {
        if(pointedObject){
            nodeIdx = glyphNodeDictionary[pointedObject.uuid];
            if(nodeIdx == root) {
                console.log("Root creation");
                glyphsLeft[nodeIdx].geometry = createRootGeometryByObject(pointedObject);
                glyphsRight[nodeIdx].geometry = createRootGeometryByObject(pointedObject);
            }
            else {
                glyphsLeft[nodeIdx].geometry = createNormalGeometryByObject(pointedObject);
                glyphsRight[nodeIdx].geometry = createNormalGeometryByObject(pointedObject);
            }

            // remove all edges if node is not selected
            if(nodesSelected.indexOf(nodeIdx) == -1 ) {
                // console.log("Removing edges from node ", nodeIdx);
                removeEdgesGivenNodeFromScenes(nodeIdx);
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
function onClick( event ) {

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
                pointedObject = null;
            } else {
                //if the node is already selected, remove edges and remove from the nodeSelected Array
                glyphsLeft[nodeIndex].material.color = new THREE.Color(scaleColorGroup(getRegionByNode(nodeIndex), nodeIndex));
                glyphsRight[nodeIndex].material.color = new THREE.Color(scaleColorGroup(getRegionByNode(nodeIndex), nodeIndex));
                glyphsLeft[nodeIndex].geometry = createNormalGeometryByObject(objectIntersected.object);
                glyphsRight[nodeIndex].geometry = createNormalGeometryByObject(objectIntersected.object);
                nodesSelected.splice(el, 1);
                removeEdgesGivenNodeFromScenes(nodeIndex);
            }
        } else {
            getShortestPathBetweenNodes(glyphs, root, nodeIndex);
        }
    }
}

// callback on mouse press
function onMouseDown(event) {
    click = true;
    switch (event.button) {
        case 0: // left click
            onClick(event);
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

// initialize scene: init 3js scene, canvas, renderer and camera; add axis and light to the scene
initScene = function (scene, canvas, renderer, camera) {

    canvas.addEventListener('dblclick', onDblClick , true);
    canvas.addEventListener('mousedown', onMouseDown, true);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onDocumentMouseMove, true );

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
    initScene(sceneLeft, canvasLeft, rendererLeft, cameraLeft);
    controlsLeft = new THREE.TrackballControls(cameraLeft, rendererLeft.domElement);
    controlsLeft.rotateSpeed = 0.5;

    sceneRight = new THREE.Scene();
    canvasRight = document.getElementById('canvasRight');
    rendererRight = new THREE.WebGLRenderer({antialias: true});
    cameraRight = new THREE.PerspectiveCamera(75, canvasRight.clientWidth / window.innerHeight, 0.1, 3000);
    initScene(sceneRight, canvasRight, rendererRight, cameraRight);
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
    addThresholdSlider();
    addGroupList();
    // addModalityButton();
    addGeometryRadioButton();
    // addSkyboxButton();
    addDimensionFactorSlider();
    addFslRadioButton();
    // addSearchPanel();

    setRegionsActivated();

    //setThreshold(30);
    computeDistanceMatrix();

    createLegend(activeGroup);
    // create visualization
    glyphsLeft = [];
    glyphsRight = [];
    glyphNodeDictionary = {};
    // create left and right canvas
    createCanvas();
    // prepare Occulus rift
    /* reactivate with Occlus rift
    effect = new THREE.OculusRiftEffect( rendererLeft, { worldScale: 1 } );
    effect.setSize( window.innerWidth/2.0, window.innerHeight );

    var HDM;
    vr = parseInt(vr);
    switch (vr) {
        case 1:
            HDM = {
                hResolution: 1280,
                vResolution: 800,
                hScreenSize: 0.14976,
                vScreenSize: 0.0936,
                interpupillaryDistance: 0.064,
                lensSeparationDistance: 0.064,
                eyeToScreenDistance: 0.041,
                distortionK: [1.0, 0.22, 0.24, 0.0],
                chromaAbParameter: [0.996, -0.004, 1.014, 0.0]
            };
            break;
        case 2:
            HDM = {
                hResolution: 1920,
                vResolution: 1080,
                hScreenSize: 0.12576,
                vScreenSize: 0.07074,
                interpupillaryDistance: 0.0635,
                lensSeparationDistance: 0.0635,
                eyeToScreenDistance: 0.041,
                distortionK: [1.0, 0.22, 0.24, 0.0],
                chromaAbParameter: [0.996, -0.004, 1.014, 0.0]
            };
            break;
    }
    if (vr > 0) {
        oculuscontrol = new THREE.OculusControls(cameraLeft);
        oculuscontrol.connect();
        effect.setHMD(HDM);
        effect.setSize(window.innerWidth, window.innerHeight);
    }
    */
    visibleNodes = Array(getConnectionMatrixDimension()).fill(true);
    // draw connectomes and start animation
    drawAllRegions(getDataset());
    animate();
};

// updating scenes: redrawing glyphs and displayed edges
updateScenes = function() {
    updateLeftScene();
    updateRightScene();
};
updateLeftScene = function () { updateScene(glyphsLeft, sceneLeft); };
updateRightScene = function () { updateScene(glyphsRight, sceneRight); };
updateScene = function(glyphs, scene){
    console.log("Scene update");
    var l = glyphs.length;

    for (var i=0; i < l; i++){
        scene.remove(glyphs[i]);
        delete glyphNodeDictionary[glyphs[i].uuid];
    }

    for(i=0; i < displayedEdges.length; i++){
        scene.remove(displayedEdges[i]);
    }

    displayedEdges = [];

    drawRegions(getDataset(), glyphs, scene);
    drawConnections(glyphs, scene);
    createLegend(activeGroup);
};

// animate scenes and capture control inputs
animate = function () {
    requestAnimationFrame(animate);
    controlsLeft.update();
    controlsRight.update();

    if(vr > 0 ) {
        oculuscontrol.update();
    }
    render();
};

// perform rendering for left and right scenes
render = function() {
    if(vr == 0){
        rendererLeft.render(sceneLeft, cameraLeft);
        rendererRight.render(sceneRight, cameraRight);
    }else{ // occulus rift
        effect.render( sceneLeft, cameraLeft );
    }
};

// linearly scale coordinates to a range -500 to +500
// returns a function that can be used to scale any input
// according to provided data
var createCentroidScale = function(d){
    var l = d.length;
    var allCoordinates = [];

    for(var i=0; i < l; i++) {
        allCoordinates[allCoordinates.length] = d[i].x;
        allCoordinates[allCoordinates.length] = d[i].y;
        allCoordinates[allCoordinates.length] = d[i].z;
    }
    var centroidScale = d3.scale.linear().domain(
        [
            d3.min(allCoordinates, function(e){ return e; }),
            d3.max(allCoordinates, function(e){ return e; })
        ]
    ).range([-500,+500]);
    return centroidScale;
};


// determine if a region should be drawn
shouldDrawRegion = function(region) {
    if(isRegionActive(region.group) && getLabelVisibility(region.label))
        return true;
    return false;
};

// draw the brain regions as glyphs (the edges)
drawAllRegions = function(dataset) {
    drawRegions(dataset, glyphsLeft, sceneLeft);
    drawRegions(dataset, glyphsRight, sceneRight);
};
drawRegions = function(dataset, glyphs, scene) {

    var l = dataset.length;
    var centroidScale = createCentroidScale(dataset);
    // compute centroids according to scaled data
    var xCentroid = d3.mean(dataset, function(d){ return centroidScale(d.x); });
    var yCentroid = d3.mean(dataset, function(d){ return centroidScale(d.y); });
    var zCentroid = d3.mean(dataset, function(d){ return centroidScale(d.z); });

    var material;
    var geometry = new THREE.CircleGeometry( 1.0, 10);

    for(var i=0; i < l; i++){
        glyphs[i] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        if(shouldDrawRegion(dataset[i])) {
            material = getNormalMaterial(dataset[i].group,i);

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

            var x = centroidScale(dataset[i].x) - xCentroid;
            var y = centroidScale(dataset[i].y) - yCentroid;
            var z = centroidScale(dataset[i].z) - zCentroid;

            glyphs[i].position.set(x, y, z);

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
var drawConnections = function (glyphs, scene) {
    var nodeIdx;
    for(var i= 0; i < nodesSelected.length; i++){
        nodeIdx = nodesSelected[i];
        // draw only edges belonging to active nodes
        if(isRegionActive(getRegionByNode(nodeIdx))) {
            // two ways to draw edges
            if(thresholdModality) {
                // 1) filter edges according to threshold
                drawEdgesGivenNode(glyphs, scene, nodeIdx);
            } else {
                // 2) draw top n edges connected to the selected node
                drawTopNEdgesByNode(glyphs, scene, nodeIdx, getNumberOfEdges());
            }
        }
    }

    // draw all edges belonging to the shortest path array
    for(i=0; i < shortestPathEdges.length; i++){
        displayedEdges[displayedEdges.length] = shortestPathEdges[i];
        scene.add(shortestPathEdges[i]);
    }

    setEdgesColor();
};

// set the color and thickness of displayed edges
var setEdgesColor = function () {
    var allDisplayedWeights =[];
    for(var i = 0; i < displayedEdges.length; i++){
        allDisplayedWeights[allDisplayedWeights.length] = displayedEdges[i].name;
    }

    // var edgeColorScale =  d3.scale.linear().domain(
    //     [
    //         d3.min(allDisplayedWeights, function(e) { return e; }),
    //         d3.max(allDisplayedWeights, function(e) { return e; })
    //     ]
    // ).range(["#edf8fb", "#005824"]);

    var edgeOpacityScale = d3.scale.linear().domain(
        [
            d3.min(allDisplayedWeights, function(e) { return e; }),
            d3.max(allDisplayedWeights, function(e) { return e; })
        ]
    ).range([0.1,1]);

    // var edgeDimensionScale = d3.scale.linear().domain(
    //     [
    //         d3.min(allDisplayedWeights, function(e) { return e; }),
    //         d3.max(allDisplayedWeights, function(e) { return e; })
    //     ]
    // ).range([1,15]);


    for(i = 0; i < displayedEdges.length; i++){
        //var edgeColor = new THREE.Color(edgeColorScale(displayedEdges[i].name));
        //var edgeWidth = edgeDimensionScale(displayedEdges[i].name);

        var material = new THREE.LineBasicMaterial(
            {
                opacity: edgeOpacityScale(displayedEdges[i].name),
                transparent: true,
                //color: edgeColor,
                linewidth: 2
            });

        displayedEdges[i].material = material;
    }

    // updateEdgeLegend();
};

// draw the top n edges connected to a specific node
drawTopNEdgesByNode = function (glyphs, scene, nodeIndex, n) {

    var row = getTopConnectionsByNode(nodeIndex, n);
    for (var obj in row) {
        if (isRegionActive(getRegionByNode(obj)) && visibleNodes[obj]) {
            var start = new THREE.Vector3(  glyphs[nodeIndex].position.x,
                glyphs[nodeIndex].position.y,
                glyphs[nodeIndex].position.z );
            var end = new THREE.Vector3(glyphs[obj].position.x, glyphs[obj].position.y, glyphs[obj].position.z);
            var line = drawEdgeWithName(scene, start, end, row[obj]);
            displayedEdges[displayedEdges.length] = line;
        }
    }

    setEdgesColor();
};

// draw edges given a node following edge threshold
var drawEdgesGivenNode = function (glyphs, scene, indexNode) {

    var row = getConnectionMatrixRow(indexNode);
    for(var i=0; i < row.length ; i++){
        if(row[i] > getThreshold()  && isRegionActive(getRegionByNode(i)) && visibleNodes[i]) {
            var start = new THREE.Vector3(  glyphs[indexNode].position.x,
                                            glyphs[indexNode].position.y,
                                            glyphs[indexNode].position.z );
            var end = new THREE.Vector3(glyphs[i].position.x, glyphs[i].position.y, glyphs[i].position.z );
            var line = drawEdgeWithName(scene, start, end, row[i]);
            displayedEdges[displayedEdges.length] = line;
        }
    }
    setEdgesColor();
};

// create a line using start and end points and give it a name
createLine = function (start, end, name){
    var material = new THREE.LineBasicMaterial();
    var geometry = new THREE.Geometry();
    geometry.vertices.push(start, end);
    var line  = new THREE.Line(geometry, material);
    line.name = name;
    return line;
};

// draw an edge from a start to end points in a specific scene and give it a name
var drawEdgeWithName = function (scene, start, end, name) {
    var line = createLine(start, end, name);
    scene.add(line);
    return line;
};

removeEdgesGivenNodeFromScenes = function(nodeIndex) {
    removeEdgesGivenNode(glyphsLeft, sceneLeft, nodeIndex);
    var removedEdges = removeEdgesGivenNode(glyphsRight, sceneRight, nodeIndex);

    // update the displayedEdges array
    var updatedDisplayEdges = [];
    for(var i=0; i < displayedEdges.length; i++){
        //if the edge should not be removed
        if( removedEdges.indexOf(i) == -1){
            updatedDisplayEdges[updatedDisplayEdges.length] = displayedEdges[i];
        }
    }

    for(i=0; i < shortestPathEdges.length; i++){
        updatedDisplayEdges[updatedDisplayEdges.length] = shortestPathEdges[i];
    }

    displayedEdges = updatedDisplayEdges;

    setEdgesColor();
};

// give a specific node index, remove all edges from a specific node in a specific scene
var removeEdgesGivenNode = function (glyphs, scene, indexNode) {
    var x = glyphs[indexNode].position.x;
    var y = glyphs[indexNode].position.y;
    var z = glyphs[indexNode].position.z;

    var l = displayedEdges.length;

    // keep a list of removed edges indexes
    var removedEdges = [];
    for(var i=0; i < l; i++){
        var edge = displayedEdges[i];

        var xStart = edge.geometry.vertices[0].x;
        var yStart = edge.geometry.vertices[0].y;
        var zStart = edge.geometry.vertices[0].z;

        //removing only the edges that starts from that node
        if(x == xStart && y == yStart && z == zStart && shortestPathEdges.indexOf(edge) == -1){
            removedEdges[removedEdges.length] = i;
            scene.remove(edge);
        }
    }

    return removedEdges;
};

// get intersected object beneath the mouse pointer
// detects which scene: left or right
// return undefined if no object was found
getIntersectedObject = function (event) {

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
};
drawShortestPathLeft = function(nodeIndex) { drawShortestPath(glyphsLeft, nodeIndex);};
drawShortestPathRight = function(nodeIndex) { drawShortestPath(glyphsRight, nodeIndex);};

// draw shortest path for a specific node
drawShortestPath = function (glyphs, nodeIndex) {
    console.log("Draw Shortest Path");
    var line;
    root = nodeIndex;

    var len = getConnectionMatrixDimension();
    var dist = getShortestPathDistances(nodeIndex);
    distanceArray = [];
    for(var i=0; i < getConnectionMatrixDimension(); i++){
        distanceArray[i] = dist[i];
    }
    setDistanceArray(distanceArray);

    if(!document.getElementById("distanceThresholdSlider")){
        addDistanceSlider(distanceArray);
    }

    shortestPathDistanceUI();

    nodesSelected = [];
    shortestPathEdges = [];

    // show only nodes with shortest paths distance less than a threshold
    for(i=0; i < len; i++){
        visibleNodes[i] = (dist[i] < getDistanceThreshold());
    }

    for(i=0; i < visibleNodes.length; i++){
        if(visibleNodes[i]){
            var prev = glyphs[previousMap[i]];
            if(prev) {
                var start = new THREE.Vector3(glyphs[i].position.x, glyphs[i].position.y, glyphs[i].position.z);
                var end = new THREE.Vector3(prev.position.x, prev.position.y, prev.position.z);
                line = createLine(start, end, getConnectionMatrix()[i][previousMap[i]] );
                shortestPathEdges[shortestPathEdges.length] = line;
            }
        }
    }

    setEdgesColor();
    updateScenes();
};

// callback when window is resized
resizeScene = function(camera, renderer){
    camera.aspect = window.innerWidth/2.0 / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth/2.0, window.innerHeight);
    animate();
};


changeColorGroup = function (n) {
    activeGroup = parseInt(n);

    setRegionsActivated();
    setColorGroupScale();

    updateScenes();
};

// change the active geometry
changeActiveGeometry = function(n){
    console.log("Change Active Geometry to: ", n);
    activeCentroids = n;
    activeMatrix = (n == 'isomap') ?  'isomap' : 'normal';
    updateNeeded = true;
    computeDistanceMatrix();
    updateScenes();

    //TODO: switch according to spt
    if(spt) {
        drawShortestPathLeft(root);
        drawShortestPathRight(root);
    }
};

// draw shortest path from root node up to a number of hops
drawShortestPathHops = function (glyphs, rootNode, hops){
    var hierarchy = getHierarchy(rootNode);

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
                    var line = createLine(start, end, getConnectionMatrix()[hierarchy[i][j]][previousMap[hierarchy[i][j]]]);
                    shortestPathEdges[shortestPathEdges.length] = line;
                }
            }

        } else{
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

// draw a selected node
drawSelectedNode = function (nodeIndex, mesh) {
    // if node not selected, draw the edges connected to it and add it to selected nodes
    if(nodesSelected.indexOf(nodeIndex) == -1) {
        if (thresholdModality) {
            drawEdgesGivenNode(glyphsLeft, sceneLeft, nodeIndex);
            drawEdgesGivenNode(glyphsRight, sceneRight, nodeIndex);
        } else {
            var n = getNumberOfEdges();
            drawTopNEdgesByNode(glyphsLeft, sceneLeft, nodeIndex, n);
            drawTopNEdgesByNode(glyphsRight, sceneRight, nodeIndex, n);
        }
        nodesSelected[nodesSelected.length] = nodeIndex;
    }
    glyphsLeft[nodeIndex].geometry = createSelectedGeometry(mesh.userData['hemisphere']);
    glyphsRight[nodeIndex].geometry = createSelectedGeometry(mesh.userData['hemisphere'])
};


