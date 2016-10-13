/**
 * Created by giorgioconte on 26/02/15.
 */

var shpereRadius = 3.0;             // normal sphere radius
var selectedCircleRadius = 5.0;     // selected sphere radius
var rootCircleRadius = 8.0;         // root sphere radius
var sphereResolution = 12;
var dimensionFactor = 1;

// create normal edge geometry: sphere or cube
createNormalGeometry = function(hemisphere){
    if(hemisphere == "left"){
        return new THREE.SphereGeometry( dimensionFactor * shpereRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor * shpereRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

// create selected edge geometry: sphere or cube
createSelectedGeometry = function (hemisphere) {
    if(hemisphere == "left"){
        return new THREE.SphereGeometry( dimensionFactor * selectedCircleRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor*selectedCircleRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

// create root geometry
createRootGeometry = function(hemisphere){
    if(hemisphere == "left"){
        return new THREE.SphereGeometry(dimensionFactor * rootCircleRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor * rootCircleRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

// create root geometry from a 3js object using its userData
createRootGeometryByObject = function (obj) {
    return createRootGeometry(obj.userData.hemisphere);
};

// create normal edge geometry from a 3js object using its userData
createNormalGeometryByObject = function(obj){
    if(obj)
        return createNormalGeometry(obj.userData.hemisphere);
};

// create selected edge geometry from a 3js object using its userData
createSelectedGeometryByObject = function (obj) {
    return createSelectedGeometry(obj.userData.hemisphere);
};

// set the dimension factor
setDimensionFactor = function(value){
    dimensionFactor = value;
};

// return the material for an edge according to its state: active or transparent
getNormalMaterial = function (group, nodeIndex){
    var material;
    switch (regionState[group]){
        case 'active':
            material = new THREE.MeshPhongMaterial({
                color: scaleColorGroup(group, nodeIndex),
                shininess: 15,
                transparent: false,
                specular: 0x222222,
                reflectivity:1.3,
                opacity: 1.0
            });
            break;
        case 'transparent':
            material = new THREE.MeshPhongMaterial({
                color: scaleColorGroup(group, nodeIndex),
                shininess: 50,
                transparent: true,
                opacity: 0.3
            });
            break;
    }
    return material;
};