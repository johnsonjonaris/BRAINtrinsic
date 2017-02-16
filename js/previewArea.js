/**
 * Created by Johnson on 2/15/2017.
 */

function PreviewArea(canvas_, model_) {
    var camera = null;
    var canvas = canvas_;
    var renderer = null;
    var controls = null;
    var scene = null;
    var glyphs = [];
    var model = model_;

    var oculusControl = null;
    var effect = null;
    var controllerLeft = null, controllerRight = null;
    var enableVR = false;
    var activeVR = false;

    var displayedEdges = [];
    var shortestPathEdges = [];
    var edgeOpacity = 1.0;

    var thresholdModality = true;

    this.activateVR = function (activate) {
        activeVR = activate;
        if (activeVR)
            effect.requestPresent();
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

        // initOculusTouch();
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
        } );
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
        canvas = document.getElementById('canvasLeft');
        renderer = new THREE.WebGLRenderer({antialias: true});
        camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / window.innerHeight, 0.1, 3000);
        initScene();
        controls = new THREE.TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 0.5;
        addSkybox();
    };

    // initialize scene: init 3js scene, canvas, renderer and camera; add axis and light to the scene
    this.setEventListeners = function (onDblClick, onMouseDown, onMouseUp, onDocumentMouseMove) {

        canvas.addEventListener('dblclick', onDblClick, true);
        canvas.addEventListener('mousedown', function (e) {
            onMouseDown(model, e);
        }, true);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mousemove', function (e) {
            onDocumentMouseMove(model, e);
        }, true);
    };

    // update geometry of node
    this.updateNodeGeometry = function (nodeIndex, geometry) {
        glyphs[nodeIndex].geometry = geometry;
    };

    // update node color
    this.updateNodeColor = function (nodeIndex, color) {
        glyphs[nodeIndex].material.color = color;
    };

    this.removeNodesFromScene = function (glyphNodeDictionary) {
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
    };

    this.animate = function () {
        if (enableVR && activeVR) {
            effect.requestAnimationFrame(animate);
        } else {
            requestAnimationFrame(animate);
            controls.update();
        }
        if (enableVR && activeVR) {
            oculusControl.update();
        }
        render();
    };

    var render = function () {
        if (enableVR)
            effect.render(scene, camera);
        else
            renderer.render(scene, camera);
    };

    // determine if a region should be drawn
    var shouldDrawRegion = function(region) {
        return (model.isRegionActive(region.group) && model.getLabelVisibility(region.label));
    };

    // updating scenes: redrawing glyphs and displayed edges
    this.updateScene = function(glyphNodeDictionary){
        removeNodesFromScene();
        removeEdgesFromScene();

        drawRegions(glyphNodeDictionary);
        drawConnections();
    };

    // draw the brain regions as glyphs (the edges)
    this.drawRegions = function(glyphNodeDictionary) {
        var dataset = model.getDataset();
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

        // setEdgesColor(displayedEdges);
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
        // setEdgesColor(displayedEdges);
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
    this.drawSelectedNode = function (nodeIndex, mesh) {
        // if node not selected, draw the edges connected to it and add it to selected nodes
        if(nodesSelected.indexOf(nodeIndex) == -1) {
            nodesSelected[nodesSelected.length] = nodeIndex;
        }
        glyphs[nodeIndex].geometry = createSelectedGeometry(mesh.userData['hemisphere']);
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
        this.animate();
    };
}