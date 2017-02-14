/**
 * Created by giorgioconte on 31/01/15.
 */
// this file contains functions that create\delete GUI controlling elements

// TODO create uploadData function and prevent code repetition
// init the GUI by creating all the data upload buttons
initGUI = function() {
    var uploadMenu = d3.select("#upload");
    var uploadMenuLeft = d3.select("#uploadLeft");
    var uploadMenuRight = d3.select("#uploadRight");

    uploadMenuLeft.append("button")
        .text("Upload Left Topology")
        .attr("id", "topologyUploadBtnLeft")
        .append("input")
        .attr("type", "file")
        .attr("id", "topologyLeft")
        .on("change", function () {
            var f = document.getElementById("topologyLeft");
            if (f.files && f.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    var v = e.target.result;
                    Papa.parse(v, {
                            download: true,
                            delimiter: ",",
                            dynamicTyping: true,
                            complete: function (results) {
                                console.log("Complete uploading topology");
                                modelLeft.setTopology(results.data);
                            }
                        }
                    )};
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

    uploadMenuLeft.append("button")
        .text("Upload Left Connections")
        .attr("id","uploadConnectionsButtonLeft")
        .append("input")
        .attr("type","file")
        .attr("id","connectionsLeft")
        .on("change", function() {
            f = document.getElementById("connectionsLeft");
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
                        }
                    })
                };
                reader.readAsDataURL(f.files[0]);
            }
        });

    uploadMenuRight.append("button")
        .text("Upload Right Topology")
        .attr("id", "topologyUploadBtnRight")
        .append("input")
        .attr("type", "file")
        .attr("id", "topologyRight")
        .on("change", function () {
            var f = document.getElementById("topologyRight");
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
                                modelRight.setTopology(results.data);
                            }
                        }
                    )};
                reader.readAsDataURL(f.files[0]);
            }
        });

    uploadMenuRight.append("button")
        .text("Upload Left Connections")
        .attr("id","uploadConnectionsButtonRight")
        .append("input")
        .attr("type","file")
        .attr("id","connectionsRight")
        .on("change", function() {
            var f = document.getElementById("connectionsRight");
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

initSubjectMenu = function (side) {

    var select = document.getElementById("subjectMenu" + side);
    for (var i = 0; i < dataFiles.length; ++i) {
        var el = document.createElement("option");
        el.textContent = dataFiles[i].subjectID;
        el.value = dataFiles[i].subjectID;
        el.selected = (i==0);
        select.appendChild(el);
    }
    switch (side) {
        case 'Left':
            select.onchange = function () {
                changeSceneToSubject(this.selectedIndex, modelLeft, sceneLeft, glyphsLeft, displayedEdgesLeft, side);
                };
            break;
        case 'Right':
            select.onchange = function () {
                changeSceneToSubject(this.selectedIndex, modelRight, sceneRight, glyphsRight, displayedEdgesRight, side);
            };
            break;
    }
};

// remove the start visualization button to allow only one scene and renderer
removeStartButton = function() {
    var elem = document.getElementById('startVisualization');
    if (elem) {
        elem.parentNode.removeChild(elem);
    }
};

// remove all upload buttons
removeUploadButtons= function() {
    var menu = document.getElementById("uploadLeft");
    while(menu.hasChildNodes()){
        menu.removeChild(menu.children[0]);
    }
    menu.remove();
    menu = document.getElementById("uploadRight");
    while(menu.hasChildNodes()){
        menu.removeChild(menu.children[0]);
    }
    menu.remove();
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
addSkyboxButton = function() {

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
setNodeInfoPanel = function(model, regionName, index) {

    var panel = d3.select('#nodeInfoPanel');

    panel.selectAll("p").remove();

    var connectionRow = modelLeft.getConnectionMatrixRow(index);
    var nodalStrength = Math.floor(model.computeNodalStrength(connectionRow)*100)/100;

    var para = document.createElement("p");
    var node = document.createTextNode(index + " " + regionName + " " + nodalStrength);

    panel.node().appendChild(para).appendChild(node);
};

// add a slider to threshold edges at specific values
addThresholdSlider = function() {

    var max = Math.max(modelLeft.getMaximumWeight(), modelRight.getMaximumWeight());
    var min = Math.min(modelLeft.getMinimumWeight(), modelRight.getMinimumWeight());
    var menu = d3.select("#edgeInfoPanel");
    menu.append("label")
        .attr("for", "thresholdSlider")
        .attr("id", "thresholdSliderLabel")
        .text("Threshold @ " + max/2);
    menu.append("input")
        .attr("type", "range")
        .attr("value", max/2)
        .attr("id", "thresholdSlider")
        .attr("min", min)
        .attr("max", max)
        .attr("step",max/1000)
        .on("change", function () {
            modelLeft.setThreshold(Math.floor(this.value*100)/100);
            modelRight.setThreshold(Math.floor(this.value*100)/100);
            updateScenes();
            document.getElementById("thresholdSliderLabel").innerHTML = "Threshold @ " + this.value;
        });

    modelLeft.setThreshold(Math.floor(max*100/2)/100);
    modelRight.setThreshold(Math.floor(max*100/2)/100);

    menu.append("label")
        .attr("for", "opacitySlider")
        .attr("id", "opacitySliderLabel")
        .text("Opacity @ " + 1.);
    menu.append("input")
        .attr("type", "range")
        .attr("value", 100)
        .attr("id", "opacitySlider")
        .attr("min", 0)
        .attr("max", 100)
        .attr("step",1)
        .on("change", function () {
            updateOpacity(Math.floor(this.value)/100);
            document.getElementById("opacitySliderLabel").innerHTML = "Opacity @ " + this.value/100.;
        });

    menu.append("label")
        .attr("for", "enableEBCheck")
        .attr("id", "enableEBCheckLabel")
        .text("Enable EB:");
    menu.append("input")
        .attr("type", "checkbox")
        .attr("checked", true)
        .attr("id", "enableEBCheck")
        .on("change", function () {
            enableEdgeBundling(this.checked);
        });
};

// remove threshold slider and its labels
removeThresholdSlider = function() {
    var elem = document.getElementById('thresholdSlider');

    if(elem) {
        elem.parentNode.removeChild(elem);
    }

    elem = document.getElementById('thresholdSliderLabel');
    if(elem) {
        elem.parentNode.removeChild(elem);
    }
};

// add slider to filter the top N edges in terms of value
addTopNSlider = function() {
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
removeTopNSlider= function() {

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
removeElementsFromEdgePanel = function() {
    removeThresholdSlider();
    removeTopNSlider();
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
var createLegend = function(model) {
    var legendMenu = document.getElementById("legend");

    while(legendMenu.hasChildNodes()){
        legendMenu.removeChild(legendMenu.childNodes[0]);
    }

    legendMenu = d3.select("#legend");

    if(model.getActiveGroup() != 4) {
        var activeGroup = model.getGroup();
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

var addDistanceSlider = function(distances) {
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

// remove
removeDistanceSlider = function() {
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

// add a slider that filters shortest paths by the number of hops
shortestPathSliderHops = function() {

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

shortestPathDistanceUI = function() {

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

// remove the shortest path number of hops filter
removeNumberOfHopsSlider = function() {
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

// add "Change Modality" button to toggle between:
// edge threshold and top N edges
addModalityButton = function() {

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
changeModality = function(modality) {
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

// add "Color Coding" radio button group containing:
// Anatomy, Embeddedness and Rich Club groups
addGroupList = function() {
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
            setColorClusteringSliderVisibility("hidden");
            changeColorGroup(this.value);
        });
    menu.append("label")
        .attr("for","anatomy")
        .text("Anatomy");
    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","colorGroup")
        .attr("id","embeddedness")
        .attr("value","1")
        .on("change", function () {
            setColorClusteringSliderVisibility("hidden");
            changeColorGroup(this.value);
        });
    menu.append("label")
        .attr("for","embeddedness")
        .text("Embeddedness");
    menu.append("br");

    menu.append("input")
        .attr("type", "radio")
        .attr("name","colorGroup")
        .attr("value","2")
        .attr("id","richClub")
        .on("change", function () {
            setColorClusteringSliderVisibility("hidden");
            changeColorGroup(this.value);
        });
    menu.append("label")
        .attr("for","richClub")
        .text("Rich Club");
    menu.append("br");

    if (modelLeft.hasClusteringData() && modelRight.hasClusteringData()) {
        menu.append("input")
            .attr("type", "radio")
            .attr("name","colorGroup")
            .attr("value","3")
            .attr("id","PLACE")
            .on("change", function () {
                setColorClusteringSliderVisibility("visible");
                changeColorGroup(this.value);
            });
        menu.append("label")
            .attr("for","PLACE")
            .text("PLACE");
        menu.append("br");
        addColorClusteringSlider();
    }

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
            .attr("value","4")
            .attr("id","metric")
            .on("change", function () {
                changeColorGroup(this.value);
            });
        menu.append("label")
            .attr("for","metric")
            .text("Custom Group");
        menu.append("br");
    }

    setColorClusteringSliderVisibility("hidden");
};

addColorClusteringSlider = function() {
    var menu = d3.select("#upload");
    menu.append("br");
    menu.append("label")
        .attr("for", "colorClusteringSlider")
        .attr("id", "colorClusteringSliderLabel")
        .text("Level 4");
    menu.append("input")
        .attr("type", "range")
        .attr("value", 4)
        .attr("id", "colorClusteringSlider")
        .attr("min", 1)
        .attr("max", 4)
        .attr("step", 1)
        .on("change", function () {
            document.getElementById("colorClusteringSliderLabel").innerHTML = "Level " + this.value;
            modelLeft.updateClusteringGroupLevel(this.value);
            modelRight.updateClusteringGroupLevel(this.value);
            changeColorGroup(3);
        });
};

setColorClusteringSliderVisibility = function(value) {
    var elem = document.getElementById('colorClusteringSlider');
    if (elem)
        elem.style.visibility = value;
    elem = document.getElementById('colorClusteringSliderLabel');
    if (elem)
        elem.style.visibility = value;
};

// add "Topological Spaces" radio button group for scene containing:
// Isomap, MDS, tSNE and anatomy spaces
addGeometryRadioButtons = function(model, side) {

    var topologies = model.getTopologies();
    var menu = d3.select("#topology" + side);

    menu.append("br");

    menu.append("label")
        .attr("for","geometry" + side)
        .text("Topological Space:");
    menu.append("br");

    for (var i = 0; i <topologies.length; i++) {
        var topology = topologies[i];
        var ip = menu.append("input")
            .attr("type", "radio")
            .attr("name","geometry" + side)
            .attr("id",topology + side)
            .attr("value",topology)
            .attr("checked", "false");
        switch (topology) {
            case ("PLACE"):
            case ("PACE"):
                ip.on("change", function () {
                    setClusteringSliderVisibility(side, "visible");
                    changeActiveGeometry(model, side, this.value);
                });
                break;
            default:
                ip.on("change", function () {
                    setClusteringSliderVisibility(side, "hidden");
                    changeActiveGeometry(model, side, this.value);
                });
                break;
        }
        menu.append("label")
            .attr("for",topology)
            .text(topology);
        menu.append("br");

        switch (topology) {
            case ("PLACE"):
            case ("PACE"):
                addClusteringSlider(model, side);
                break;
        }
    }

    setClusteringSliderVisibility(side, "hidden");
    document.getElementById(topologies[0] + side).checked = "true";
};

removeGeometryButtons = function (side) {
    var menu = document.getElementById("topology" + side);
    while (menu.firstChild) {
        menu.removeChild(menu.firstChild);
    }
};

addClusteringSlider = function(model, side) {
    var menu = d3.select("#topology" + side);

    menu.append("br");
    menu.append("label")
        .attr("for", "clusteringSlider" + side)
        .attr("id", "clusteringSliderLabel" + side)
        .text("Level " + model.getClusteringLevel());
    menu.append("input")
        .attr("type", "range")
        .attr("value", model.getClusteringLevel())
        .attr("id", "clusteringSlider" + side)
        .attr("min", 1)
        .attr("max", 4)
        .attr("step", 1)
        .on("change", function () {
            model.setClusteringLevel(parseInt(this.value));
            redrawScene(model, side);
            document.getElementById("clusteringSliderLabel" + side).innerHTML = "Level " + this.value;
        });
};

setClusteringSliderVisibility = function(side, value) {
    var elem = document.getElementById('clusteringSlider' + side);
    if (elem)
        elem.style.visibility = value;
    elem = document.getElementById('clusteringSliderLabel' + side);
    if (elem)
        elem.style.visibility = value;
};

// add labels check boxes, appear/disappear on right click
addFslRadioButton = function() {
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
searchElement = function(index) {
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
    $('#topologyLeft').toggle();
    $('#topologyRight').toggle();
    $('#legend').toggle();
    $('#nodeInfoPanel').toggle();
    $('#upload').toggle();
    $('#edgeInfoPanel').toggle();
    $('#search').toggle();
    $("#rightFslLabels").toggle();
    $('#leftFslLabels').toggle();
};