/**
 * Created by giorgioconte on 31/01/15.
 */

var folder;

var setFolder = function (folderName, callback) {
    folder = folderName;
    console.log("Source folder set to: ", folder);
    callback(null,null);
};

// it is assumed all data folder should have an index.txt file describing its contents
var scanFolder = function (callback) {
    var indexFile = "./data/" + folder + "/index.txt";
    $.ajax({
        url: indexFile,
        type:'HEAD',
        error: function() {
            alert("Index file don't exist, can not continue");
            return false;
        },
        success: function() {
            Papa.parse(indexFile, {
                download: true,
                delimiter: ",",
                dynamicTyping: true,
                header: true,
                error: "continue",
                complete: function (results) {
                    dataFiles = results.data;
                    console.log("Subjects loaded");
                    callback(null,null);
                }
            });
            return true;
        }
    });
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

var loadSubjectNetwork = function (fileNames, model, callback) {
    Papa.parse("data/"+folder + "/" + fileNames.network,{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            model.setConnectionMatrix(results);
            console.log("NW loaded ... ");
            callback(null,null);
        }
    });
};

var loadSubjectTopology = function (fileNames, model, callback) {
    Papa.parse("data/"+folder + "/" + fileNames.topology,{
        download: true,
        dynamicTyping: true,
        delimiter: ',',
        header: false,
        complete: function(results){
            model.setTopology(results.data);
            console.log("Topology loaded ... ");
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