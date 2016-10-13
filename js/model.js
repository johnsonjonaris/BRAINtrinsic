/**
 * Created by giorgioconte on 31/01/15.
 */
/*
private variables
 */

var groups = [];                    // contain nodes group affiliation according to Anatomy, place, rich club, id
var activeGroup = 0;                // 0 = Anatomy, 1 = place, 2 = rich club, 3 = id
var regionsActivated = [];          // store the group activation boolean according to activeGroup
var regionState = {};               // group state: active, transparent or inactive
var labelKeys;                      // map between each node and its corresponding FSL label
var centroids = [];                 // nodes centroids according to topological spaces: centroids[node][technique] = (x,y,z)
var activeCentroids = "isomap";     // isomap, MDS, anatomy, tsne, selection from centroids
var connectionMatrix = {};          // adjacency matrix according to ??? : connectionMatrix[???] = 2D array, ??? = isomap, normal
var activeMatrix = 'isomap';        // selection from connectionMatrix, isomap, normal ...
var labelVisibility = [];           // contains FSL label name, visibility and hemisphere
var lookUpTable = [];               // contains FSL label group name, rich club, name and hemisphere
var icColorTable = [];

var distanceArray;                  // contain the shortest path for current selected node
var distanceThreshold;              // threshold for the distanceArray
var threshold;                      // threshold for the edge value
var numberOfEdges = 5;              // threshold the number of edges for shortest paths
var numberOfHops;

var metricValues = [];

// set the iso center color table ???
setICColor = function(icData){
    icColorTable = icData.data;
};

// set distanceArray containing the shortest path for current selected node
setDistanceArray = function(array){
    distanceArray = array;
};

// get the longest shortest path of the current selected node = the farthest node
getMaximumDistance = function(){
    return d3.max(distanceArray);
};

// store map between each node and its corresponding FSL label
setLabelKeys = function(labels){
    labelKeys = labels.data;
};

// store nodes centroids according to topological spaces
// technique can be: Isomap, MDS, tSNE, anatomy ...
setCentroids = function(d, technique) {
    var data = d.data;
    var len = data.length;
    for(var i=0; i < len; i++){
        var element = {};
        element.x = data[i][0];
        element.y = data[i][1];
        element.z = data[i][2];
        centroids[i] = centroids[i] || {};
        centroids[i][technique] = element;
    }
};

// set shortest path distance threshold and update GUI
setDistanceThreshold = function(dt) {
    if(document.getElementById("distanceThresholdOutput")){
        var percentage = dt/getMaximumDistance()*100;
        var value = Math.floor(percentage*100)/100;
        document.getElementById("distanceThresholdOutput").value = value+ " %";
    }
    distanceThreshold = dt;
};

// get shortest path distance threshold
getDistanceThreshold = function() {
    return distanceThreshold;
};

// store edge threshold and update GUI
setThreshold = function(t) {
    document.getElementById("thresholdOutput").value = t;
    threshold = t;
};

// get edge threshold
getThreshold = function() {
    return threshold;
};

