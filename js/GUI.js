/**
 * Created by giorgioconte on 31/01/15.
 */
// this file contains functions that create\delete GUI controlling elements

// init the GUI by creating all the data upload buttons
initGUI = function() {
    var uploadMenu = d3.select("#upload");

    uploadMenu.append("button")
        .text("Upload Centroids")
        .attr("id", "centroidUploadBtn")
        .append("input")
        .attr("type", "file")
        .attr("id", "centroids")
        .on("change", function () {
            var f = document.getElementById("centroids");
            if (f.files && f.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    var v = e.target.result;
                    Papa.parse(v, {
                            download: true,
                            delimiter: ",",
                            dynamicTyping: true,
                            complete: function (results) {
                                console.log("complete uploading centroids");
                                modelLeft.setCentroids(results);
                                modelRight.setCentroids(results);
                                //updateScene();
                            }
                        }
                    )};
                reader.readAsDataURL(f.files[0]);
            }
        });


    uploadMenu.append("button")
        .text("Upload labelKey")
        .attr("id", "labelKeyUploadBtn")
        .append("input")
        .attr("type", "file")
        .attr("id","labelKey")
        .on("change", function () {
            var f = document.getElementById("labelKey");
            if (f.files && f.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    console.log("On load event");
                    console.log(e);
                    var v = e.target.result;
                    Papa.parse(v, {
                            download: true,
                            dynamicTyping: true,
                            header: false,
                            complete: function (results) {
                                console.log("complete Uploading Label Keys ");
                                modelLeft.setLabelKeys(results);
                                modelRight.setLabelKeys(results);
                            }
                        }
                    );
                };
                reader.readAsDataURL(f.files[0]);
            }
        });
    /*
     uploadMenu.append("button")
     .text("Upload LookUpTable")
     .attr("id", "groupUploadButton")
     .append("input")
     .attr("type","file")
     .attr("id","lookUpTable")
     .on("change", function(){
     console.log("on Change Event look up table");

     var f = document.getElementById("lookUpTable");

     if(f.files && f.files[0]){
     var reader = new FileReader();
     reader.onload = function(e){
     console.log("On load event LookUpTable");
     v = e.target.result;

     console.log("Parsing LookUpTable");
     Papa.parse(v, {
     download: true,
     delimiter: ",",
     dynamicTyping: true,
     header: false,
     complete: function(results){
     setLookUpTable(results);
     console.log("look Up Table Uploaded");
     }
     })

     };
     reader.readAsDataURL(f.files[0]);
     }
     });*/

    /*uploadMenu.append("button")
     .text("Upload Regions Group")
     .attr("id", "groupUploadButton")
     .append("input")
     .attr("type", "file")
     .attr("id", "group")
     .on("change", function () {
     var f = document.getElementById("group");

     if(f.files && f.files[0]){
     var reader = new FileReader();
     reader.onload = function (e) {
     var v = e.target.result;
     Papa.parse(v, {
     download: true,
     delimiter: ',',
     dynamicTyping: true,
     header: false,
     complete: function(results){
     setGroup(results);
     }
     })
     }
     reader.readAsDataURL(f.files[0]);
     };

     });*/

    uploadMenu.append("button")
        .text("Upload Connections")
        .attr("id","uploadConnectionsButton")
        .append("input")
        .attr("type","file")
        .attr("id","connections")
        .on("change", function() {
            f = document.getElementById("connections");
            if (f.files && f.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    var v = e.target.result;
                    Papa.parse(v, {
                        download: true,
                        delimiter:',',
                        dynamicTyping: true,
                        header: false,
                        complete: function (results) {
                            console.log("Connection Matrix uploaded");
                            modelLeft.setConnectionMatrix(results);
                            modelRight.setConnectionMatrix(results);
                        }
                    })
                };
                reader.readAsDataURL(f.files[0]);
            }
        });

    uploadMenu.append("button")
        .text("Start Visualization")
        .attr("id", "startVisualization")
        .on("click", function() {
            if(modelLeft.ready() && modelRight.ready()){
                initCanvas();
            } else {
                console.log("data are missing");
            }
        });
};

