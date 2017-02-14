/**
 * Created by giorgioconte on 31/01/15.
 */
/*
private variables
 */

function Model () {
    var groups = [];                    // contain nodes group affiliation according to Anatomy, place, rich club, id
    var activeGroup = 0;                // 0 = Anatomy, 1 = embeddness, 2 = rich club, 3 = PLACE, 4 = metric
    var regionsActivated = [];          // store the group activation boolean according to activeGroup
    var regionState = {};               // group state: active, transparent or inactive
    var labelKeys;                      // map between each node and its corresponding FSL label
    var labelsLUT = {};                 // contains FSL label name, visibility, group name, rich club, name and hemisphere
    var icColorTable = [];

    var centroids = {};                 // nodes centroids according to topological spaces: centroids[node][technique] = (x,y,z)
    var topologies = [];                // available topologies
    var activeTopology;                 // isomap, MDS, anatomy, tsne, PLACE, selection from centroids
    var nodesDistances = {};            // Euclidean distance between the centroids of all nodes

    var connectionMatrix = [];          // adjacency matrix
    var distanceMatrix = [];            // contains the distance matrix of the model: 1/(adjacency matrix)

    var distanceArray;                  // contain the shortest path for current selected node
    var distanceThreshold;              // threshold for the distanceArray
    var threshold;                      // threshold for the edge value
    var numberOfEdges = 5;              // threshold the number of edges for shortest paths
    var numberOfHops;
    var edges = [];                     // contains the edges per dataType
    var edgeIdx = [];                   // 2D matrix where entries are the corresponding edge index

    var info = { name: '', info: '' };  // information about the subject

    var graph;

    var metricValues = [];

    var clusters = [];                  // PLACE clusters, assumed level 4: clusters from 1 to 16
    var clusteringLevel = 4;            // default PLACE/PACE level
    var clusteringGroupLevel = 4;       // clustering group level used for color coding, 1 to 4
    var clusteringRadius = 5;           // sphere radius of PLACE/PACE visualization

    var fbundling = d3.GPUForceEdgeBundling().cycles(6).iterations(60).enable_keep_programs(true);

    this.clearModel = function () {
        groups = [];
        activeGroup = 0;
        regionsActivated = [];
        regionState = {};
        icColorTable = [];

        centroids = {};
        topologies = [];
        nodesDistances = {};

        connectionMatrix = [];
        distanceMatrix = [];

        edges = [];
        edgeIdx = [];
    };


    // data ready in model ready
    this.ready = function() {
        return (labelsLUT && labelKeys && centroids && connectionMatrix);
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
    this.setLabelKeys = function(data, loc) {
        labelKeys = [];
        // data[0] is assumed to contain a string header
        for (var j = 1; j < data.length; j++) {
            labelKeys.push(data[j][loc]);
        }
    };

    // setting activeGroup: 0 = Anatomy, 1 = place, 2 = rich club, 3 = PLACE, 4 = id
    this.setActiveGroup = function(group) {
        activeGroup = group;
    };

    this.getActiveGroup = function () {
        return activeGroup;
    };

    // create groups in order: Anatomy, place, rich club, id
    this.createGroups = function() {
        console.log("create groups");
        var len = labelKeys.length;
        var anatomicalGroup = new Array(len);
        var richClubGroup = new Array(len);
        var embeddnessGroup = new Array(len);
        //var icGroup = [];

        for (var i = 0; i < len; i++) {
            var labelKey = labelKeys[i];
            anatomicalGroup[i] = labelsLUT[labelKey].group;
            embeddnessGroup[i] = labelsLUT[labelKey].place;
            richClubGroup[i] = labelsLUT[labelKey].rich_club;
            //icGroup[i] = i;
        }
        groups[0] = anatomicalGroup;
        groups[1] = embeddnessGroup;
        groups[2] = richClubGroup;
        //groups[4] = icGroup;

        if (this.hasClusteringData()) {
            groups[3] = clusters[clusteringGroupLevel-1];
        }
    };

    // update the clustering group level, level can be 1 to 4
    this.updateClusteringGroupLevel = function (level) {
        if (this.hasClusteringData()) {
            groups[3] = clusters[level-1];
            clusteringGroupLevel = level;
        }
    };

    // return the group affiliation of every node according to activeGroup
    this.getGroup = function() {
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

    // add group data
    this.setGroup = function (d) {
        groups[groups.length] = d.data;
    };

    // isomap, MDS, anatomy, tsne, selection from centroids
    this.setActiveTopology = function (topology) {
        activeTopology = topology;
    };

    this.getActiveTopology = function () {
        return activeTopology;
    };

    this.computeNodesDistances = function (topology) {
        nodesDistances[topology] = [];
        var cen = centroids[topology];
        var nNodes = cen.length;
        var distances = new Array(nNodes);
        for (var i = 0; i < nNodes; i++) {
            distances[i] = new Array(nNodes);
        }
        for (var i = 0; i < nNodes; i++) {
            for (var j = i; j < nNodes; j++) {
                distances[i][j] = cen[i].distanceTo(cen[j]);
                distances[j][i] = distances[i][j];
            }
        }
        nodesDistances[topology] = distances;
    };

    // store nodes centroids according to topological spaces
    // technique can be: Isomap, MDS, tSNE, anatomy ...
    this.setCentroids = function(d, topology, offset) {
        var data = [];
        // data[0] is assumed to contain a string header
        for (var i = 1; i < d.length; i++) {
            data.push(new THREE.Vector3(d[i][0 + offset], d[i][1 + offset], d[i][2 + offset]));
        }
        centroids[topology] = scaleCentroids(data);
        this.computeNodesDistances(topology);
        this.computeEdgesForTopology(topology);
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

    // set the look up table filling labelsLUT
    // from loaded data for each FSL node label
    // for each label, d contains: label#, group, place, rich_club, region_name, hemisphere
    this.setLookUpTable = function(d) {
        var el;
        for (var i = 0; i < d.data.length; i++) {
            el = d.data[i];
            el.visibility = true;
            labelsLUT[d.data[i].label] = el;
        }
    };

    // set connection matrix
    this.setConnectionMatrix = function(d) {
        connectionMatrix = d.data;
        this.computeDistanceMatrix();
    };

    // get the dataset according to activeCentroids
    this.getDataset = function() {
        var nNodes = labelKeys.length;
        var result = [];

        for (var i = 0; i < nNodes; i++) {
            var label = labelKeys[i];
            result[i] = {
                //getting Centroids
                position: centroids[activeTopology][i],
                name: labelsLUT[label].region_name,
                group: groups[activeGroup][i],
                hemisphere: labelsLUT[label].hemisphere,
                label: label
            };
        }
        return result;
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

    this.getMinimumWeight = function () {
        return d3.min(connectionMatrix, function (d) {
            return d3.min(d, function (d) { return d; })
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

    // get the region name of a specific node (edge)
    this.getRegionNameByIndex = function (index) {
        return labelsLUT[labelKeys[index]].region_name;
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
        return labelsLUT[label]['visibility'];
    };

    // set the label visibility: label is an index, visibility is boolean
    this.setLabelVisibility = function(label, visibility) {
        if (labelsLUT[label] != undefined)
            labelsLUT[label]['visibility'] = visibility;
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
        var adjacencyMatrix = this.getConnectionMatrix();
        var nNodes = adjacencyMatrix.length;
        distanceMatrix = new Array(nNodes);
        graph = new Graph();
        var idx = 0;
        // for every node, add the distance to all other nodes
        for(var i = 0; i < nNodes; i++){
            var vertexes = {};
            var row = new Array(nNodes);
            edgeIdx.push(new Array(nNodes));
            edgeIdx[i].fill(-1); // indicates no connection
            for(var j = 0; j < nNodes; j++){
                vertexes[j] = 1/adjacencyMatrix[i][j];
                row[j] = 1/adjacencyMatrix[i][j];
                if (j > i && Math.abs(adjacencyMatrix[i][j]) > 0) {
                    edgeIdx[i][j] = idx;
                    idx++;
                }
            }
            distanceMatrix[i] = row;
            graph.addVertex(i,vertexes);
        }

        // mirror it
        for(var i = 0; i < nNodes; i++) {
            for(var j = i+1; j < nNodes; j++) {
                edgeIdx[j][i] = edgeIdx[i][j];
            }
        }
        console.log("Distance Matrix Computed");
    };

    // compute shortest path from a specific node to the rest of the nodes
    this.computeShortestPathDistances = function(rootNode) {
        console.log("computing spt");
        return graph.shortestPath(String(rootNode));
    };

    this.computeNodesLocationForClusters = function(topology) {
        var platonic = new Platonics();
        switch (clusteringLevel) {
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
        var coneR = clusteringRadius*Math.sin(coneAngle/2);
        var coneH = clusteringRadius*Math.cos(coneAngle/2);
        var v1 = [], v2 = [], center = [];
        var totalNNodes = clusters[0].length;
        var centroids = new Array(totalNNodes+1);
        var level = clusteringLevel-1;
        var nClusters = Math.pow(2, clusteringLevel);

        for (var i = 0; i < nClusters; i++) {
            var clusterIdx = [];
            for (var s = 0; s < totalNNodes; s++) {
                if (clusters[level][s] == (i+1)) clusterIdx.push(s);
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
                centroids[clusterIdx[k]+1] = math.multiply(clusteringRadius, math.divide(points[k], math.norm(points[k])));
            }
        }
        this.setCentroids(centroids, topology, 0);
    };

    // assume last level = 4 => 16 clusters at most
    this.setClusters = function(data, loc) {
        clusters = new Array(4); // 4 levels
        clusters[3] = [];
        // data[0] is assumed to contain a string header
        for (var j = 1; j < data.length; j++) {
            clusters[3].push(data[j][loc]);
        }
		// placeClusters[3] = math.squeeze(clusters.data);
        for (var i = 2; i >= 0; i--) {
            clusters[i] =  math.ceil(math.divide(clusters[i+1],2.0));
        }
    };

    this.setClusteringLevel = function(level) {
        if (level == clusteringLevel){
            return;
        }
        clusteringLevel = level;
        this.computeNodesLocationForClusters(activeTopology);
    };

    this.setClusteringSphereRadius = function(r) {
        if (r == clusteringRadius) {
            return;
        }
        clusteringRadius = r;
        this.computeNodesLocationForClusters(activeTopology);
    };

    this.getClusteringLevel = function() {
        return clusteringLevel;
    };

    this.hasClusteringData = function () {
        return (clusters.length > 0);
    };

    this.setTopology = function (data) {
        // the first line is assumed to contain the data indicator type
        var dataType;
        for (var i = 0; i < data[0].length; i++) {
            dataType = data[0][i];
            switch (dataType) {
                case ("label"):
                    this.setLabelKeys(data, i);
                    break;
                case ("PLACE"): // structural
                case ("PACE"): // functional
                    this.setClusters(data, i);
                    this.computeNodesLocationForClusters(dataType);
                    topologies.push(dataType);
                    break;
                case (""):
                    break;
                default: // all other topologies
                    this.setCentroids(data, dataType, i);
                    topologies.push(dataType);
                    break;
            }
        }
        activeTopology = topologies[0];
    };

    this.getTopologies = function () {
        return topologies;
    };

    /*
     * Since EB takes time for large networks, we are going to partially computes it
     * we are going to compute EB for only 1000 edges at a time following:
     * 1) all edges of selected node
     * 2) all edges of selected node neighbor
     * @param nodeIdx selected node index
     */
    this.performEBOnNode = function(nodeIdx) {
        var edges_ = [];
        var edgeIndices = [];
        var nNodes = connectionMatrix.length;
        var cen = centroids[activeTopology];
        // all edges of selected node
        for (var i = 0; i < nNodes; i++) {
            if (Math.abs(connectionMatrix[nodeIdx][i]) > 0) {
                edges_.push({
                    'source': cen[i],
                    'target': cen[nodeIdx]
                });
                edgeIndices.push(edgeIdx[nodeIdx][i]);
            }
        }
        // selected node neighbors
        var neighbors = nodesDistances[activeTopology][nodeIdx]
            .map(function(o, i) {return {idx: i, val: o}; }) // create map with value and index
            .sort(function(a, b) {return a.val - b.val;}); // sort based on value
        for (var i = 1; i < nNodes; i++) { // first one assumed to be self
            if (edges_.length >= 500)
                break;
            if (neighbors[i].idx != nodeIdx) {
                var row = connectionMatrix[neighbors[i].idx];
                for (var j = 0; j < nNodes; j++) {
                    if (Math.abs(row[j]) > 0 && j != nodeIdx) {
                        edges_.push({
                            'source': cen[neighbors[i].idx],
                            'target': cen[j]
                        });
                        edgeIndices.push(edgeIdx[neighbors[i].idx][j]);
                    }
                }
            }
        }
        fbundling.edges(edges_);
        var results = fbundling();

        for (var i = 0; i <edges_.length; i++) {
            edges[activeTopology][edgeIndices[i]] = results[i];
        }
        // console.log(results)
    };

    this.getActiveEdges = function() {
        return edges[activeTopology];
    };

    this.getEdgesIndeces = function() {
        return edgeIdx;
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

    // scales and center centroids
    var scaleCentroids = function (centroids) {
        var centroidScale = createCentroidScale(centroids);

        // compute centroids according to scaled data
        var xCentroid = d3.mean(centroids, function(d){ return centroidScale(d.x); });
        var yCentroid = d3.mean(centroids, function(d){ return centroidScale(d.y); });
        var zCentroid = d3.mean(centroids, function(d){ return centroidScale(d.z); });

        var newCentroids = new Array(centroids.length);
        for (var i = 0; i < centroids.length; i++) {
            var x = centroidScale(centroids[i].x) - xCentroid;
            var y = centroidScale(centroids[i].y) - yCentroid;
            var z = centroidScale(centroids[i].z) - zCentroid;
            newCentroids[i] = new THREE.Vector3(x,y,z);
        }
        return newCentroids;
    };

    // compute the edges for a specific topology
    this.computeEdgesForTopology = function (topology) {
        var nNodes = connectionMatrix.length;
        edges[topology] = [];
        for (var i = 0; i < nNodes; i++) {
            for (var j = i+1; j < nNodes; j++) {
                if (Math.abs(connectionMatrix[i][j]) > 0) {
                    var edge = [];
                    edge.push(centroids[topology][i]);
                    edge.push(centroids[topology][j]);
                    edges[topology].push(edge);
                }
            }
        }
    }
}

var modelLeft = new Model();
var modelRight = new Model();