/* Code from Game Physics by Glen Fielder
*
* http://gafferongames.com/game-physics/physics-in-3d/
*
* A cube with self contained physics simulation.
*
* This class is responsible for maintaining and integrating its
* physics state using an RK4 integrator. The nature of the
* integrator requires that we structure this class in such a
* way that all forces can be calculated from the current physics
* state at any time. See Cube::integrate for details.
*
*  @author:  Ric Wright - May 2017 - Ported from Java version
*/

GFX.Physics3D = function ( renderfunc ) {

    this.TIME_CLAMP = 0.250;
    this.TIME_STEP = 0.01;
    this.DAMPING_TORQUE = -0.5;
    this.FORCE_X = 0;
    this.FORCE_Y = 2;
    this.FORCE_Z = 0;
    this.FORCE_SCALE = -5.0;
    this.TORQUE_X = 0.0;
    this.TORQUE_Y = 1.0;
    this.TORQUE_Z = 0.0;

    this.start = 0;

    this.previous = new GFX.State3D();	// previous physics state.
    this.current = new GFX.State3D();		// current physics state.

    this.t = 0;
    this.dt = this.TIME_STEP;

    this.currentTime = this.time();
    this.accumulator = 0;

    this.tmpState = new GFX.State3D();
    this.tmpVec = new THREE.Vector3();

    this.renderFunc = null;

    this.initState( renderfunc );
};

