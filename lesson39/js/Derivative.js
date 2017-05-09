// Derivative values for primary state.
// This structure stores all derivative values for primary state in Cube::State.
// For example velocity is the derivative of position, force is the derivative
// of momentum etc. Storing all derivatives in this structure makes it easy
// to implement the RK4 integrator cleanly because it needs to calculate the
// and store derivative values at several points each timestep.

GFX.Derivative = function () {



	this.velocity = new THREE.Vector3();        // velocity is the derivative of position.
	this.force    = new THREE.Vector3();        // force in the derivative of momentum.
    this.spin     = new THREE.Quaternion();     // spin is the derivative of the orientation quaternion.
	this.torque   = new THREE.Vector3();        // torque is the derivative of angular momentum.
};
