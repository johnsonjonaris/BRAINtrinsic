/**
 * Created by giorgioconte on 31/01/15.
 */

var folder;

var setFolder = function(folderName, callback){
    folder = folderName;
    callback(null,null);
    return;
};

var loadCentroidsMDS = function (callback) {

    Papa.parse("./data/"+ folder + "/MDSxyz.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelLeft.setCentroids(results, "MDS");
            modelRight.setCentroids(results, "MDS");
            callback(null, null);
        }
    });
};

var loadCentroidsAnatomy = function (callback){
    Papa.parse("./data/"+ folder + "/anatomyxyz.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        error:"continue",
        complete: function (results) {
            modelLeft.setCentroids(results, "anatomy");
            modelRight.setCentroids(results, "anatomy");
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

    Papa.parse("./data/"+ folder +"/isomapxyz.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelLeft.setCentroids(results, "isomap");
            modelRight.setCentroids(results, "isomap");
            callback(null, null);
        }
    });

};

var loadCentroidstSNE = function (callback) {

    Papa.parse("data/"+folder + "/tSNExyz.csv", {
        download: true,
        delimiter: ",",
        dynamicTyping: true,
        complete: function (results) {
            modelLeft.setCentroids(results, "tsne");
            modelRight.setCentroids(results, "tsne");
            callback(null, null);
        }
    });

};

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
            callback(null, null);
        }
    });

};

var loadLabelKeys = function (callback) {
    Papa.parse("data/"+folder+"/labelKey.csv", {
        download: true,
        dynamicTyping: true,
        complete: function (results) {
            modelLeft.setLabelKeys(results);
            modelRight.setLabelKeys(results);
            callback(null, null);
        }
    });
};

var loadConnections = function(callback){
    Papa.parse("data/"+folder+"/NW.csv",{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelLeft.setConnectionMatrix(results, 'normal');
            modelRight.setConnectionMatrix(results, 'normal');
            //computeDistanceMatrix();
            callback(null,null);
        }
    })
};

var loadConnectionsIsomap = function(callback){
    Papa.parse("data/"+folder+"/isomapNW.csv",{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelLeft.setConnectionMatrix(results, 'isomap');
            modelRight.setConnectionMatrix(results, 'isomap');
            //computeDistanceMatrix();
            callback(null,null);
        }
    })
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
    })
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