/**
 * Created by giorgioconte on 31/01/15.
 */

var folder;

var setFolder = function(folderName, callback){
    folder = folderName;
    console.log("Source folder set to: ", folder);
    callback(null,null);
};

var loadCentroidsMDS = function (callback) {

    Papa.parse("./data/"+ folder + "/MDSxyzLeft.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelLeft.setCentroids(results, "MDS");
            console.log("Left MDS locations loaded ... ");
        }
    });

    Papa.parse("./data/"+ folder + "/MDSxyzRight.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelRight.setCentroids(results, "MDS");
            console.log("Right MDS locations loaded ... ");
            callback(null, null);
        }
    });
};

var loadCentroidsAnatomy = function (callback){
    Papa.parse("./data/"+ folder + "/anatomyxyzLeft.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        error:"continue",
        complete: function (results) {
            modelLeft.setCentroids(results, "anatomy");
            console.log("Left anatomy locations loaded ... ");
        }
    });

    Papa.parse("./data/"+ folder + "/anatomyxyzRight.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        error:"continue",
        complete: function (results) {
            modelRight.setCentroids(results, "anatomy");
            console.log("Right anatomy locations loaded ... ");
            callback(null, null);
        }
    });
};

var loadIcColors = function(callback){
    Papa.parse("./data//WB2s1IC.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        error:"continue",
        complete: function (results) {
            modelLeft.setICColor(results);
            modelRight.setICColor(results);
            callback(null, null);
        }
    });
};

var loadCentroidsIsomap = function (callback) {

    Papa.parse("./data/"+ folder +"/isomapxyzLeft.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelLeft.setCentroids(results, "isomap");
            console.log("Left isomap locations loaded ... ");
        }
    });

    Papa.parse("./data/"+ folder +"/isomapxyzRight.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelRight.setCentroids(results, "isomap");
            console.log("Right isomap locations loaded ... ");
            callback(null, null);
        }
    });
};

var loadCentroidstSNE = function (callback) {

    Papa.parse("data/"+folder + "/tSNExyzLeft.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelLeft.setCentroids(results, "tsne");
            console.log("Left tSNE locations loaded ... ");
        }
    });

    Papa.parse("data/"+folder + "/tSNExyzRight.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelRight.setCentroids(results, "tsne");
            console.log("Right tSNE locations loaded ... ");
            callback(null, null);
        }
    });
};

// the look up table is common for all datasets
var loadLookUpTable = function (callback) {
    Papa.parse("data/LookupTable.csv", {
        download: true,
        delimiter: ";",
        dynamicTyping: true,
        header: true,
        complete: function (results) {
            console.log("Setting up Look-up Table");
            modelLeft.setLookUpTable(results);
            modelRight.setLookUpTable(results);
            console.log("Look up table loaded ... ");
            callback(null, null);
        }
    });
};

var loadLabelKeys = function (callback) {
    Papa.parse("data/"+folder+"/labelKeyLeft.csv", {
        download: true,
        dynamicTyping: true,
        complete: function (results) {
            modelLeft.setLabelKeys(results);
            console.log("Left label keys loaded ... ");
        }
    });

    Papa.parse("data/"+folder+"/labelKeyRight.csv", {
        download: true,
        dynamicTyping: true,
        complete: function (results) {
            modelRight.setLabelKeys(results);
            console.log("Right label keys loaded ... ");
            callback(null, null);
        }
    });
};

var loadConnections = function(callback){
    Papa.parse("data/"+folder+"/NWLeft.csv",{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelLeft.setConnectionMatrix(results, 'normal');
            //computeDistanceMatrix();
            console.log("Left NW loaded ... ");
        }
    });

    Papa.parse("data/"+folder+"/NWRight.csv",{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelRight.setConnectionMatrix(results, 'normal');
            //computeDistanceMatrix();
            console.log("Right NW loaded ... ");
            callback(null,null);
        }
    });
};

var loadConnectionsIsomap = function(callback){
    Papa.parse("data/"+folder+"/isomapNWLeft.csv",{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelLeft.setConnectionMatrix(results, 'isomap');
            //computeDistanceMatrix();
            console.log("Left isomap NW loaded ... ");
        }
    });

    Papa.parse("data/"+folder+"/isomapNWRight.csv",{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelRight.setConnectionMatrix(results, 'isomap');
            //computeDistanceMatrix();
            console.log("Right isomap NW loaded ... ");
            callback(null,null);
        }
    });
};


var loadColorMap = function(callback){
    Papa.parse("data/colorMap.csv", {
        download: true,
        delimiter: ',',
        dynamicTyping: true,
        header: false,
        complete: function(results){
            modelLeft.setGroup(results);
            modelRight.setGroup(results);
            callback(null,null);
        }
    });
};


var loadMetricValues = function(callback){
    console.log("Loading metric file");
    Papa.parse("data/Anatomic/metric.csv",{
        download: true,
        delimiter: ',',
        dynamicTyping: true,
        header: false,
        complete: function(results){
            modelLeft.setMetricValues(results);
            modelRight.setMetricValues(results);
            callback(null,null);
        }
    })
};