// remove the start visualization button to allow only one scene and renderer
removeStartButton = function(){
    var elem = document.getElementById('startVisualization');
    elem.parentNode.removeChild(elem);
};

// adds a slider to control glyphs size
addDimensionFactorSlider = function() {
    var panel = d3.select("#nodeInfoPanel");

    panel.append("input")
        .attr("type", "range")
        .attr("value", "1")
        .attr("id", "dimensionSlider")
        .attr("min","0")
        .attr("max", "3")
        .attr("step","0.01")
        .on("change", function () {
            setDimensionFactor(this.value);
            updateScenes();
        });

    panel.append("label")
        .attr("for", "dimensionSlider")
        .attr("id", "dimensionSliderLabel")
        .text("Glyph Size");

    panel.append("br");
};

// adds a button to toggle skybox visibility
addSkyboxButton = function(){

    var menu = d3.select("#nodeInfoPanel");
    menu.append("button")
        .text("Skybox")
        .attr("id", "skyboxVisibilityBtn")
        .on("click", function () {
            var input = d3.select("input#skyboxVisibilityInput").node();
            input.checked = !input.checked;
            setSkyboxVisibility(input.checked);
            updateScenes();
        })
        .append("input")
        .attr("type","checkbox")
        .attr("id","skyboxVisibilityInput")
        .attr("checked", true);
    menu.append("br");
};

// adds a text label showing: node index - region name - nodal strength
// TODO add one left and one right
setNodeInfoPanel = function (regionName, index){

    var panel = d3.select('#nodeInfoPanel');

    panel.selectAll("p").remove();

    var connectionRow = modelLeft.getConnectionMatrixRow(index);
    var nodalStrength = Math.floor(computeNodalStrength(connectionRow)*100)/100;

    var para = document.createElement("p");
    var node = document.createTextNode(index + " " + regionName + " " + nodalStrength);

    panel.node().appendChild(para).appendChild(node);
};

// add a slider to threshold edges at specific values
addThresholdSlider = function (){

    var max = modelLeft.getMaximumWeight();
    var menu = d3.select("#edgeInfoPanel");
    menu.append("label")
        .attr("for", "thresholdSlider")
        .attr("id", "thresholdSliderLabel")
        .text("Threshold");

    menu.append("input")
        .attr("type", "range")
        .attr("value", max/2)
        .attr("id", "thresholdSlider")
        .attr("min","0")
        .attr("max", max)
        .attr("step",max/1000)
        .on("change", function () {
            var slider = document.getElementById("thresholdSlider");
            modelLeft.setThreshold(Math.floor(slider.value*100)/100);
            modelRight.setThreshold(Math.floor(slider.value*100)/100);
            updateScenes();
        });

    menu.append("output")
        .attr("for","thresholdSlider")
        .attr("id", "thresholdOutput");

    modelLeft.setThreshold(Math.floor(max*100/2)/100);
    modelRight.setThreshold(Math.floor(max*100/2)/100);

    document.getElementById("thresholdOutput").value = modelLeft.getThreshold();
};

// never used !!
// setInfoLabel = function(regionName, index){
//
//     var body = document.body;
//     var canvas = document.getElementsByTagName("canvas");
//     var label = document.createElement("div");
//
//     label.setAttribute("width", "100px");
//     label.setAttribute("height", "100px");
//     label.setAttribute("background-color", "white");
//     label.setAttribute("position", "fixed");
//     label.setAttribute("left", "100px");
//     label.setAttribute("z-index", "9");
//     label.setAttribute("bottom", "200px");
//
//     var para = document.createElement("p");
//     var node = document.createTextNode("CIAO");
//
//     body.appendChild(label).appendChild(para).appendChild(node);
// };

