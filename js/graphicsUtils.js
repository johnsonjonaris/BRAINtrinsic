/**
 * Created by giorgioconte on 26/02/15.
 */

var shpereRadius = 3.0;
var selectedCircleRadius = 5.0;
var rootCircleRadius = 6.0;
var sphereResolution = 12;
var dimensionFactor = 1;

createNormalGeometry = function(hemisphere){
    if(hemisphere == "left"){
        return new THREE.SphereGeometry( dimensionFactor * shpereRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor * shpereRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

createSelectedGeometry = function (hemisphere) {
    if(hemisphere == "left"){
        return new THREE.SphereGeometry( dimensionFactor * selectedCircleRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor*selectedCircleRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

createRootGeometry = function(hemisphere){
    if(hemisphere == "left"){
        return new THREE.SphereGeometry(dimensionFactor * rootCircleRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor * rootCircleRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

createRootGeometryByObject = function (obj) {
    return createRootGeometry(obj.userData.hemisphere);
};

createNormalGeometryByObject = function(obj){
    if(obj)
        return createNormalGeometry(obj.userData.hemisphere);
};

createSelectedGeometryByObject = function (obj) {
    return createSelectedGeometry(obj.userData.hemisphere);
};

setDimensionFactor = function(value){
    dimensionFactor = value;
};

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