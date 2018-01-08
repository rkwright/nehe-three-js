/*
*  Inspired in part by
*  http://gafferongames.com/game-physics/physics-in-3d/
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

GFX.Physics3D = function ( renderFunc,
                           forceFunc,
                           position,
                           momentum,
                           mass,
                           size ) {

    this.TIME_CLAMP = 0.250;
    this.TIME_STEP = 0.01;

    this.start = 0;
    this.t = 0;
    this.dt = this.TIME_STEP;
    this.currentTime = this.time();
    this.accumulator = 0;

    this.previous = new GFX.State3D( position, momentum, mass, size  );	    // previous physics state.
    this.current  = new GFX.State3D( position, momentum, mass, size );		// current physics state.

    // temp variable states (args are dummies)
    this.interpState = new GFX.State3D( position, momentum, mass, size );
    this.tmpState = new GFX.State3D( position, momentum, mass, size );

    this.tmpVec = new THREE.Vector3();

    this.renderFunc = renderFunc;
    this.forceFunc = forceFunc;
};

GFX.Physics3D.prototype = {

    /**
     * Simple time function that wraps the millisecond precision timer
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

    // Interpolate between two physics states.
    interpolate: function (prev, curr, alpha) {
        this.interpState.copy(curr);

        this.interpState.position.lerpVectors(prev.position, curr.position, alpha);
        this.interpState.momentum.lerpVectors(prev.momentum, curr.momentum, alpha);
        //state.orientation.slerp(prev.orientation, curr.orientation, alpha);
        THREE.Quaternion.slerp( prev.orientation, curr.orientation, this.interpState.orientation, alpha );
        this.interpState.angularMomentum.lerpVectors(prev.angularMomentum, curr.angularMomentum, alpha);

        this.interpState.recalculate();

        return this.interpState;
    },

    // Update physics state.
    update: function () {
        this.previous.copy(this.current);
        this.integrate(this.current, this.t, this.dt);
    },

    // Integrate physics state forward by dt seconds.
    // Uses an RK4 integrator to numerically integrate with error O(5).
    integrate: function (state, t, dt) {

        var a = this.evaluate(state, t);
        this.tmpState.copy(state);
        var b = this.evaluate_dt( this.tmpState, t, dt * 0.5, a);
        this.tmpState.copy(state);
        var c = this.evaluate_dt( this.tmpState, t, dt * 0.5, b);
        this.tmpState.copy(state);
        var d = this.evaluate_dt( this.tmpState, t, dt, c);

        this.rkVector(state.position, a.velocity, b.velocity, c.velocity, d.velocity, dt);
        this.rkVector(state.momentum, a.force, b.force, c.force, d.force, dt);
        this.rkIntegrateAdd(state.orientation, a.spin, b.spin, c.spin, d.spin, dt);
        this.rkVector(state.angularMomentum, a.torque, b.torque, c.torque, d.torque, dt);

        state.recalculate();
    },

    // Evaluate all derivative values for the physics state at time t.
    // @param state the physics state of the cube.
    evaluate: function (state, t) {
        var output = new GFX.Derivative();
        output.velocity.copy(state.velocity);
        output.spin.copy(state.spin);

        this.forceFunc( state, t, output );

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

        this.forceFunc( state, t + dt, output );

        return output;
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
    }
    //====================== eberly


};

	
