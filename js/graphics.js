/**
 * Created by giorgioconte on 31/01/15.
 */

//var threshold = 30;

var camera;
var canvas;
var renderer;
var controls;
var scene;
var glyphs;
var sphereNodeDictionary ={};

var oculusControl;

var dimensionScale;
var effect;

var nodesSelected = [];

var visibleNodes =[];

var displayedEdges = [];

var pointedObject;

var root;

var shortestPathEdges = [];

var distanceArray;

var thresholdModality = true;


var mouse = new THREE.Vector2();

var spt = false;

var click = true;






function onDocumentMouseMove( event )
{
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    var intersectedObject = getIntersectedObject(event);

    if ( intersectedObject  && visibleNodes[sphereNodeDictionary[intersectedObject.object.uuid]] && isRegionActive(getRegionByNode(sphereNodeDictionary[intersectedObject.object.uuid]))) {
        var i = sphereNodeDictionary[intersectedObject.object.uuid];
        var regionName = getRegionNameByIndex(i);
        setNodeInfoPanel(regionName, i);
    }

    if ( intersectedObject && nodesSelected.indexOf(sphereNodeDictionary[intersectedObject.object.uuid]) == -1 && visibleNodes[sphereNodeDictionary[intersectedObject.object.uuid]] && isRegionActive(getRegionByNode(sphereNodeDictionary[intersectedObject.object.uuid]))) {
        var index = sphereNodeDictionary[intersectedObject.object.uuid];
        if(pointedObject){
            pointedObject.geometry = createNormalGeometryByObject(pointedObject);
        }
        pointedObject = intersectedObject.object;
        pointedObject.geometry = createSelectedGeometryByObject(pointedObject);

        var regionName = getRegionNameByIndex(index);
        setNodeInfoPanel(regionName, index);

        if(thresholdModality) {
            drawEdgesGivenNode(index);
        } else{
            console.log("top " + getNumberOfEdges() + "edges");
            drawTopNEdgesByNode(index, getNumberOfEdges());
        }
    } else{
        if(pointedObject){
            if(sphereNodeDictionary[pointedObject.uuid] == root) {
                console.log("root creation");
                pointedObject.geometry = createRootGeometryByObject(pointedObject);
            }
            else {
                pointedObject.geometry = createNormalGeometryByObject(pointedObject);
            }

            if(nodesSelected.indexOf(sphereNodeDictionary[pointedObject.uuid]) == -1 ) {
                removeEdgesGivenNode(sphereNodeDictionary[pointedObject.uuid]);
            }
            pointedObject = null;
        }
    }
}


/*
 * This method is used to interact with objects in scene.
 *
 */

function onDblClick(event){
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    event.preventDefault();

    var intersectedObject = getIntersectedObject(event);
    if(intersectedObject) {
        removeElementsFromEdgePanel();
        var nodeIndex = sphereNodeDictionary[intersectedObject.object.uuid];
        spt = true;
        drawShortestPath(nodeIndex);
    }
}

function onClick( event ){

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    event.preventDefault();
    var objectIntersected = getIntersectedObject(event);
    if (objectIntersected && visibleNodes[sphereNodeDictionary[objectIntersected.object.uuid]]) {
        if(!spt) {
            var nodeIndex = sphereNodeDictionary[objectIntersected.object.uuid];
            var el = nodesSelected.indexOf(nodeIndex);
            if (el == -1) {
                //if the node is not already selected -> draw edges and add in the nodesSelected Array
                /*

                objectIntersected.geometry = createSelectedGeometryByObject(objectIntersected.object);
                if (thresholdModality) {
                    drawEdgesGivenNode(nodeIndex);
                } else {
                    drawTopNEdgesByNode(nodeIndex, getNumberOfEdges());
                }
                nodesSelected[nodesSelected.length] = nodeIndex; */
                objectIntersected.geometry = drawSelectedNode(nodeIndex,objectIntersected.object);
                pointedObject = null;
            } else { //if the nodes is already selected, remove edges and remove from the nodeSelected Array
                objectIntersected.object.material.color = new THREE.Color(scaleColorGroup(getRegionByNode(nodeIndex),nodeIndex));
                objectIntersected.object.geometry = createNormalGeometryByObject(objectIntersected.object);
                nodesSelected.splice(el, 1);
                removeEdgesGivenNode(nodeIndex);
            }
        } else{
            nodeIndex = sphereNodeDictionary[objectIntersected.object.uuid];
            getShortestPathBetweenNodes(root,nodeIndex);
        }
    }
}