// create legend panel containing different groups
// the state of each group can be either: active, transparent or inactive
var createLegend = function (model) {
    var legendMenu = document.getElementById("legend");

    while(legendMenu.hasChildNodes()){
        legendMenu.removeChild(legendMenu.childNodes[0]);
    }

    legendMenu = d3.select("#legend");

    if(model.getActiveGroup() != 3) {
        var activeGroup = model.getActiveGroup();
        if(typeof(activeGroup[0]) == "number"){ // group is numerical
            activeGroup.sort(function(a, b){return a-b});
        } else { // group is string
            activeGroup.sort();
        }

        var l = activeGroup.length;
        document.getElementById("legend").style.height = 25*l+"px";

        for(var i=0; i < l; i++){
            var opacity;

            switch (modelLeft.getRegionState(activeGroup[i])){
                case 'active':
                    opacity = 1;
                    break;
                case 'transparent':
                    opacity = 0.5;
                    break;
                case 'inactive':
                    opacity = 0.1;
                    break;
            }

            var elementGroup = legendMenu.append("g")
                .attr("transform","translate(10,"+i*25+")")
                .attr("id",activeGroup[i])
                .style("cursor","pointer")
                .on("click", function(){
                    modelLeft.toggleRegion(this.id);
                    modelRight.toggleRegion(this.id);
                });

            if(typeof(activeGroup[i]) != 'number' && activeGroup[i].indexOf("right") > -1){
                elementGroup.append("rect")
                    .attr("x",-5)
                    .attr("y",0)
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("fill", scaleColorGroup(model, activeGroup[i]))
                    .attr('opacity',opacity);
            } else {
                elementGroup.append("circle")
                    .attr("cx",5)
                    .attr("cy",10)
                    .attr("fill", scaleColorGroup(model, activeGroup[i]))
                    .attr('opacity', opacity)
                    .attr("r",8);
            }

            //choose color of the text
            var textColor;
            if(modelLeft.getRegionActivation(activeGroup[i])){
                textColor = "rgb(191,191,191)";
            } else{
                textColor = "rgb(0,0,0)";
                opacity = 1;
            }

            elementGroup.append("text")
                .text(activeGroup[i])
                .attr("font-family","'Open Sans',sans-serif")
                .attr("font-size","15px")
                .attr("x",20)
                .attr("y",10)
                .attr("text-anchor","left")
                .attr("dy",5)
                .attr('opacity', opacity)
                .attr("fill",textColor);
        }
    } else {
        var quantiles = metricQuantileScale.quantiles();
        var min = d3.min(metricValues, function (d){return d[0]});
        var max = d3.max(metricValues, function (d){return d[0]});

        console.log("custom group color");
        l = quantiles.length+1;
        document.getElementById("legend").style.height =30*l+"px";

        for(i = 0; i < quantiles.length + 1 ; i++){
            var elementGroup = legendMenu.append("g")
                .attr("transform","translate(10,"+i*25+")")
                .attr("id",i);

            var color;
            var leftRange;
            var rightRange;
            if( i == 0){
                color = metricQuantileScale(min + 1);

                leftRange = round(min,2);
                rightRange = round(quantiles[i],2);
            } else if(i == quantiles.length ){
                color = metricQuantileScale(max - 1);

                leftRange = round(quantiles[i - 1],2);
                rightRange = round(max,2);
            } else{

                leftRange = round(quantiles[i - 1 ],2);
                rightRange = round(quantiles[i],2);

                color = metricQuantileScale((leftRange + rightRange)/2);
            }

            elementGroup.append("rect")
                .attr("x",5)
                .attr("y",10)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", color);

            elementGroup.append("text")
                .text(leftRange + " - " + rightRange )
                .attr("font-family","'Open Sans',sans-serif")
                .attr("font-size","20px")
                .attr("x",45)
                .attr("y",20)
                .attr("text-anchor","left")
                .attr("dy",10)
                .attr("fill","rgb(191,191,191)");
        }
    }
};

