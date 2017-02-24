/**
 * Created by Johnson on 2/15/2017.
 */

function PreviewArea(canvas_, model_) {
    var model = model_;
    var canvas = canvas_;
    var camera = null, renderer = null, controls = null, scene = null;

    // VR stuff
    var oculusControl = null, effect = null;
    var controllerLeft = null, controllerRight = null;
    var enableVR = false;
    var activeVR = false;
    // nodes and edges
    var glyphs = [];
    var displayedEdges = [];
    // shortest path
    var shortestPathEdges = [];

    var edgeOpacity = 1.0;

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

            scene.add(controllerLeft);
            scene.add(controllerRight);
        } );
        console.log("Init Oculus Touch done")
    };

    // initialize scene: init 3js scene, canvas, renderer and camera; add axis and light to the scene
    var initScene = function () {
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
            scene.remove(glyphs[i]);
            delete glyphNodeDictionary[glyphs[i].uuid];
        }
        glyphs = [];
    };

    this.removeEdgesFromScene = function () {
        for(var i=0; i < displayedEdges.length; ++i){
            scene.remove(displayedEdges[i]);
        }
        displayedEdges = [];

        this.removeShortestPathEdgesFromScene();
    };

    this.removeShortestPathEdgesFromScene = function () {
        for(var i=0; i < shortestPathEdges.length; i++){
            scene.remove(shortestPathEdges[i]);
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
            oculusControl.update();
            effect.render(scene, camera);

            controllerLeft.update();
            controllerRight.update();
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
        return (model.isRegionActive(region.group) && model.getLabelVisibility(region.label));
    };

    // updating scenes: redrawing glyphs and displayed edges
    this.updateScene = function (){
        this.clearScene();
        this.drawScene();
    };

    // draw the brain regions as glyphs (the edges)
    this.drawRegions = function () {
        var dataset = model.getDataset();
        var l = dataset.length;

        var material;
        var geometry = new THREE.CircleGeometry( 1.0, 10);

        for(var i=0; i < l; i++){
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
                    scene.add(glyphs[i]);
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
            if(model.isRegionActive(model.getRegionByNode(nodeIdx))) {
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
            scene.add(shortestPathEdges[i]);
        }

        // setEdgesColor();
    };

    // set the color and thickness of displayed edges
    this.setEdgesColor = function () {

        for(var i = 0; i < displayedEdges.length; i++){
            // displayedEdges[i].material.color = 0xff0000;
        }

        // updateEdgeLegend();
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
    var createLine = function(edge, ownerNode){
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

    var drawEdgeWithName = function (edge, ownerNode) {
        var line = createLine(edge, ownerNode);
        scene.add(line);
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
            if ((nodeIndex != row[i]) && model.isRegionActive(model.getRegionByNode(i)) && visibleNodes[i]) {
                displayedEdges[displayedEdges.length] = drawEdgeWithName(edges[edgeIdx[nodeIndex][row[i]]], nodeIndex);
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
            if((i != indexNode) && row[i] > model.getThreshold()  && model.isRegionActive(model.getRegionByNode(i)) && visibleNodes[i]) {
                displayedEdges[displayedEdges.length] = drawEdgeWithName(edges[edgeIdx[indexNode][i]], indexNode);
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

        vector = vector.unproject( camera );

        var ray = new THREE.Raycaster( camera.position,
            vector.sub( camera.position ).normalize() );

        var objectsIntersected = ray.intersectObjects( glyphs );

        if(objectsIntersected[0]){
            return objectsIntersected[0];
        }

        return undefined;
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
                        shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][hierarchy[i][j]]] , prev);
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
                    shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][i]] , prev);
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
            shortestPathEdges[shortestPathEdges.length] = createLine(edges[edgeIdx[prev][i]], prev );
            i = prev;
        }

        removeNodesFromScene();
        this.drawRegions();
        this.drawConnections();
    };
}