function onMouseDown(event) {
    click = true;
    switch (event.button) {
        case 0:
            onClick(event);
            break;
        case 2:
            setTimeout(function () {click = false;}, 200);
            break;
    }
}

function onMouseUp(event) {
    if(event.button == 2 && click){
        toggleFslMenu();
    }
}

/**
 * This method should be called to init th canvas where we render the brain
 */

initCanvas = function () {
    addThresholdSlider();
    removeStartButton();
    removeUploadButtons();
    addGroupList();

    addModalityButton();
    addGeometryRadioButton();
    addSkyboxButton();
    addDimensionFactorSlider();
    addFslRadioButton();
    addSearchPanel();

    setRegionsActivated();

    //setThreshold(30);
    computeDistanceMatrix();
    var light;


    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);

    camera.position.z = 50;
    glyphs = [];

    canvas = document.getElementById('canvas');

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    canvas.addEventListener('dblclick', onDblClick , true);
    canvas.addEventListener('mousedown', onMouseDown, true);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onDocumentMouseMove, true );

    canvas.appendChild(renderer.domElement);

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.5;

    effect = new THREE.OculusRiftEffect( renderer, { worldScale: 1 } );
    effect.setSize( window.innerWidth, window.innerHeight );

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
        oculuscontrol = new THREE.OculusControls(camera);

        oculuscontrol.connect();
        effect.setHMD(HDM);
        effect.setSize(window.innerWidth, window.innerHeight);
    }

    var len = getConnectionMatrixDimension();
    for(var i =0; i < len; i++){
        visibleNodes[visibleNodes.length] = true;
    }

    drawRegions(getDataset());

    //Adding light
    scene.add( new THREE.AmbientLight(0x606060, 1.5));
    light = new THREE.PointLight( 0xffffff, 1.0, 10000 );
    light.position.set( 1000, 1000, 100 );
    scene.add(light);

    var axisHelper = new THREE.AxisHelper( 5 );
    scene.add( axisHelper );

    createLegend(activeGroup);

    addSkybox();
    animate();

};

/**
 * This method should be called when a new model is uploaded in the system
 */

updateScene = function(){
    var l = glyphs.length;
    for (var i=0; i < l; i++){
        scene.remove(glyphs[i]);
    }

    for(i=0; i < displayedEdges.length; i++){
        scene.remove(displayedEdges[i]);
    }

    displayedEdges = [];

    drawRegions(getDataset());
    drawConnections();
    createLegend(activeGroup);
};

animate = function () {

    requestAnimationFrame(animate);
    controls.update();

    // for(var i = 0; i < glyphs.length; i++){
    //     glyphs[i].lookAt(camera.position);
    // }

    //controls.update(  );
    if(vr > 0 ) {
        oculuscontrol.update();
    }
    render();

};

render = function() {

    //Use the following line to render normally on the screen of the pc
    //renderer.render(scene, camera);

    // Use the following line to render the scene on the oculus rift
    //effect.render( scene, camera );

    if(vr == 0){
        renderer.render(scene, camera);
    }else{
        effect.render( scene, camera );
    }
};

var createCentroidScale = function(d){
    var l = d.length;
    var allCoordinates = [];

    for(var i=0; i < l; i++) {
        allCoordinates[allCoordinates.length] = d[i].x;
        allCoordinates[allCoordinates.length] = d[i].y;
        allCoordinates[allCoordinates.length] = d[i].z;
    }
    centroidScale = d3.scale.linear().domain(
        [
            d3.min(allCoordinates, function(element){ return element; }),
            d3.max(allCoordinates, function(element){ return element; })
        ]
    ).range([-500,+500]);
};

/*
 * This method draws all the regions of the brain as glyphs.
 */

