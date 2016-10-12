/**
 * Created by giorgioconte on 05/02/15.
 */
/*
 * This methods written here compute some useful metrics about the graph we are visualizing.
 * The vast majority of them are inspired to the library BCT.
 */

var graph;
var distanceMatrix = [];

// compute nodal strength of a specific node given its row
var computeNodalStrength = function (connectionRow) {
    return d3.sum(connectionRow);
};

// compute distance matrix = 1/(adjacency matrix)
var computeDistanceMatrix = function(){
    distanceMatrix = [];
    var adjacencyMatrix = getConnectionMatrix();
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
};

// compute shortest path from a specific node to the rest of the nodes
var computeShortestPathDistances = function(rootNode) {
    console.log("computing spt");
    return graph.shortestPath(String(rootNode));
};





