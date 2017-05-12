
GFX.State3D = function ( state ) {

    this.position = new THREE.Vector3();         // the position of the cube center of mass in world coordinates (meters).
    this.momentum = new THREE.Vector3();         // the momentum of the cube in kilogram meters per second.
    this.orientation = new THREE.Quaternion();   // the orientation of the cube represented by a unit THREE.Quaternion.
    this.angularMomentum = new THREE.Vector3();  // angular momentum vector.

    // secondary state
    this.velocity = new THREE.Vector3();         // velocity in meters per second (calculated from momentum).
    this.spin = new THREE.Quaternion();    // Quaternion rate of change in orientation.
    this.angularVelocity = new THREE.Vector3();  // angular velocity (calculated from angularMomentum).
    this.bodyToWorld = new THREE.Matrix4();      // body to world coordinates matrix.
    this.worldToBody = new THREE.Matrix4();      // world to body coordinates matrix.

    // constant state
    this.size = 0;                               // length of the cube sides in meters.
    this.mass = 0;                               // mass of the cube in kilograms.
    this.inverseMass = 0;                        // inverse of the mass used to convert momentum to velocity.
    this.inertiaTensor = 0;                      // inertia tensor of the cube (it is simplified it to a single value due to the mass properties a cube).
    this.inverseInertiaTensor = 0;               // inverse inertia tensor used to convert angular momentum to angular velocity.

    this.quat05 = new THREE.Quaternion( 0.5, 0.5, 0.5, 0.5 );

    if (state !== undefined)
        this.set( state );
};

GFX.State3D.prototype = {

    copy: function ( state ) {
        set( state );
    },

    set: function ( state )	{
        this.position.copy(state.position);
        this.momentum.copy(state.momentum);
        this.orientation.copy(state.orientation);
        this.angularMomentum.copy(state.angularMomentum);

        this.velocity.copy(state.velocity);
        this.spin.copy(state.spin);
        this.angularVelocity.copy(state.angularVelocity);
        this.bodyToWorld.copy(state.bodyToWorld);
        this.worldToBody.copy(state.worldToBody);

        this.size = state.size;
        this.mass = state.mass;
        this.inverseMass = state.inverseMass;
        this.inertiaTensor = state.inertiaTensor;
        this.inverseInertiaTensor = state.inverseInertiaTensor;
    },

     // Recalculate secondary state values from primary values.
    recalculate: function () {
        this.velocity.copy( this.momentum );
        this.velocity.multiplyScalar(this.inverseMass);
        this.angularVelocity.copy( this.angularMomentum  );
        this.angularVelocity.multiplyScalar( this.inverseInertiaTensor );
        this.orientation.normalize();

        this.spin.set(0, this.angularVelocity.x, this.angularVelocity.y, this.angularVelocity.z);
        this.spin.multiply(this.quat05);
        this.spin.multiply(this.orientation);

        var translation = new THREE.Matrix4();
        //translation.identity();
        translation.setPosition(this.position);
        this.bodyToWorld.multiplyMatrices( translation, this.getMatrix(this.orientation) );
        this.worldToBody.getInverse( this.bodyToWorld );
    },
    
    getMatrix: function ( q ) {

        // from david eberly's sources used with permission. https://www.geometrictools.com/

        var fTx = 2.0 * q.x;
        var fTy = 2.0 * q.y;
        var fTz = 2.0 * q.z;
        var fTwx = fTx * q.w;
        var fTwy = fTy * q.w;
        var fTwz = fTz * q.w;
        var fTxx = fTx * q.x;
        var fTxy = fTy * q.x;
        var fTxz = fTz * q.x;
        var fTyy = fTy * q.y;
        var fTyz = fTz * q.y;
        var fTzz = fTz * q.z;

        var mat =  new THREE.Matrix4();
        mat.set( 1.0 - (fTyy + fTzz), fTxy - fTwz, fTxz + fTwy, 0.0,
            fTxy + fTwz, 1.0 - (fTxx + fTzz), fTyz - fTwx,
            0.0, fTxz - fTwy, fTyz + fTwx, 1.0 - (fTxx + fTyy),
            0.0, 0.0, 0.0, 0.0, 1.0);
        return mat;
    }
};