var drawRegions = function(dataset) {

    var l = dataset.length;
    createCentroidScale(dataset);
    var xCentroid = d3.mean(dataset, function(d){ return centroidScale(d.x); });
    var yCentroid = d3.mean(dataset, function(d){ return centroidScale(d.y); });
    var zCentroid = d3.mean(dataset, function(d){ return centroidScale(d.z); });

    var material;
    var geometry = new THREE.CircleGeometry( 1.0, 10);
    for(var i=0; i < l; i++){
        glyphs[i] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        if(shouldDrawRegion(dataset[i])) {
            if(nodesSelected.indexOf(i) == -1) {
                //if the node is not selected
                material = getNormalMaterial(dataset[i].group,i);
                geometry = createNormalGeometry(dataset[i].hemisphere);

            } else {
                material = getNormalMaterial(dataset[i].group,i);
                geometry = createSelectedGeometry(dataset[i].hemisphere);
            }

            if(root && root == i){
                geometry = createRootGeometry(dataset[i].hemisphere);
                material.transparent = false;
            }

            glyphs[i] = new THREE.Mesh(geometry, material);
            glyphs[i].userData.hemisphere = dataset[i].hemisphere;

            var x = centroidScale(dataset[i].x) - xCentroid;
            var y = centroidScale(dataset[i].y) - yCentroid;
            var z = centroidScale(dataset[i].z) - zCentroid;

            glyphs[i].position.set(x, y, z);

            sphereNodeDictionary[glyphs[i].uuid] = i;

            if(visibleNodes[i]){
                // glyphs[i].lookAt( camera.position);
                scene.add(glyphs[i]);
            }
        }
        glyphs[i].userData.hemisphere = dataset[i].hemisphere;
    }
};


/*
 * This method draws all the connection between the regions. It needs the connection matrix.
 */

/*
 var drawConnections = function(connectionMatrix){
 var rows = connectionMatrix.length;

 /*
 var line = new THREE.Line( geometry, material );
 scene.add( line );
 */
/*
 var scale = getConnectionMatrixScale();
 for(var i=0; i < rows; i++){
 for(var j = 0; j < i; j++){
 if(connectionMatrix[i][j] > 30){
 var material = new THREE.LineBasicMaterial({
 color: scale(connectionMatrix[i][j]),
 linewidth: connectionMatrix[i][j]/25.0
 });
 var start = new THREE.Vector3(glyphs[i].position.x, glyphs[i].position.y,glyphs[i].position.z);
 var end = new THREE.Vector3(glyphs[j].position.x, glyphs[j].position.y,glyphs[j].position.z);
 var geometry = new THREE.Geometry();
 geometry.vertices.push(
 start,
 end
 );
 var line = new THREE.Line(geometry, material);
 scene.add(line);
 }
 }
 }
 };*/


var drawConnections = function () {
    var row;
    for(var i= 0; i < nodesSelected.length; i++){
        if(isRegionActive(getRegionByNode(nodesSelected[i]))){
            if(thresholdModality){
                row = getConnectionMatrixRow(nodesSelected[i]);
                for(var j=0; j < row.length; j++) {
                    if (isRegionActive(getRegionByNode(j)) && row[j] > getThreshold() && visibleNodes[j]) {
                        var start = new THREE.Vector3(glyphs[nodesSelected[i]].position.x, glyphs[nodesSelected[i]].position.y, glyphs[nodesSelected[i]].position.z);
                        var end = new THREE.Vector3(glyphs[j].position.x, glyphs[j].position.y, glyphs[j].position.z);
                        var line = drawEdgeWithName(start, end, row[j]);
                        displayedEdges[displayedEdges.length] = line;
                    }
                }
            } else{
                drawTopNEdgesByNode(nodesSelected[i], getNumberOfEdges());
            }

        }
    }

    for(i=0; i < shortestPathEdges.length; i++){
        displayedEdges[displayedEdges.length] = shortestPathEdges[i];
        scene.add(shortestPathEdges[i]);
    }

    setEdgesColor();
};