// set the look up table filling lookUpTable and labelVisibility
// from loaded data for each FSL node label
// for each label, d contains: label#, group, place, rich_club, region_name, hemisphere
setLookUpTable = function(d) {
    var i, el;

    for(i = 0; i < d.data.length ; i++){
        el = {"group": d.data[i].group,
            "place" : d.data[i].place,
            "rich_club":d.data[i].rich_club,
            "region_name":d.data[i].region_name,
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

// set connection matrix for every name: normal, isomap ...
setConnectionMatrix = function(d, name){
    connectionMatrix[name] = d.data;
};

// add group data
setGroup = function(d) {
    groups[groups.length] = d.data;
};

// never used !!
getCentroids = function(){
    var l = centroids.length;
    var results = [];
    for(var i=0; i < l; i++){
        var element = {};
        element.x = centroids[i].x;
        element.y = centroids[i].y;
        element.z = centroids[i].z;
        results[results.length] = element;
    }
    return results;
};


// get the dataset according to activeCentroids
getDataset = function() {
    var row;
    var arrayLength = labelKeys.length;
    //var index;
    var result = [];

    for (var i = 0; i < arrayLength; i++) {
        row = {};

        //getting Centroids
        row.x = centroids[i][activeCentroids].x;
        row.y = centroids[i][activeCentroids].y;
        row.z = centroids[i][activeCentroids].z;

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
getActiveGroup = function() {
    var l = groups[activeGroup].length;
    var results = [];
    for(var i = 0; i < l; i++){
        var element = groups[activeGroup][i];
        if(results.indexOf(element) == -1){
            results[results.length] = element;
        }
    }
    return results;
};

// get connection matrix according to activeMatrix
getConnectionMatrix = function() {
    return connectionMatrix[activeMatrix];
};

// get a row (one node) from connection matrix according to activeMatrix
getConnectionMatrixRow = function(index){
    var row = [];
    for(var i=0; i < connectionMatrix[activeMatrix].length; i++){
        row[row.length] = connectionMatrix[activeMatrix][index][i];
    }
    return row;
};

// get the group of a specific node according to activeGroup
getRegionByNode = function(nodeIndex) {
    return groups[activeGroup][nodeIndex];
};

// return if a specific region is activated
isRegionActive = function(region) {
    return regionsActivated[region];
};

// toggle a specific region in order: active, transparent, inactive
// set activation to false if inactive
toggleRegion = function(regionName) {
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

// set all regions active
setRegionsActivated = function() {
    regionsActivated = {};
    regionState = {};

    var l = groups[activeGroup].length;
    for(var i = 0; i < l; i++){
        var element = groups[activeGroup][i];
        regionsActivated[element] = true;
        regionState[element] = 'active';
    }
};

// get the connection matrix number of nodes
getConnectionMatrixDimension = function(){
    return connectionMatrix['isomap'].length;
};

// get top n edges connected to a specific node
getTopConnectionsByNode = function(indexNode, n) {
    var row = getConnectionMatrixRow(indexNode);
    var sortedRow = row.sort(function(a, b){return b-a}); //sort in a descending flavor
    var res = {};
    var val;
    for(var i=0; i < n; i++){
        val = sortedRow[i];
        res[row.indexOf(val)] = val;
    }
    return res;
};

getMaximumWeight = function() {

    var max = d3.max(connectionMatrix['normal'], function(d){
        return d3.max(d, function(d){
            return d;
        })
    });
    // console.log(max);
    return max;
};

getNumberOfEdges = function() {
  return numberOfEdges;
};

setNumberOfEdges = function(n){
    if(document.getElementById("topNThresholdSliderOutput")){
        document.getElementById("topNThresholdSliderOutput").value = n;
    }
    numberOfEdges = n;
};

// create groups in order: Anatomy, place, rich club, id
createGroups = function() {
    console.log("create groups");
    var anatomicalGroup = [];
    var richClubGroup = [];
    var placeGroup = [];
    var icGroup = [];

    for(var i=0; i < labelKeys.length; i++){
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
getRegionNameByIndex = function(index){
    return lookUpTable[labelKeys[index]].region_name;
};

setNumberOfHops = function(hops) {
    numberOfHops = hops;
    if(document.getElementById("numberOfHopsOutput")){
        document.getElementById("numberOfHopsOutput").value = hops;
    }
};


getNumberOfHops = function() {
    return numberOfHops;
};

// get the label visibility
getLabelVisibility = function(label){
    return labelVisibility[label]['visibility'];
};

// set the label visibility: label is an index, visibility is boolean
setLabelVisibility = function(label, visibility) {
    if(labelVisibility[label] != undefined)
        labelVisibility[label]['visibility'] = visibility;
    else{
        console.log("It isn't possible to set visibility of the label");
    }
};

setMetricValues = function(data){
    metricValues = data.data;

    metricQuantileScale  = d3.scale.quantile()
        .domain(metricValues)
        .range(['#000080','#0000c7','#0001ff','#0041ff','#0081ff','#00c1ff','#16ffe1','#49ffad',
            '#7dff7a','#b1ff46','#e4ff13','#ffd000','#ff9400','#ff5900','#ff1e00','#c40000']);

    console.log("loaded metric file");
};

// Jet colormap
//'#000080','#0000c7','#0001ff','#0041ff','#0081ff','#00c1ff','#16ffe1','#49ffad','#7dff7a',
// '#b1ff46','#e4ff13','#ffd000','#ff9400','#ff5900','#ff1e00','#c40000'

// Mine colormap
//'#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'