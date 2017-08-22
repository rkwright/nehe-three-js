/**
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 *
 * CylinderUtil.js
 *
 */
GFX.CylinderUtil = function () {
    this.direction = new THREE.Vector3();
    this.orientation = new THREE.Matrix4();
    this.threeUp = new THREE.Object3D().up;
    this.matrix = new THREE.Matrix4();
};

GFX.CylinderUtil.prototype = {

    createCylinder: function ( point0, point1, diameter, segments, material ) {
        this.direction.subVectors(point1, point0);
        this.orientation.lookAt(point0, point1, this.threeUp);

        this.matrix.set( 1,  0, 0, 0,
                         0,  0, 1, 0,
                         0, -1, 0, 0,
                         0,  0, 0, 1 );
        this.orientation.multiply(this.matrix);
        var cylinderGeom = new THREE.CylinderGeometry(diameter, diameter, this.direction.length(), segments, 1);
        var cylinderMesh = new THREE.Mesh( cylinderGeom, material );
        cylinderMesh.applyMatrix(this.orientation);

        // position based on midpoints - there may be a better solution than this
        cylinderMesh.position.x = (point1.x + point0.x) / 2;
        cylinderMesh.position.y = (point1.y + point0.y) / 2;
        cylinderMesh.position.z = (point1.z + point0.z) / 2;

        return cylinderMesh;
    },

    alignCylinder: function ( point0, point1, cylinderMesh ) {
        this.direction.subVectors(point1, point0);
        this.orientation.lookAt(point0, point1, this.threeUp);

        this.matrix.set( 1,  0, 0, 0,
            0,  0, 1, 0,
            0, -1, 0, 0,
            0,  0, 0, 1 );
        this.orientation.multiply(this.matrix);
        cylinderMesh.matrix.identity();
        cylinderMesh.applyMatrix(this.orientation);

        // position based on midpoints - there may be a better solution than this
        cylinderMesh.position.x = (point1.x + point0.x) / 2;
        cylinderMesh.position.y = (point1.y + point0.y) / 2;
        cylinderMesh.position.z = (point1.z + point0.z) / 2;

        cylinderMesh.geometry.verticesNeedUpdate = true;

    }
};