var setEdgesColor = function () {
    var allDisplayedWeights =[];
    for(var i = 0; i < displayedEdges.length; i++){
        allDisplayedWeights[allDisplayedWeights.length] = displayedEdges[i].name;
    }

    var edgeColorScale =  d3.scale.linear().domain(
        [
            d3.min(allDisplayedWeights, function(element){
                return element;
            })
            ,
            d3.max(allDisplayedWeights, function(element){
                return element;
            })
        ]
    ).range(["#edf8fb", "#005824"]);

    var edgeOpacityScale = d3.scale.linear().domain(
        [
            d3.min(allDisplayedWeights, function(element){
                return element;
            })
            ,
            d3.max(allDisplayedWeights, function(element){
                return element;
            })
        ]
    ).range([0.1,1]);

    var edgeDimensionScale = d3.scale.linear().domain(
        [
            d3.min(allDisplayedWeights, function(e){
                return e;
            })
            ,
            d3.max(allDisplayedWeights, function(e) {
                return e;
            })
        ]
    ).range([1,15]);


    for(i = 0; i < displayedEdges.length; i++){
        var edgeColor = new THREE.Color(edgeColorScale(displayedEdges[i].name));
        var edgeWidth = edgeDimensionScale(displayedEdges[i].name);


        var material = new THREE.LineBasicMaterial(
            {
                opacity: edgeOpacityScale(displayedEdges[i].name),
                transparent: true,
                //color: edgeColor,
                linewidth: 2
            });

        displayedEdges[i].material = material;
    }

    updateEdgeLegend();

};

var drawEdgesGivenNode = function (indexNode) {

    var connectionRow = getConnectionMatrixRow(indexNode);


    var l = connectionRow.length;
    for(var i=0; i < l ; i++){
        if(connectionRow[i] > getThreshold()  && isRegionActive(getRegionByNode(i)) && visibleNodes[i]) {
            var start = new THREE.Vector3(glyphs[indexNode].position.x, glyphs[indexNode].position.y, glyphs[indexNode].position.z);
            var end = new THREE.Vector3(glyphs[i].position.x, glyphs[i].position.y, glyphs[i].position.z);
            var line = drawEdgeWithName(start,end, connectionRow[i]);
            displayedEdges[displayedEdges.length] = line;

        }
    }
    setEdgesColor();
};

var drawEdge = function (start,end, opacity) {

    var material = new THREE.LineBasicMaterial();


    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        start,
        end
    );
    var line = new THREE.Line(geometry, material);
    scene.add(line);

    return line;
};

var drawEdgeWithName = function (start, end, name) {
    var line = drawEdge(start,end);
    line.name = name;
    return line;
};

var removeEdgesGivenNode = function (indexNode) {
    var x = glyphs[indexNode].position.x;
    var y = glyphs[indexNode].position.y;
    var z = glyphs[indexNode].position.z;

    var l = displayedEdges.length;

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

    displayedEdges = updatedDisplayEdges;

    setEdgesColor();
};

getIntersectedObject = function (event) {

    var vector = new THREE.Vector3(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5
    );
    vector = vector.unproject( camera );

    var ray = new THREE.Raycaster( camera.position,
        vector.sub( camera.position ).normalize() );


    var objectsIntersected = ray.intersectObjects( glyphs );

    if(objectsIntersected[0]){
        return objectsIntersected[0];
    }

    return undefined;
};

drawShortestPath = function (nodeIndex) {
    var line;
    root = nodeIndex;

    var len = getConnectionMatrixDimension();
    //var dist = computeShortestPathDistances(nodeIndex);

    var dist = getShortestPathDistances(nodeIndex);
    distanceArray = [];
    for(var i=0; i < getConnectionMatrixDimension(); i++){
        distanceArray[distanceArray.length] = dist[i];
    }

    setDistanceArray(distanceArray);

    if(!document.getElementById("distanceThresholdSlider")){
        addDistanceSlider(distanceArray);
    }

    shortestPathDistanceUI();

    nodesSelected = [];
    shortestPathEdges = [];

    for(var i=0; i < len; i++){
        if(dist[i] < getDistanceThreshold()){
            visibleNodes[i] = true;
        }
        else
        {
            visibleNodes[i] = false;
        }
    }

    for(i=0; i < visibleNodes.length; i++){
        if(visibleNodes[i]){
            var prev = glyphs[previousMap[i]];
            if(prev) {
                //line = drawEdgeWithName(glyphs[i].position, prev.position, getConnectionMatrix()[i][previousMap[i]]);
                var start = new THREE.Vector3(glyphs[i].position.x, glyphs[i].position.y, glyphs[i].position.z);
                var end = new THREE.Vector3(prev.position.x, prev.position.y, prev.position.z);
                line = createLine(start,end,getConnectionMatrix()[i][previousMap[i]] );
                shortestPathEdges[shortestPathEdges.length] = line;
            }
        }
    }

    setEdgesColor();
    updateScene();

};

