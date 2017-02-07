/**
 * Created by giorgioconte on 31/01/15.
 */

var folder;

var setFolder = function (folderName, callback) {
    folder = folderName;
    console.log("Source folder set to: ", folder);
    callback(null,null);
};

var loadIcColors = function (callback) {
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

// the look up table is common for all datasets
var loadLookUpTable = function (callback) {
    var labelsLUTFilename;
    switch (labelLUT) {
        case ("fsl"):
            labelsLUTFilename = "LookupTable_fsl.csv";
            break;
        case ("baltimore"):
            labelsLUTFilename = "LookupTable_baltimore.csv";
            break;
        default:
            break;
    }
    Papa.parse("data/"+labelsLUTFilename, {
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

var loadConnections = function (callback) {
    Papa.parse("data/"+folder+"/"+dataFiles.leftNW,{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelLeft.setConnectionMatrix(results);
            console.log("Left NW loaded ... ");
        }
    });

    Papa.parse("data/"+folder+"/"+dataFiles.rightNW,{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelRight.setConnectionMatrix(results);
            console.log("Right NW loaded ... ");
            callback(null,null);
        }
    });
};

var loadTopology = function (callback) {
    Papa.parse("data/"+folder+"/"+dataFiles.leftTopology,{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelLeft.setTopology(results.data);
            console.log("Left Topology loaded ... ");
        }
    });

    Papa.parse("data/"+folder+"/"+dataFiles.rightTopology,{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            modelRight.setTopology(results.data);
            console.log("Right Topology loaded ... ");
            callback(null,null);
        }
    });
};

var loadInfo = function (callback) {
    Papa.parse("data/"+folder+"/"+dataFiles.infoLeft,{
        download: true,
        dynamicTyping: true,
        delimiter: '\n',
        header: false,
        complete: function(results){
            modelLeft.setInfo(results.data[0][0], results.data[1][0]);
        }
    });

    Papa.parse("data/"+folder+"/"+dataFiles.infoRight,{
        download: true,
        dynamicTyping: true,
        delimiter: '\n',
        header: false,
        complete: function(results){
            modelRight.setInfo(results.data[0][0], results.data[1][0]);
            callback(null,null);
        }
    });
};

var loadColorMap = function (callback) {
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