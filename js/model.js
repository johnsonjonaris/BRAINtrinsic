/**
 * Created by giorgioconte on 31/01/15.
 */
/*
private variables
 */

function Model () {
    var groups = [];                    // contain nodes group affiliation according to Anatomy, place, rich club, id
    var activeGroup = 0;                // 0 = Anatomy, 1 = place, 2 = rich club, 3 = id
    var regionsActivated = [];          // store the group activation boolean according to activeGroup
    var regionState = {};               // group state: active, transparent or inactive
    var labelKeys;                      // map between each node and its corresponding FSL label
    var labelVisibility = [];           // contains FSL label name, visibility and hemisphere
    var lookUpTable = [];               // contains FSL label group name, rich club, name and hemisphere
    var icColorTable = [];

    var centroids = [];                 // nodes centroids according to topological spaces: centroids[node][technique] = (x,y,z)
    var activeCentroids = "isomap";     // isomap, MDS, anatomy, tsne, PLACE, selection from centroids

    var connectionMatrix = [];          // adjacency matrix
    var distanceMatrix = [];            // contains the distance matrix of the model: 1/(adjacency matrix)

    var distanceArray;                  // contain the shortest path for current selected node
    var distanceThreshold;              // threshold for the distanceArray
    var threshold;                      // threshold for the edge value
    var numberOfEdges = 5;              // threshold the number of edges for shortest paths
    var numberOfHops;

    var graph;

    var metricValues = [];

    var placeClusters = [];             // PLACE clusters, assumed level 4: clusters from 1 to 16
    var placeLevel = 4;                 // default place level
    var placeRadius = 5;                // sphere radius of PLACE visualization

    // data ready in model ready
    this.ready = function() {
        return (lookUpTable && labelKeys && centroids && connectionMatrix);
    };

    // set the iso center color table ???
    this.setICColor = function(icData) {
        icColorTable = icData.data;
    };

    // set distanceArray containing the shortest path for current selected node
    this.setDistanceArray = function(array) {
        distanceArray = array;
    };

    // get the longest shortest path of the current selected node = the farthest node
    this.getMaximumDistance = function() {
        return d3.max(distanceArray);
    };

    // store map between each node and its corresponding FSL label
    this.setLabelKeys = function(labels) {
        labelKeys = math.squeeze(labels.data);
    };

    // setting activeGroup: 0 = Anatomy, 1 = place, 2 = rich club, 3 = id
    this.setActiveGroup = function(group) {
        activeGroup = group;
    };

    // isomap, MDS, anatomy, tsne, selection from centroids
    this.setActiveCentroids = function(centroids) {
        activeCentroids = centroids;
    };

    // store nodes centroids according to topological spaces
    // technique can be: Isomap, MDS, tSNE, anatomy ...
    this.setCentroids = function(d, technique) {
        var data = d.data;
        var len = data.length;
        centroids[technique] = [];
        for (var i = 0; i < len; i++) {
            var element = {};
            element.x = data[i][0];
            element.y = data[i][1];
            element.z = data[i][2];
            centroids[technique][i] = element;
        }
    };

    // set shortest path distance threshold and update GUI
    this.setDistanceThreshold = function(dt) {
        if (document.getElementById("distanceThresholdOutput")) {
            var percentage = dt / this.getMaximumDistance() * 100;
            var value = Math.floor(percentage * 100) / 100;
            document.getElementById("distanceThresholdOutput").value = value + " %";
        }
        distanceThreshold = dt;
    };

    // get shortest path distance threshold
    this.getDistanceThreshold = function() {
        return distanceThreshold;
    };

    // store edge threshold and update GUI
    this.setThreshold = function(t) {
        threshold = t;
    };

    // get edge threshold
    this.getThreshold = function() {
        return threshold;
    };

    // set the look up table filling lookUpTable and labelVisibility
    // from loaded data for each FSL node label
    // for each label, d contains: label#, group, place, rich_club, region_name, hemisphere
    this.setLookUpTable = function(d) {
        var i, el;

        for (i = 0; i < d.data.length; i++) {
            el = {
                "group": d.data[i].group,
                "place": d.data[i].place,
                "rich_club": d.data[i].rich_club,
                "region_name": d.data[i].region_name,
                "hemisphere": d.data[i].hemisphere
            };

            lookUpTable[d.data[i].label] = el;
            var labelInfo = [];
            labelInfo['name'] = d.data[i].region_name;
            labelInfo['visibility'] = true;
            labelInfo['hemisphere'] = d.data[i].hemisphere;
            labelVisibility[d.data[i].label] = labelInfo;
        }
    };

    // set connection matrix
    this.setConnectionMatrix = function(d) {
        connectionMatrix = d.data;
        this.computeDistanceMatrix();
    };

    // add group data
    this.setGroup = function(d) {
        groups[groups.length] = d.data;
    };

    // get the dataset according to activeCentroids
    this.getDataset = function() {
        var row;
        var arrayLength = labelKeys.length;
        //var index;
        var result = [];

        for (var i = 0; i < arrayLength; i++) {
            row = {};

            //getting Centroids
            row.x = centroids[activeCentroids][i].x;
            row.y = centroids[activeCentroids][i].y;
            row.z = centroids[activeCentroids][i].z;

            var label = labelKeys[i];

            row.name = lookUpTable[label].region_name;
            row.group = groups[activeGroup][i];
            row.hemisphere = lookUpTable[label].hemisphere;
            row.label = labelKeys[i];
            result[i] = row;
        }
        return result;
    };

    // return the group affiliation of every node according to activeGroup
    this.getActiveGroup = function() {
        var l = groups[activeGroup].length;
        var results = [];
        for (var i = 0; i < l; i++) {
            var element = groups[activeGroup][i];
            if (results.indexOf(element) == -1) {
                results[results.length] = element;
            }
        }
        return results;
    };

    // get connection matrix according to activeMatrix
    this.getConnectionMatrix = function() {
        return connectionMatrix;
    };

    // get a row (one node) from connection matrix
    this.getConnectionMatrixRow = function (index) {
        var row = [];
        for (var i = 0; i < connectionMatrix.length; i++) {
            row[row.length] = connectionMatrix[index][i];
        }
        return row;
    };

    // get the group of a specific node according to activeGroup
    this.getRegionByNode = function (nodeIndex) {
        return groups[activeGroup][nodeIndex];
    };

    // return if a specific region is activated
    this.isRegionActive = function(region) {
        return regionsActivated[region];
    };

    // toggle a specific region in order: active, transparent, inactive
    // set activation to false if inactive
    this.toggleRegion = function(regionName) {
        switch (regionState[regionName]) {
            case 'active':
                regionState[regionName] = 'transparent';
                regionsActivated[regionName] = true;
                break;
            case 'transparent':
                regionState[regionName] = 'inactive';
                regionsActivated[regionName] = false;
                break;
            case 'inactive':
                regionState[regionName] = 'active';
                regionsActivated[regionName] = true;
                break;
        }
        updateScenes();
    };

    // get region state using its name
    this.getRegionState = function(regionName) {
        return regionState[regionName];
    };

    this.getRegionActivation = function(regionName) {
        return regionsActivated[regionName];
    };

    // set all regions active
    this.setRegionsActivated = function() {
        regionsActivated = {};
        regionState = {};

        var l = groups[activeGroup].length;
        for (var i = 0; i < l; i++) {
            var element = groups[activeGroup][i];
            regionsActivated[element] = true;
            regionState[element] = 'active';
        }
    };

    // get the connection matrix number of nodes
    this.getConnectionMatrixDimension = function () {
        return connectionMatrix.length;
    };

    // get top n edges connected to a specific node
    this.getTopConnectionsByNode = function(indexNode, n) {
        var row = this.getConnectionMatrixRow(indexNode);
        var sortedRow = row.sort(function (a, b) {
            return b - a
        }); //sort in a descending flavor
        var res = {};
        var val;
        for (var i = 0; i < n; i++) {
            val = sortedRow[i];
            res[row.indexOf(val)] = val;
        }
        return res;
    };

    this.getMaximumWeight = function () {
        return d3.max(connectionMatrix, function (d) {
            return d3.max(d, function (d) { return d; })
        });
    };

    this.getNumberOfEdges = function() {
        return numberOfEdges;
    };

    this.setNumberOfEdges = function(n) {
        if (document.getElementById("topNThresholdSliderOutput")) {
            document.getElementById("topNThresholdSliderOutput").value = n;
        }
        numberOfEdges = n;
    };

    // create groups in order: Anatomy, place, rich club, id
    this.createGroups = function() {
        console.log("create groups");
        var anatomicalGroup = [];
        var richClubGroup = [];
        var placeGroup = [];
        var icGroup = [];

        for (var i = 0; i < labelKeys.length; i++) {
            var labelKey = labelKeys[i];
            anatomicalGroup[anatomicalGroup.length] = lookUpTable[labelKey].group;
            placeGroup[placeGroup.length] = lookUpTable[labelKey].place;
            richClubGroup[richClubGroup.length] = lookUpTable[labelKey].rich_club;
            icGroup[icGroup.length] = i;
        }
        groups[groups.length] = anatomicalGroup;
        groups[groups.length] = placeGroup;
        groups[groups.length] = richClubGroup;
        groups[groups.length] = icGroup;
    };

    // get the region name of a specific node (edge)
    this.getRegionNameByIndex = function (index) {
        return lookUpTable[labelKeys[index]].region_name;
    };

    this.setNumberOfHops = function(hops) {
        numberOfHops = hops;
        if (document.getElementById("numberOfHopsOutput")) {
            document.getElementById("numberOfHopsOutput").value = hops;
        }
    };


    this.getNumberOfHops = function () {
        return numberOfHops;
    };

    // get the label visibility
    this.getLabelVisibility = function(label) {
        return labelVisibility[label]['visibility'];
    };

    // set the label visibility: label is an index, visibility is boolean
    this.setLabelVisibility = function(label, visibility) {
        if (labelVisibility[label] != undefined)
            labelVisibility[label]['visibility'] = visibility;
        else {
            console.log("It isn't possible to set visibility of the label");
        }
    };

    this.setMetricValues = function(data) {
        metricValues = data.data;

        metricQuantileScale = d3.scale.quantile()
            .domain(metricValues)
            .range(['#000080', '#0000c7', '#0001ff', '#0041ff', '#0081ff', '#00c1ff', '#16ffe1', '#49ffad',
                '#7dff7a', '#b1ff46', '#e4ff13', '#ffd000', '#ff9400', '#ff5900', '#ff1e00', '#c40000']);

        console.log("loaded metric file");
    };

// Jet colormap
//'#000080','#0000c7','#0001ff','#0041ff','#0081ff','#00c1ff','#16ffe1','#49ffad','#7dff7a',
// '#b1ff46','#e4ff13','#ffd000','#ff9400','#ff5900','#ff1e00','#c40000'

// Mine colormap
//'#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'

    /* BCT Stuff*/
    // compute nodal strength of a specific node given its row
    this.computeNodalStrength = function(connectionRow) {
        return d3.sum(connectionRow);
    };

    // compute distance matrix = 1/(adjacency matrix)
    this.computeDistanceMatrix = function() {
        distanceMatrix = [];
        var adjacencyMatrix = this.getConnectionMatrix();
        graph = new Graph();
        // for every node, add the distance to all other nodes
        for(var i = 0; i < adjacencyMatrix.length; i++){
            var vertexes = {};
            var row = [];
            for(var j = 0; j < adjacencyMatrix[i].length; j++){
                vertexes[j] = 1/adjacencyMatrix[i][j];
                row[row.length] = 1/adjacencyMatrix[i][j];
            }
            distanceMatrix[distanceMatrix.length] = row;
            graph.addVertex(i,vertexes);
        }
        console.log("Distance Matrix Computed");
    };

    // compute shortest path from a specific node to the rest of the nodes
    this.computeShortestPathDistances = function(rootNode) {
        console.log("computing spt");
        return graph.shortestPath(String(rootNode));
    };

    this.computeNodesLocationForPlace = function() {
        var platonic = new Platonics();
        switch (placeLevel) {
            case 1:
                platonic.createTetrahedron();
                break;
            case 2:
                platonic.createCube();
                break;
            case 3:
                platonic.createDodecahedron();
                break;
            case 4:
                platonic.createIcosahedron();
                break;
        }
        // use one of the faces to compute primary variables
        var face = platonic.getFace(0);
        var coneAxis = math.mean(face,0);
        coneAxis = math.divide(coneAxis, math.norm(coneAxis));
        var theta = Math.abs( Math.acos(math.dot(coneAxis, face[0]) ));
        var coneAngle = theta*0.6;
        var coneR = placeRadius*Math.sin(coneAngle/2);
        var coneH = placeRadius*Math.cos(coneAngle/2);
        var v1 = [], v2 = [], center = [];
        var totalNNodes = placeClusters[0].length;
        var centroids = [];
        centroids.data = new Array(totalNNodes);
        var level = placeLevel-1;
        var nClusters = Math.pow(2, placeLevel);

        for (var i = 0; i < nClusters; i++) {
            var clusterIdx = [];
            for (var s = 0; s < totalNNodes; s++) {
                if (placeClusters[level][s] == (i+1)) clusterIdx.push(s);
            }
            var nNodes = clusterIdx.length;
            face = platonic.getFace(i);
            coneAxis = math.mean(face,0);
            coneAxis = math.divide(coneAxis, math.norm(coneAxis));
            v1 = math.subtract(face[0], face[1]);
            v1 = math.divide(v1, math.norm(v1));
            v2 = math.cross(coneAxis, v1);
            center = math.multiply(coneH, coneAxis);
            var points = sunflower(nNodes, coneR, center, v1, v2);
            // normalize and store
            for (var k = 0; k < nNodes; k++) {
                centroids.data[clusterIdx[k]] = math.multiply(placeRadius, math.divide(points[k], math.norm(points[k])));
            }
        }
        this.setCentroids(centroids, 'PLACE');
    };

    // assume last level = 4 => 16 clusters at most
    this.setPlace = function(clusters) {
        placeClusters = new Array(4); // 4 levels
        placeClusters[3] = math.squeeze(clusters.data);
        for (var i = 2; i >= 0; i--) {
            placeClusters[i] =  math.ceil(math.divide(placeClusters[i+1],2.0));
        }
        this.computeNodesLocationForPlace();
        this.performEBOnNodes();
    };

    this.setPlaceLevel = function(level) {
        if (level == placeLevel){
            return;
        }
        placeLevel = level;
        this.computeNodesLocationForPlace();
    };

    this.setPlaceSphereRadius = function(r) {
        if (r == placeRadius) {
            return;
        }
        placeRadius = r;
        this.computeNodesLocationForPlace();
    };

    this.getPlaceLevel = function() {
        return placeLevel;
    };

    this.performEBOnNodes = function() {
        var edges = [];
        var nNodes = connectionMatrix.length;
        for (var i = 0; i < nNodes; i++) {
            for (var j = i+1; j < nNodes; j++) {
                if (connectionMatrix[i][j] > 0) {
                    edges.push({
                        'source': i,
                        'target': j
                    });
                }
            }
        }
        console.log(edges);
        // var fbundling = d3.ForceEdgeBundling().nodes(centroids["PLACE"]).edges(edges);
        // var results = fbundling();
        // console.log(results);
    }
}

var modelLeft = new Model();
var modelRight = new Model();