var addDistanceSlider = function (distances) {
    var menu = d3.select("#edgeInfoPanel");

    menu.append("br");

    menu.append("label")
        .attr("for", "distanceThresholdSlider")
        .attr("id", "distanceThresholdSliderLabel")
        .text("Max Distance");

    var meanDistance = d3.mean(distances);
    var maxDistance = d3.max(distances);

    menu.append("input")
        .attr("type", "range")
        .attr("value", meanDistance)
        .attr("id", "distanceThresholdSlider")
        .attr("min","0")
        .attr("max", maxDistance)
        .attr("step", maxDistance/1000)
        .on("change", function () {
            var slider = document.getElementById("distanceThresholdSlider");
            //console.log("on Change distance threshold value:" + slider.value);
            modelLeft.setDistanceThreshold(slider.value);
            modelRight.setDistanceThreshold(slider.value);
            drawShortestPathLeft(root);
            drawShortestPathRight(root);
        });

    menu.append("output")
        .attr("for","distanceThresholdSlider")
        .attr("id", "distanceThresholdOutput");

    modelLeft.setDistanceThreshold(meanDistance);
    modelRight.setDistanceThreshold(meanDistance);
};

// remove threshold slider and its labels
removeThresholdSlider = function(){
    var elem = document.getElementById('thresholdSlider');

    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('thresholdOutput');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('thresholdSliderLabel');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
};

// add "Change Modality" button to toggle between:
// edge threshold and top N edges
addModalityButton = function () {

    var menu = d3.select("#upload");

    menu.append("button")
        .text("Change Modality")
        .attr("id", "changeModalityBtn")
        .append("input")
        .attr("type","checkbox")
        .attr("id","changeModalityInput")
        .attr("checked", "true")
        .on("change", function () {
            changeModality(this.checked);
            updateScene();
        });
};

// change modality callback
changeModality = function(modality){
    thresholdModality = modality;

    if(modality){
        //if it is thresholdModality
        removeTopNSlider();
        addThresholdSlider();

    } else{
        //top N modality
        removeThresholdSlider();
        addTopNSlider();
    }
};

// add slider to filter the top N edges in terms of value
addTopNSlider = function(){
    var menu = d3.select("#edgeInfoPanel");

    menu.append("label")
        .attr("for", "topNThresholdSlider")
        .attr("id", "topNThresholdSliderLabel")
        .text("Number of Edges");

    menu.append("input")
        .attr("type", "range")
        .attr("value", modelLeft.getNumberOfEdges())
        .attr("id", "topNThresholdSlider")
        .attr("min","0")
        .attr("max", "20")
        .attr("step", "1")
        .on("change", function () {
            modelLeft.setNumberOfEdges(this.value);
            modelRight.setNumberOfEdges(this.value);
            updateScenes();
        });

    menu.append("output")
        .attr("for","topNThresholdSlider")
        .attr("id", "topNThresholdSliderOutput")
        .text(modelLeft.getNumberOfEdges());
};

// remove top N edges slider and its labels
removeTopNSlider= function () {

    var elem = document.getElementById('topNThresholdSlider');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('topNThresholdSliderOutput');

    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('topNThresholdSliderLabel');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
};

// remove all DOM elements from the edgeInfoPanel
removeElementsFromEdgePanel = function(){
    removeThresholdSlider();
    removeTopNSlider();
};

// remove all upload buttons
removeUploadButtons= function (){
    var menu = document.getElementById("upload");
    while(menu.hasChildNodes()){
        menu.removeChild(menu.children[0]);
    }
};

// add "Color Coding" radio button group containing:
// Anatomy, Embeddedness and Rich Club groups
addGroupList = function () {
    var menu = d3.select("#upload");

    menu.append("label")
        .attr("for","colorGroup")
        .text("Color coding:");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","colorGroup")
        .attr("id","anatomy")
        .attr("value","0")
        .attr("checked","true")
        .on("change", function () {
            changeColorGroup(this.value);
        });
    menu.append("label")
        .attr("for","anatomy")
        .text("Anatomy");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","colorGroup")
        .attr("id","place")
        .attr("value","1")
        .on("change", function () {
            changeColorGroup(this.value);
        });

    menu.append("label")
        .attr("for","place")
        .text("Embeddedness");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","colorGroup")
        .attr("value","2")
        .attr("id","richClub")
        .on("change", function () {
            changeColorGroup(this.value);
        });

    menu.append("label")
        .attr("for","richClub")
        .text("Rich Club");

    menu.append("br");

    /*
    menu.append("input")
        .attr("type", "radio")
        .attr("name","colorGroup")
        .attr("value","3")
        .attr("id","ic")
        .on("change", function () {
            changeColorGroup(this.value);
        });


   menu.append("label")
        .attr("for","ic")
        .text("IC");*/

    if(metric == true){
        menu.append("input")
            .attr("type", "radio")
            .attr("name","colorGroup")
            .attr("value","3")
            .attr("id","metric")
            .on("change", function () {
                changeColorGroup(this.value);
            });
        menu.append("label")
            .attr("for","metric")
            .text("Custom Group");
        menu.append("br");
    }
};