GFX.Physics3D.prototype = {

    initState: function (renderFunc) {

        this.renderFunc = renderFunc;

        this.current = new GFX.State3D();
        this.current.size = 1.0;
        this.current.mass = 1;
        this.current.inverseMass = 1.0 / this.current.mass;
        this.current.position = new THREE.Vector3(0, 5, 0);
        this.current.momentum = new THREE.Vector3(0, 0, 0);
        //this.current.orientation.identity();
        this.current.angularMomentum = new THREE.Vector3(0, 0, 0);
        this.current.inertiaTensor = this.current.mass * this.current.size * this.current.size / 6.0;
        this.current.inverseInertiaTensor = 1.0 / this.current.inertiaTensor;
        this.current.recalculate();

        this.previous = new GFX.State3D();
        this.previous.set(this.current);

        this.interpState = new GFX.State3D();
    },

    /**
     * Simple time function that wraps the nanosecond precision timer
     */
    time: function () {
        if (this.start === 0) {
            this.start = performance.now();
            return 0.0;
        }

        return (performance.now() - this.start) / 1e03;
    },

    timeStep: function () {
        var newTime = this.time();
        var deltaTime = newTime - this.currentTime;
        this.currentTime = newTime;

        if (deltaTime > this.TIME_CLAMP)
            deltaTime = this.TIME_CLAMP;

        this.accumulator += deltaTime;

        //console.log("Accum:" + this.accumulator.toFixed(2) + " t: " + this.t.toFixed(2) );

        while (this.accumulator >= this.dt) {
            this.accumulator -= this.dt;

            this.update();

            this.t += this.dt;
        }

        var alpha = this.accumulator / this.dt;
        this.interpState = this.interpolate(this.previous, this.current, alpha);

        this.renderFunc(this.interpState);

        return 0;
    },

    // Update physics state.
    update: function () {
        this.previous.set(this.current);
        this.integrate(this.current, this.t, this.dt);
    },

    // Interpolate between two physics states.
    interpolate: function (prev, curr, alpha) {
        this.interpState.set(curr);

        this.interpState.position.lerpVectors(prev.position, curr.position, alpha);
        this.interpState.momentum.lerpVectors(prev.momentum, curr.momentum, alpha);
        //state.orientation.slerp(prev.orientation, curr.orientation, alpha);
        THREE.Quaternion.slerp( prev.orientation, curr.orientation, this.interpState.orientation, alpha );
        this.interpState.angularMomentum.lerpVectors(prev.angularMomentum, curr.angularMomentum, alpha);

        this.interpState.recalculate();

        return this.interpState;
    },

    // Evaluate all derivative values for the physics state at time t.
    // @param state the physics state of the cube.
    evaluate: function (state, t) {
        var output = new GFX.Derivative();
        output.velocity.copy(state.velocity);
        output.spin.copy(state.spin);

        this.forces(state, t, output.force, output.torque);

        return output;
    },

    // Evaluate derivative values for the physics state at future time t+dt 
    // using the specified set of derivatives to advance dt seconds from the 
    // specified physics state.
    evaluate_dt: function (state, t, dt, derivative) {

        state.position.copy( state.position);
        state.position.addScaledVector( derivative.velocity, dt);

        state.momentum.copy( state.momentum );
        state.momentum.addScaledVector(derivative.force, dt );

        state.orientation.w += derivative.spin.w * dt;
        state.orientation.x += derivative.spin.x * dt;
        state.orientation.y += derivative.spin.y * dt;
        state.orientation.z += derivative.spin.z * dt;
        //state.orientation.add(derivative.spin.multiplyScalar(dt));

        state.angularMomentum.copy(state.angularMomentum);
        state.angularMomentum.addScaledVector( derivative.torque, dt );

        state.recalculate();

        var output = new GFX.Derivative();
        output.velocity.copy(state.velocity);
        output.spin.copy(state.spin);

        this.forces(state, t + dt, output.force, output.torque);

        return output;
    },

    // Integrate physics state forward by dt seconds.
    // Uses an RK4 integrator to numerically integrate with error O(5).
    integrate: function (state, t, dt) {

        var a = this.evaluate(state, t);
        this.tmpState.set(state);
        var b = this.evaluate_dt( this.tmpState, t, dt * 0.5, a);
        this.tmpState.set(state);
        var c = this.evaluate_dt( this.tmpState, t, dt * 0.5, b);
        this.tmpState.set(state);
        var d = this.evaluate_dt( this.tmpState, t, dt, c);

        this.rkVector(state.position, a.velocity, b.velocity, c.velocity, d.velocity, dt);
        this.rkVector(state.momentum, a.force, b.force, c.force, d.force, dt);
        this.rkIntegrateAdd(state.orientation, a.spin, b.spin, c.spin, d.spin, dt);
        this.rkVector(state.angularMomentum, a.torque, b.torque, c.torque, d.torque, dt);

        state.recalculate();
    },

    rkVector: function (vec3, a, b, c, d, dt) {
        this.tmpVec.set(0.0, 0.0, 0.0);
        this.tmpVec.addVectors(b, c);
        this.tmpVec.multiplyScalar(2.0);
        this.tmpVec.add(a);
        this.tmpVec.add(d);
        this.tmpVec.multiplyScalar(dt / 6.0);
        vec3.add(this.tmpVec);
    },

    // from eberly =============
    addQuaternion: function ( tmp, q ) {
        tmp.w += q.w;
        tmp.x += q.x;
        tmp.y += q.y;
        tmp.z += q.z;
        return tmp;
    },

    // multiply this quaternion by a scalar.
    multiplyQuaternion: function( tmp, s ) {
        tmp.w *= s;
        tmp.x *= s;
        tmp.y *= s;
        tmp.z *= s;
        return tmp;
    },

    rkIntegrateAdd: function ( orient, a, b, c, d, dt ) {
        var  tmp = new THREE.Quaternion(b.x, b.y, b.z, b.w);
        tmp = this.addQuaternion(tmp, c);
        tmp = this.multiplyQuaternion(tmp, 2.0);
        tmp = this.addQuaternion(tmp, a);
        tmp = this.addQuaternion(tmp, d);
        tmp = this.multiplyQuaternion(tmp, dt / 6.0);
        this.addQuaternion(orient, tmp);
    },
    //====================== eberly

    // Calculate force and torque for physics state at time t.
    // Due to the way that the RK4 integrator works we need to calculate
    // force implicitly from state rather than explicitly applying forces
    // to the rigid body once per update. This is because the RK4 achieves
    // its accuracy by detecting curvature in derivative values over the 
    // timestep so we need our force values to supply the curvature.
    forces: function (state, t, force, torque) {

        // attract towards origin
        force.copy(state.position);
        force.multiplyScalar(this.FORCE_SCALE);

        // sine force to add some randomness to the motion
        force.x += this.FORCE_X; // * Math.sin(t * 0.9 + 0.5);
        force.y += this.FORCE_Y; // * Math.sin(t * 0.5 + 0.4);
        force.z += this.FORCE_Z; // * Math.sin(t * 0.5 + 0.4);

        // sine torque to get some spinning action

        torque.x = this.TORQUE_X; //  * Math.sin(t * 0.9 + 0.5);
        torque.y = this.TORQUE_Y; // * Math.sin(t * 0.5 + 0.4);
        torque.z = this.TORQUE_Z; // * Math.sin(t * 0.7 + 0.9);

        // damping torque so we don't spin too fast
        //torque.copy( torque );
        torque.addScaledVector( state.angularVelocity, this.DAMPING_TORQUE );
    }
};

	
