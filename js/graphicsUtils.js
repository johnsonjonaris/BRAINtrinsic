/**
 * Created by giorgioconte on 26/02/15.
 */

var shpereRadius = 3.0;             // normal sphere radius
var selectedCircleRadius = 8.0;     // selected sphere radius
var rootCircleRadius = 10.0;        // root sphere radius
var sphereResolution = 12;
var dimensionFactor = 1;

// create normal edge geometry: sphere or cube
createNormalGeometry = function(hemisphere) {
    if(hemisphere == "left"){
        return new THREE.SphereGeometry( dimensionFactor * shpereRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor * shpereRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

// create selected edge geometry: sphere or cube
createSelectedGeometry = function(hemisphere) {
    if(hemisphere == "left"){
        return new THREE.SphereGeometry( dimensionFactor * selectedCircleRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor*selectedCircleRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

// create root geometry
createRootGeometry = function(hemisphere) {
    if(hemisphere == "left"){
        return new THREE.SphereGeometry(dimensionFactor * rootCircleRadius, sphereResolution, sphereResolution);
    } else if(hemisphere == "right"){
        var side = dimensionFactor * rootCircleRadius;
        return new THREE.BoxGeometry( side, side, side);
    }
};

// create root geometry from a 3js object using its userData
createRootGeometryByObject = function(obj) {
    return createRootGeometry(obj.userData.hemisphere);
};

// create normal edge geometry from a 3js object using its userData
createNormalGeometryByObject = function(obj) {
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

// return the material for a node (vertex) according to its state: active or transparent
getNormalMaterial = function(model, group, nodeIndex) {
    var material;
    switch (model.getRegionState(group)){
        case 'active':
            material = new THREE.MeshPhongMaterial({
                color: scaleColorGroup(model, group, nodeIndex),
                shininess: 15,
                transparent: false,
                specular: 0x222222,
                reflectivity:1.3,
                opacity: 1.0
            });
            break;
        case 'transparent':
            material = new THREE.MeshPhongMaterial({
                color: scaleColorGroup(model, group, nodeIndex),
                shininess: 50,
                transparent: true,
                opacity: 0.3
            });
            break;
    }
    return material;
};

/**
 * Distribute n points uniformly on a circle
 * @param n     number of points
 * @param R     radius of the circle
 * @param c     center of the circle in 3D
 * @param v1    unit vector in the plane containing the circle
 * @param v2    unit vector in the plane containing the circle
 * @returns {*} array of the coordinates of the points
 */
sunflower = function(n, R, c, v1, v2) {
    var alpha = 2;
    var b = Math.round(alpha*Math.sqrt(n));      // number of boundary points
    var phi = (Math.sqrt(5)+1)/2;           // golden ratio
    var k = math.range(1,n+1);
    var theta = math.multiply(k, (2*Math.PI)/(phi*phi));
    var r = math.divide(math.sqrt(math.add(k,-0.5)), Math.sqrt(n-(b+1)/2));
    var idx = math.larger(k, n-b);
    // r( k > n-b ) = 1; % put on the boundary
    r = math.add(math.dotMultiply(r, math.subtract(1,idx)),idx);
    var tmp1 = math.dotMultiply(math.cos(theta),r);
    var tmp2 = math.dotMultiply(math.sin(theta),r);
    var points = [math.add(math.add(math.multiply(tmp1,v1[0]*R), math.multiply(tmp2,v2[0]*R)), c[0]),
                  math.add(math.add(math.multiply(tmp1,v1[1]*R), math.multiply(tmp2,v2[1]*R)), c[1]),
                  math.add(math.add(math.multiply(tmp1,v1[2]*R), math.multiply(tmp2,v2[2]*R)), c[2])];
    return math.transpose(points);
};