// add a slider that filters shortest paths by the number of hops
shortestPathSliderHops = function(){

    removeDistanceSlider();

    var menu =  d3.select('#edgeInfoPanel');
    if(document.getElementById('numberOfHopsSlider') == null) {
        menu.append("label")
            .attr("for", "numberOfHopsSlider")
            .attr("id", "numberOfHopsSliderLabel")
            .text("Number of Hops");

        menu.append("input")
            .attr("type", "range")
            .attr("value", modelLeft.getNumberOfHops())
            .attr("id", "numberOfHopsSlider")
            .attr("min", "0")
            .attr("max", getMaximumNumberOfHops())
            .attr("step", 1)
            .on("change", function () {
                modelLeft.setNumberOfHops(parseInt(this.value));
                modelRight.setNumberOfHops(parseInt(this.value));
                drawShortestPathHops(root, parseInt(this.value));
            });

        menu.append("output")
            .attr("for", "numberOfHopsSlider")
            .attr("id", "numberOfHopsOutput");

        d3.select("#sptFilterButtonSPT").remove();

        d3.select("#upload")
            .append("button")
            .attr("id", "sptFilterButtonDistance")
            .text("Distance Filter")
            .on('click', function () {
                drawAllShortestPath(root);
            });
    }
};


shortestPathDistanceUI = function(){

    var btn = d3.select('#changeModalityBtn');
    if(btn){
        btn.remove();
    }

    btn = document.getElementById("sptFilterButtonDistance");
    if(btn)
        btn.remove();

    removeNumberOfHopsSlider();

    var menu = d3.select("#upload");

    if(document.getElementById('sptFilterButtonSPT') == undefined) {
        menu.append('button')
            .attr("id", "sptFilterButtonSPT")
            .text("Number of Hops Filter")
            .on('click', function () {
                modelLeft.setNumberOfHops(2);
                modelRight.setNumberOfHops(2);
                drawShortestPathHops(rootNode, modelLeft.getNumberOfHops());
                modelLeft.setNumberOfHops(2);
                modelRight.setNumberOfHops(2);
            })
    }
};

// remove
removeDistanceSlider = function () {
    var elem = document.getElementById('distanceThresholdSlider');

    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('distanceThresholdOutput');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('distanceThresholdSliderLabel');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
};

// remove the shortest path number of hops filter
removeNumberOfHopsSlider = function(){
    var elem = document.getElementById('numberOfHopsSlider');

    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('numberOfHopsOutput');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('numberOfHopsSliderLabel');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
};

// add "Topological Spaces" radio button group for left scene containing:
// Isomap, MDS, tSNE and anatomy spaces
addGeometryRadioButtonsLeft = function () {
    var menu = d3.select("#upload");

    menu.append("br");

    menu.append("label")
        .attr("for","geometryLef")
        .text("Topological Space:");
    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","geometryLef")
        .attr("id","isomapLeft")
        .attr("value","isomap")
        .attr("checked","true")
        .on("change", function () {
            changeActiveGeometry(modelLeft, 'left', this.value);
        });
    menu.append("label")
        .attr("for","isomap")
        .text("Isomap");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","geometryLef")
        .attr("id","mdsLeft")
        .attr("value","MDS")
        .on("change", function () {
            changeActiveGeometry(modelLeft, 'left', this.value);
        });

    menu.append("label")
        .attr("for","mds")
        .text("MDS");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","geometryLef")
        .attr("id","tsneLeft")
        .attr("value","tsne")
        .on("change", function () {
            changeActiveGeometry(modelLeft, 'left', this.value);
        });

    menu.append("label")
        .attr("for","tsne")
        .text("tSNE");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","geometryLef")
        .attr("id","anatomyLeft")
        .attr("value","anatomy")
        .on("change", function () {
            changeActiveGeometry(modelLeft, 'left', this.value);
        });

    menu.append("label")
        .attr("for","anatomy")
        .text("anatomy");

    menu.append("br");
};

