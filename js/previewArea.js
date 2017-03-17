/**
 * Created by Johnson on 2/15/2017.
 */

/**
 * This class controls the preview 3D area. It controls the creation of glyphs (nodes), edges, shortest path edges. It
 * also executes the update requests to those objects. It init the VR environment when requested.
 * @param canvas_ a WebGl canvas
 * @param model_ a Model object
 * @constructor
 */

function PreviewArea(canvas_, model_) {
    var model = model_;
    var canvas = canvas_;
    var camera = null, renderer = null, controls = null, scene = null, raycaster = null;

    // VR stuff
    var oculusControl = null, effect = null;
    var controllerLeft = null, controllerRight = null;
    var pointerLeft = null, pointerRight = null;      // left and right controller pointers for pointing at things

    var enableVR = false;
    var activeVR = false;
    // nodes and edges
    var brain = null; // three js group housing all glyphs and edges
    var glyphs = [];
    var displayedEdges = [];
    // shortest path
    var shortestPathEdges = [];

    var edgeOpacity = 1.0;

    // on pointing controller move
    var onControllerMove = function (controller) {
        var intersectedObject = getPointedObject(controller);
        updateNodeSelection(model, intersectedObject);
    };

    this.activateVR = function (activate) {
        if (activate == activeVR)
            return;
        activeVR = activate;
        if (activeVR) {
            effect.requestPresent();
        }
        else
            effect.exitPresent();
    };

    // init Oculus Rift
    this.initOculusRift = function () {
        oculusControl = new THREE.VRControls(camera, function (message) {
            console.log("VRControls: ", message);
        });
        effect = new THREE.VREffect(renderer, function (message) {
            console.log("VREffect ", message);
        });
        // effect.setSize(window.innerWidth, window.innerHeight);

        var navigator = window.navigator;
        if (navigator.getVRDisplays) {
            navigator.getVRDisplays()
                .then(function (displays) {
                    effect.setVRDisplay(displays[0]);
                    oculusControl.setVRDisplay(displays[0]);
                })
                .catch(function () {

                });
        }
        enableVR = true;

        initOculusTouch();
    };

    // init Oculus Touch controllers
    // not supported in Firefox, only Google chromium
    // check https://webvr.info/get-chrome/
    var initOculusTouch = function () {
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

            controllerLeft.standingMatrix = oculusControl.getStandingMatrix();
            controllerRight.standingMatrix = oculusControl.getStandingMatrix();

            scene.add(controllerLeft);
            scene.add(controllerRight);
        } );

        // controllerLeft.addEventListener('gripsup', function(e) { updateVRStatus('left'); }, true);
        // controllerRight.addEventListener('gripsup', function(e) { updateVRStatus('right'); }, true);

        console.log("Init Oculus Touch done")
    };

    // scan the Oculus Touch for controls
    var scanOculusTouch = function () {
        var boostRotationSpeed = controllerLeft.getButtonState('trigger') ? 0.1 : 0.02;
        var boostMoveSpeed = controllerRight.getButtonState('trigger') ? 5.0 : 1.0;
        var angleX = null, angleY = null;
        var gamePadLeft = controllerLeft.getGamepad();
        var gamePadRight = controllerRight.getGamepad();
        if(gamePadLeft) {
            angleX = gamePadLeft.axes[0];
            angleY = gamePadLeft.axes[1];
            if(controllerLeft.getButtonState('thumbpad')) {
                brain.scale.multiplyScalar(1.0 + boostRotationSpeed * angleY);
            } else {
                brain.rotateX(boostRotationSpeed * angleX);
                brain.rotateZ(boostRotationSpeed * angleY);
            }
            brain.matrixWorldNeedsUpdate = true;
        }

        if(gamePadRight) {
            angleX = gamePadRight.axes[0];
            angleY = gamePadRight.axes[1];
            if(controllerRight.getButtonState('thumbpad')) {
                brain.position.y += boostMoveSpeed * angleY;
            } else {
                brain.position.z += boostMoveSpeed * angleX;
                brain.position.x += boostMoveSpeed * angleY;
            }
            brain.matrixWorldNeedsUpdate = true;
        }

        var v3Origin = new THREE.Vector3(0,0,0);
        var v3UnitUp;
        // var v3UnitFwd = new THREE.Vector3(0,0,1);

        // Find all nodes within 0.1 distance from left Touch Controller
        var closestNodeIndexLeft = 0, closestNodeDistanceLeft = 99999.9;
        var closestNodeIndexRight = 0, closestNodeDistanceRight = 99999.9;
        for (var i = 0; i < brain.children.length; i++) {
            var distToNodeILeft = controllerLeft.position.distanceTo(brain.children[i].getWorldPosition());
            if ( (distToNodeILeft < closestNodeDistanceLeft ) ) {
                closestNodeDistanceLeft = distToNodeILeft;
                closestNodeIndexLeft = i;
            }

            var distToNodeIRight = controllerRight.position.distanceTo(brain.children[i].getWorldPosition());
            if ( (distToNodeIRight < closestNodeDistanceRight ) ) {
                closestNodeDistanceRight = distToNodeIRight;
                closestNodeIndexRight = i;
            }
        }

        if(controllerLeft.getButtonState('grips')) {
            pointedNodeIdx = (closestNodeDistanceLeft < 2.0) ? closestNodeIndexLeft : -1;

            v3UnitUp = new THREE.Vector3(0,0,-100.0);

            if (pointerLeft) {
                // Touch Controller pointer already on!
            } else {
                pointerLeft = drawPointer(v3Origin, v3UnitUp);
                controllerLeft.add(pointerLeft);
            }
        } else {
            if (pointerLeft) {
                controllerLeft.remove(pointerLeft);
            }
            pointerLeft = null;
        }

        if(controllerRight.getButtonState('grips')) {
            pointedNodeIdx = (closestNodeDistanceRight < 2.0) ? closestNodeIndexRight : -1;

            v3UnitUp = new THREE.Vector3(0,0,-100.0);

            if (pointerRight) {
                // Touch Controller pointer already on!
            } else {
                pointerRight = drawPointer(v3Origin, v3UnitUp);
                controllerRight.add(pointerRight);
            }
        } else {
            if (pointerRight) {
                controllerRight.remove(pointerRight);
            }
            pointerRight = null;
        }

        onControllerMove(controllerLeft);
        if (!pointedObject)
            onControllerMove(controllerRight);
    };

    // draw a pointing line
    var drawPointer = function (start, end) {
        var material = new THREE.LineBasicMaterial();
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            start,
            end
        );
        return new THREE.Line(geometry, material);
    };

    // initialize scene: init 3js scene, canvas, renderer and camera; add axis and light to the scene
    var initScene = function () {
        renderer.setSize(canvas.clientWidth, window.innerHeight);
        canvas.appendChild(renderer.domElement);
        raycaster = new THREE.Raycaster();
        camera.position.z = 50;

        brain = new THREE.Group();
        // brain.position.z = -50.0;
        scene.add(brain);

        //Adding light
        scene.add( new THREE.HemisphereLight(0x606060, 0x080820, 1.5));
        scene.add( new THREE.AmbientLight(0x606060, 1.5));
        var light = new THREE.PointLight( 0xffffff, 1.0, 10000 );
        light.position.set( 1000, 1000, 100 );
        scene.add(light);

        var axisHelper = new THREE.AxisHelper( 5 );
        scene.add( axisHelper );
    };

    this.resetCamera = function () {
        camera.position.x = 50;
        camera.position.y = 50;
        camera.position.z = 50;
    };

    this.resetBrainPosition = function () {
        brain.scale = new THREE.Vector3(1,1,1);
        brain.position = new THREE.Vector3(0,0,0);
        brain.matrixWorldNeedsUpdate = true;
    };

    // create 3js elements: scene, canvas, camera and controls; and init them and add skybox to the scene
    this.createCanvas = function() {
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({antialias: true});
        camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / window.innerHeight, 0.1, 3000);
        initScene();
        controls = new THREE.TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 0.5;
        addSkybox();
    };

    // initialize scene: init 3js scene, canvas, renderer and camera; add axis and light to the scene
    this.setEventListeners = function (onMouseDown, onMouseUp, onDocumentMouseMove) {
        canvas.addEventListener('mousedown', onMouseDown, true);
        canvas.addEventListener('mouseup', function (e) { onMouseUp(model, e);});
        canvas.addEventListener('mousemove', function (e) { onDocumentMouseMove(model, e); }, true);
    };

    // update geometry of node
    this.updateNodeGeometry = function (nodeIndex, geometry) {
        glyphs[nodeIndex].geometry = geometry;
    };

    // update node color
    this.updateNodeColor = function (nodeIndex, color) {
        glyphs[nodeIndex].material.color = color;
    };

    var removeNodesFromScene = function () {
        for (var i=0; i < glyphs.length; ++i){
            brain.remove(glyphs[i]);
            delete glyphNodeDictionary[glyphs[i].uuid];
        }
        glyphs = [];
    };

    this.removeEdgesFromScene = function () {
        for(var i=0; i < displayedEdges.length; ++i){
            brain.remove(displayedEdges[i]);
        }
        displayedEdges = [];

        this.removeShortestPathEdgesFromScene();
    };

    this.removeShortestPathEdgesFromScene = function () {
        for(var i=0; i < shortestPathEdges.length; i++){
            brain.remove(shortestPathEdges[i]);
        }
        shortestPathEdges = [];
    };

    this.animate = function () {
        controls.update();
        renderer.render(scene, camera);
    };

    this.requestAnimate = function (animate) {
        effect.requestAnimationFrame(animate);
    };

    this.animateVR = function () {
        if (enableVR && activeVR) {
            controllerLeft.update();
            controllerRight.update();

            scanOculusTouch();

            oculusControl.update();
            effect.render(scene, camera);
        }
    };

    // clear scene
    this.clearScene = function () {
        removeNodesFromScene();
        this.removeEdgesFromScene();
    };

    this.drawScene = function () {
        if (spt)
            this.updateShortestPathEdges();
        this.drawRegions();
        this.drawConnections();
    };

    this.redrawNodes = function () {
        removeNodesFromScene();
        this.drawRegions();
    };

    this.redrawEdges = function () {
        this.removeEdgesFromScene();
        if (spt)
            this.updateShortestPathEdges();
        this.drawConnections();
    };

    // determine if a region should be drawn
    var shouldDrawRegion = function (region) {
        return (model.isRegionActive(region.group) && atlas.getLabelVisibility(region.label));
    };

    // updating scenes: redrawing glyphs and displayed edges
    this.updateScene = function (){
        this.clearScene();
        this.drawScene();
    };

    // draw the brain regions as glyphs (the edges)
    this.drawRegions = function () {
        var dataset = model.getDataset();
        var material;
        var geometry = new THREE.CircleGeometry( 1.0, 10);

        for(var i=0; i < dataset.length; i++){
            glyphs[i] = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
            if(shouldDrawRegion(dataset[i])) {
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
                    brain.add(glyphs[i]);
                }
            }
            glyphs[i].userData.hemisphere = dataset[i].hemisphere;
        }
    };

    // draw all connections between the selected nodes, needs the connection matrix.
    // don't draw edges belonging to inactive nodes
    this.drawConnections = function () {
        var nodeIdx;
        for(var i= 0; i < nodesSelected.length; i++){
            nodeIdx = nodesSelected[i];
            // draw only edges belonging to active nodes
            if(model.isRegionActive(model.getGroupNameByNodeIndex(nodeIdx))) {
                // two ways to draw edges
                if(thresholdModality) {
                    // 1) filter edges according to threshold
                    this.drawEdgesGivenNode(nodeIdx);
                } else {
                    // 2) draw top n edges connected to the selected node
                    this.drawTopNEdgesByNode(nodeIdx, model.getNumberOfEdges());
                }
            }
        }

        // draw all edges belonging to the shortest path array
        for(i=0; i < shortestPathEdges.length; i++){
            displayedEdges[displayedEdges.length] = shortestPathEdges[i];
            brain.add(shortestPathEdges[i]);
        }

        // setEdgesColor();
    };

    // skew the color distribution according to the nodes strength
    var computeColorGradient = function (c1, c2, n, p) {
        var gradient = new Float32Array( n * 3 );
        var p1 = p; var p2 = 1-p1;
        for (var i = 0; i < n; ++i) {
            // skew the color distribution according to the nodes strength
            var r = i/(n-1);
            var rr = (r*r*(p2-0.5) + r*(0.5-p2*p2))/(p1*p2);
            gradient[ i * 3 ] = c2.r + (c1.r - c2.r)*rr;
            gradient[ i * 3 + 1 ] = c2.g + (c1.g - c2.g)*rr;
            gradient[ i * 3 + 2 ] = c2.b + (c1.b - c2.b)*rr
        }
        return gradient;
    };

    // set the color of displayed edges
    this.updateEdgeColors = function () {
        var edge, c1, c2;
        for(var i = 0; i < displayedEdges.length; i++){
            edge = displayedEdges[i];
            c1 = glyphs[edge.nodes[0]].material.color;
            c2 = glyphs[edge.nodes[1]].material.color;
            edge.geometry.addAttribute( 'color', new THREE.BufferAttribute( computeColorGradient(c1,c2,edge.nPoints, edge.p1), 3 ) );
        }

        for(i = 0; i < shortestPathEdges.length; i++){
            edge = displayedEdges[i];
            c1 = glyphs[edge.nodes[0]].material.color;
            c2 = glyphs[edge.nodes[1]].material.color;
            edge.geometry.addAttribute( 'color', new THREE.BufferAttribute( computeColorGradient(c1,c2,edge.nPoints, edge.p1), 3 ) );
        }
    };

    this.updateEdgeOpacity = function (opacity) {
        edgeOpacity = opacity;
        for(var i = 0; i < displayedEdges.length; i++){
            displayedEdges[i].material.opacity = opacity;
        }
    };

    // create a line using start and end points and give it a name
    // TODO use this to allow different line sizes
    // https://github.com/spite/THREE.MeshLine#create-a-threemeshline-and-assign-the-geometry
    // geometry.vertices.push(end);
    // var line = new THREE.MeshLine();
    // line.setGeometry( geometry );
    // material = new THREE.MeshLineMaterial();
    // var mesh  = new THREE.Mesh(line.geometry, material);
    var createLine = function(edge, ownerNode, nodes){
        var material = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: edgeOpacity,
            vertexColors: THREE.VertexColors
            // Due to limitations in the ANGLE layer on Windows platforms linewidth will always be 1.
        });

        var geometry = new THREE.BufferGeometry();
        var n = edge.length;

        var positions = new Float32Array( n * 3 );
        for (var i = 0; i < n; i++) {
            positions[ i * 3 ] = edge[i].x;
            positions[ i * 3 + 1 ] = edge[i].y;
            positions[ i * 3 + 2 ] = edge[i].z;
        }
        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

        var s1 = model.getNodalStrength(nodes[0]), s2 = model.getNodalStrength(nodes[1]);
        var p1 = s1/(s1+s2);
        var c1 = new THREE.Color(scaleColorGroup(model, model.getGroupNameByNodeIndex(nodes[0]), nodes[0])),// glyphs[nodes[0]].material.color,
            c2 = new THREE.Color(scaleColorGroup(model, model.getGroupNameByNodeIndex(nodes[1]), nodes[1]));// glyphs[nodes[1]].material.color;
        geometry.addAttribute( 'color', new THREE.BufferAttribute( computeColorGradient(c1,c2,n,p1), 3 ) );

        // geometry.colors = colorGradient;
        var line  = new THREE.Line(geometry, material);
        line.name = ownerNode;
        line.nPoints = n;
        line.nodes = nodes;
        line.p1 = p1;
        return line;
    };

    var drawEdgeWithName = function (edge, ownerNode, nodes) {
        var line = createLine(edge, ownerNode, nodes);
        brain.add(line);
        return line;
    };

    // draw the top n edges connected to a specific node
    this.drawTopNEdgesByNode = function (nodeIndex, n) {

        var row = model.getTopConnectionsByNode(nodeIndex, n);
        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        if (enableEB) {
            model.performEBOnNode(nodeIndex);
        }
        for (var i in row) {
            if ((nodeIndex != row[i]) && model.isRegionActive(model.getGroupNameByNodeIndex(i)) && visibleNodes[i]) {
                displayedEdges[displayedEdges.length] = drawEdgeWithName(edges[edgeIdx[nodeIndex][row[i]]], nodeIndex, [nodeIndex, row[i]]);
            }
        }

        // setEdgesColor();
    };

    // draw edges given a node following edge threshold
    this.drawEdgesGivenNode = function(indexNode) {

        var row = model.getConnectionMatrixRow(indexNode);
        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        if (enableEB) {
            model.performEBOnNode(indexNode);
        }

        for(var i=0; i < row.length ; i++){
            if((i != indexNode) && row[i] > model.getThreshold()  && model.isRegionActive(model.getGroupNameByNodeIndex(i)) && visibleNodes[i]) {
                displayedEdges[displayedEdges.length] = drawEdgeWithName(edges[edgeIdx[indexNode][i]], indexNode, [indexNode, i]);
            }
        }
        // setEdgesColor();
    };

    // give a specific node index, remove all edges from a specific node in a specific scene
    this.removeEdgesGivenNode = function(indexNode) {
        var l = displayedEdges.length;

        // keep a list of removed edges indexes
        var removedEdges = [];
        for(var i=0; i < l; i++){
            var edge = displayedEdges[i];
            //removing only the edges that starts from that node
            if(edge.name == indexNode && shortestPathEdges.indexOf(edge) == -1){
                removedEdges[removedEdges.length] = i;
                brain.remove(edge);
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
        displayedEdges = updatedDisplayEdges;
    };

    // draw skybox from images
    var addSkybox = function(){
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
    this.setSkyboxVisibility = function(visible){
        var results = scene.children.filter(function(d) {return d.name == "skybox"});
        var skybox = results[0];
        skybox.visible = visible;
    };

    // draw a selected node in both scenes
    this.drawSelectedNode = function (nodeIndex, hemisphere) {
        // if node not selected, draw the edges connected to it and add it to selected nodes
        if(nodesSelected.indexOf(nodeIndex) == -1) {
            nodesSelected[nodesSelected.length] = nodeIndex;
        }
        glyphs[nodeIndex].geometry = createSelectedGeometry(hemisphere);
    };

    // get intersected object beneath the mouse pointer
    // detects which scene: left or right
    // return undefined if no object was found
    this.getIntersectedObject = function(vector) {
        raycaster.setFromCamera(vector, camera);
        var objectsIntersected = raycaster.intersectObjects( glyphs );
        return (objectsIntersected[0])?  objectsIntersected[0] : undefined;
    };

    // callback when window is resized
    this.resizeScene = function(){
        camera.aspect = window.innerWidth/2.0 / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth/2.0, window.innerHeight);
    };

    // compute shortest path info for a node
    this.computeShortestPathForNode = function(nodeIndex) {
        console.log("Compute Shortest Path for node " + nodeIndex);
        root = nodeIndex;
        model.computeShortestPathDistances(nodeIndex);
    };

    // draw shortest path from root node up to a number of hops
    this.updateShortestPathBasedOnHops = function () {
        var hops = model.getNumberOfHops();
        var hierarchy = model.getHierarchy(root);
        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        var previousMap = model.getPreviousMap();

        this.removeShortestPathEdgesFromScene();

        for(var i = 0; i < hierarchy.length; ++i) {
            if( i < hops + 1 ) {
                //Visible node branch
                for(var j=0; j < hierarchy[i].length; j++){
                    visibleNodes[hierarchy[i][j]] = true;
                    var prev = previousMap[hierarchy[i][j]];
                    if(prev){
                        shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][hierarchy[i][j]]] , prev, [prev, i]);
                    }
                }
            } else {
                for(var j=0; j < hierarchy[i].length; ++j){
                    visibleNodes[hierarchy[i][j]] = false;
                }
            }
        }
    };

    this.updateShortestPathBasedOnDistance = function () {
        nodesSelected = [];
        this.removeShortestPathEdgesFromScene();

        // show only nodes with shortest paths distance less than a threshold
        var threshold = model.getDistanceThreshold()/100.*model.getMaximumDistance();
        var distanceArray = model.getDistanceArray();
        for(var i=0; i < visibleNodes.length; i++){
            visibleNodes[i] = (distanceArray[i] <= threshold);
        }

        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        var previousMap = model.getPreviousMap();

        for(i=0; i < visibleNodes.length; ++i) {
            if(visibleNodes[i]){
                var prev = previousMap[i];
                if(prev) {
                    shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][i]], prev, [prev, i]);
                }
            }
        }
    };

    this.updateShortestPathEdges = function () {
        switch (shortestPathVisMethod) {
            case (SHORTEST_DISTANCE):
                    this.updateShortestPathBasedOnDistance();
                break;
            case (NUMBER_HOPS):
                    this.updateShortestPathBasedOnHops();
                break;
        }
    };

    // prepares the shortest path from a = root to node b
    this.getShortestPathFromRootToNode = function(target) {
        this.removeShortestPathEdgesFromScene();

        var i = target;
        var prev;
        var edges = model.getActiveEdges();
        var edgeIdx = model.getEdgesIndeces();
        var previousMap = model.getPreviousMap();

        visibleNodes.fill(true);
        while(previousMap[i]!= null){
            prev = previousMap[i];
            visibleNodes[prev] = true;
            shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][i]], prev, [prev, i] );
            i = prev;
        }

        removeNodesFromScene();
        this.drawRegions();
        this.drawConnections();
    };

    // get intersected object pointed to by Vive/Touch Controller pointer
    // return undefined if no object was found
    var getPointedObject = function(controller) {

        var gamePad = controller.getGamepad();
        if (gamePad) {
            var orientation = new THREE.Quaternion().fromArray(gamePad.pose.orientation);
            var v3orientation = new THREE.Vector3(0,0,-1.0);
            v3orientation.applyQuaternion(orientation);
            var ray = new THREE.Raycaster(controller.position, v3orientation);
            var objectsIntersected = ray.intersectObjects(glyphs);
            if (objectsIntersected[0]) {
                return objectsIntersected[0];
            }
        }
        return undefined;
    };
}