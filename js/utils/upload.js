/**
 * Created by giorgioconte on 16/04/15.
 */

// TODO fix all upload buttons 
var uploadAnatomyCentroids = function (model) {
    var f;
    if (model == modelLeft) {
        f = document.getElementById("anatomyCentroidsLeft");
        console.log("I am here left");
    }
    else {
        f = document.getElementById("anatomyCentroidsRight");
        console.log("I am here right");
    }

    if (f.files && f.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    delimiter: ",",
                    dynamicTyping: true,
                    complete: function (results) {
                        model.setCentroids(results, "anatomy");
                        d3.select('#anatomyBtn').attr('class','load');
                        dhtmlx.message("Anatomical Centroids Uploaded");
                    }
                }
            )
        };
        reader.readAsDataURL(f.files[0]);
    }
};

uploadNormalConnections = function (model) {
    var f = document.getElementById("anatomyConnections");
    if (f.files && f.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    dynamicTyping: true,
                    delimiter: ',',
                    header: false,
                    complete: function (results) {
                        model.setConnectionMatrix(results);
                        d3.select('#connectionsBtn').attr('class','load');
                        dhtmlx.message("Adjacency Matrix Uploaded");
                    }
                }
            )
        };
        reader.readAsDataURL(f.files[0]);
    }
};


var uploadIsomapCentroids = function(model){
    var f = document.getElementById("isomapCentroid");
    if (f.files && f.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    delimiter: ",",
                    dynamicTyping: true,
                    complete: function (results) {
                        model.setCentroids(results, "isomap");
                        d3.select('#isomapBtn').attr('class','load');
                        dhtmlx.message("Isomap Centroids Uploaded");

                    }
                }
            )
        };
        reader.readAsDataURL(f.files[0]);
    }
};


var uploadMDSCentroids = function(model){
    var f = document.getElementById("mdsCentroid");
    if (f.files && f.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    delimiter: ",",
                    dynamicTyping: true,
                    complete: function (results) {
                        model.setCentroids(results, "MDS");
                        d3.select('#mdsBtn').attr('class','load');
                        dhtmlx.message("MDS Centroids Uploaded");

                    }
                }
            )
        };
        reader.readAsDataURL(f.files[0]);
    }
};


var uploadtSNECentroids = function(model){
    var f = document.getElementById("tsneCentroid");
    if (f.files && f.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    delimiter: ",",
                    dynamicTyping: true,
                    complete: function (results) {
                        model.setCentroids(results, "tsne");
                        d3.select('#tsneBtn').attr('class','load');
                        dhtmlx.message("tSNE Centroids Uploaded");

                    }
                }
            )
        };
        reader.readAsDataURL(f.files[0]);
    }
};

var uploadCustomMetric = function (model) {
    var f = document.getElementById("customMetric");
    if (f.files && f.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    delimiter: ",",
                    dynamicTyping: true,
                    complete: function (results) {
                        model.setMetricValues(results);
                        metric = true;
                        d3.select('#customMetricBtn').attr('class','load');
                        dhtmlx.message("Custom Metric Uploaded");
                    }
                }
            )
        };

        reader.readAsDataURL(f.files[0]);
    }
};

var uploadLabelKey = function (model) {
    var f = document.getElementById("labelkey");
    if (f.files && f.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var v = e.target.result;
            Papa.parse(v, {
                    download: true,
                    delimiter: ",",
                    dynamicTyping: true,
                    complete: function (results) {
                        model.setLabelKeys(results);
                        d3.select('#labelKeyBtn').attr('class','load');
                        dhtmlx.message("Label Keys Uploaded");

                    }
                }
            )
        };
        reader.readAsDataURL(f.files[0]);
    }

};

var start = function () {
   queue()
       .defer(store)
       .awaitAll(function(){
           var vr = getTechnology();
           document.location.href = 'visualization.html?dataset=null&vr='+vr+'&load=1&metric='+metric;
       });
};


var store = function(callback){
    localStorage.setItem("labelKeys", JSON.stringify(labelKeys));
    localStorage.setItem("centroids", JSON.stringify(centroids));
    localStorage.setItem("normal",JSON.stringify(connectionMatrix['normal']));
    localStorage.setItem("metricValues",JSON.stringify(metricValues));
   // localStorage.setItem("isomap",JSON.stringify(connectionMatrix['isomap']));
    callback(null,null);
};

var getTechnology = function () {
    if( $('#desktop').is(':checked') ){
        return 0;
    }
    if( $('#oculusv1').is(':checked') ){
        return 1;
    }
    if( $('#oculusv2').is(':checked') ){
        return 2;
    }
};