resizeScene = function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    animate();
};

drawTopNEdgesByNode = function (nodeIndex, n) {

    var row = getTopConnectionsByNode(nodeIndex, n);

    for (var obj in row) {
        if (isRegionActive(getRegionByNode(obj)) && visibleNodes[obj]) {
            var start = new THREE.Vector3(glyphs[nodeIndex].position.x, glyphs[nodeIndex].position.y, glyphs[nodeIndex].position.z);
            var end = new THREE.Vector3(glyphs[obj].position.x, glyphs[obj].position.y, glyphs[obj].position.z);
            var line = drawEdgeWithName(start, end, row[obj]);
            displayedEdges[displayedEdges.length] = line;
        }
    }

    setEdgesColor();
};

changeColorGroup = function (n) {
    activeGroup = parseInt(n);

    setRegionsActivated();
    setColorGroupScale();

    for(var i=0; i < glyphs.length; i++){
        scene.remove(glyphs[i]);
    }

    glyphs = [];
    updateScene();
};

changeActiveGeometry = function(n){
    activeCentroids = n;
    if(n == 'isomap'){
        activeMatrix = 'isomap';
    }else{
        activeMatrix = 'normal';
    }

    updateNeeded = true;
    computeDistanceMatrix();

    for(var i=0; i < glyphs.length; i++){
        scene.remove(glyphs[i]);
    }
    glyphs = [];
    //TODO: switch according to spt

    if(spt) {
        drawShortestPath(root);
        console.log("drawing spt");
    }
    updateScene();
};

setGeometryGivenNode = function(nodeIndex, geometry){
    glyphs[nodeIndex].geometry = geometry;
}

drawShortestPathHops = function (rootNode,hops){
    var hierarchy = getHierarchy(rootNode);

    shortestPathEdges = [];
    for(var i = 0; i < hierarchy.length; i++){
        if( i < hops + 1 ) {
            //Visible node branch
            for(var j=0; j < hierarchy[i].length; j++){
                visibleNodes[hierarchy[i][j]] = true;
                var prev = glyphs[previousMap[hierarchy[i][j]]];
                if(prev){
                    var start = new THREE.Vector3(glyphs[hierarchy[i][j]].position.x, glyphs[hierarchy[i][j]].position.y, glyphs[hierarchy[i][j]].position.z);
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

    updateScene();
};

createLine = function (start,end, name){
    var material = new THREE.LineBasicMaterial();


    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        start,
        end
    );


    var line  = new THREE.Line(geometry, material);
    line.name = name;

    return line;
};

addSkybox = function(){
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

setSkyboxVisibility = function(visible){
    var results = scene.children.filter(function(d) {return d.name == "skybox"});
    var skybox = results[0];
    skybox.visible = visible;
};

shouldDrawRegion = function(region) {
    if(isRegionActive(region.group) && getLabelVisibility(region.label))
        return true;
    return false;
};

drawSelectedNode = function (nodeIndex, mesh) {
    //objectIntersected.geometry = createSelectedGeometryByObject(objectIntersected.object);

    if(nodesSelected.indexOf(nodeIndex) == -1) {
        if (thresholdModality) {
            drawEdgesGivenNode(nodeIndex);
        } else {
            drawTopNEdgesByNode(nodeIndex, getNumberOfEdges());
        }
        nodesSelected[nodesSelected.length] = nodeIndex;
    }

    return createSelectedGeometry(mesh.userData['hemisphere'])
};