// add "Topological Spaces" radio button group for right scene containing:
addGeometryRadioButtonsRight = function () {
    var menu = d3.select("#upload");

    menu.append("br");

    menu.append("label")
        .attr("for","geometryRight")
        .text("Topological Space:");
    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","geometryRight")
        .attr("id","isomapRight")
        .attr("value","isomap")
        .attr("checked","true")
        .on("change", function () {
            changeActiveGeometry(modelRight, 'right', this.value);
        });
    menu.append("label")
        .attr("for","isomap")
        .text("Isomap");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","geometryRight")
        .attr("id","mdsRight")
        .attr("value","MDS")
        .on("change", function () {
            changeActiveGeometry(modelRight, 'right', this.value);
        });

    menu.append("label")
        .attr("for","mds")
        .text("MDS");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","geometryRight")
        .attr("id","tsneRight")
        .attr("value","tsne")
        .on("change", function () {
            changeActiveGeometry(modelRight, 'right', this.value);
        });

    menu.append("label")
        .attr("for","tsne")
        .text("tSNE");

    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","geometryRight")
        .attr("id","anatomyRight")
        .attr("value","anatomy")
        .on("change", function () {
            changeActiveGeometry(modelRight, 'right', this.value);
        });

    menu.append("label")
        .attr("for","anatomy")
        .text("anatomy");

    menu.append("br");
};

// add labels check boxes, appear/disappear on right click
addFslRadioButton = function () {
    var rightMenu = d3.select("#rightFslLabels");
    var leftMenu = d3.select("#leftFslLabels");

    rightMenu.append("text")
        .text("Right Hemisphere:");

    rightMenu.append("br");

    leftMenu.append("text")
        .text("Left Hemisphere:");

    leftMenu.append('br');

    labelVisibility.forEach( function(labelInfo, index) {
        var menu = (labelInfo['hemisphere'] == 'right') ? rightMenu : leftMenu;
        menu.append("input")
            .attr("type", "checkbox")
            .attr("name", "fslLabel")
            .attr("id", index)
            .attr("value", index)
            .attr("checked", "true")
            .on("change", function () {
                modelLeft.setLabelVisibility(index, this.checked);
                modelRight.setLabelVisibility(index, this.checked);
                updateScenes();
            });

        menu.append("label")
            .attr("for", "geometry")
            .text(" " + labelInfo['name']);

        menu.append("br");
    });
};

// add search nodes by index panel, appear/disappear on right click
addSearchPanel = function(){
    var menu = d3.select("#search");

    menu.append("text")
        .text("Search Panel");

    menu.append("br");

    menu.append("input")
        .attr("type", "text")
        .attr("id", "nodeSearch")
        .attr("name","nodeid");

    menu.append("button")
        .text("Search")
        .on("click",function(){
            var text = document.getElementById("nodeSearch");
            searchElement(text.value);
        });
};

// search by index callback
searchElement = function (index) {
    index = parseInt(index);
    console.log(index);
    if(typeof(index) != 'number' || isNaN(index)){
        alert("The value inserted is not a number");
    }

    if(index < 0 || index > glyphs.length){
        alert("Node not found");
    }

    drawSelectedNode(index, glyphs[index]);
};

// toggle labels check boxes on right click
toggleFslMenu = function (e) {
    $("#rightFslLabels").toggle();
    $('#leftFslLabels').toggle();
    $('#legend').toggle();
    $('#nodeInfoPanel').toggle();
    $('#upload').toggle();
    $('#edgeInfoPanel').toggle();
    $('#search').toggle();
};