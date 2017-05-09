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

GFX.Physics3D = function () {

    this.TIME_CLAMP = 0.250;
    this.TIME_STEP = 0.01;
    this.DAMPING_TORQUE = -0.5;
    this.FORCE_X = 10;
    this.FORCE_Y = 11;
    this.FORCE_Z = 12;
    this.FORCE_SCALE = -10.0;
    this.TORQUE_X = 1.0;
    this.TORQUE_Y = 1.1;
    this.TORQUE_Z = 1.2;

    this.start = 0;

    this.previous = new GFX.State();		// previous physics state.
    this.current = new GFX.State();		// current physics state.

    this.t = 0;
    this.dt = TIME_STEP;

    this.currentTime = time();
    this.accumulator = 0;

    this.tmpState = new GFX.State();
    this.tmpVec = new THREE.Vector3();

    this.renderFunc = null;
};

GFX.Physics3D.prototype = {
    
	initState: function( renderFunc ) {

        this.renderFunc = renderFunc;

		this.current = new GFX.State3D();
        this.current.size = 1.0;
        this.current.mass = 1;
        this.current.inverseMass = 1.0 / this.current.mass;
        this.current.position = new THREE.Vector3(2,0,0);
        this.current.momentum = new THREE.Vector3(0,0,-10);
        this.current.orientation.identity();
        this.current.angularMomentum = new THREE.Vector3(0,0,0);
        this.current.inertiaTensor = this.current.mass * this.current.size * this.current.size / 6.0;
        this.current.inverseInertiaTensor = 1.0 / this.current.inertiaTensor;
        this.current.recalculate();
		
		previous = new State();
	}

	/**
	 * Simple time function that wraps the nanosecond precision timer
	 */
	time: function() {
	    if (start === 0) {
	        start = Performance.now();
	        return 0.0;
	    }
	    
	    return  (Performance.now() - start) / 1e09;
	},
		
	timeStep: function () {
		var newTime = time();
		var deltaTime = newTime - currentTime;
		this.currentTime = newTime;

		if (deltaTime > this.TIME_CLAMP)
			deltaTime = this.TIME_CLAMP;

		this.accumulator += deltaTime;

		// console.log("Accum:" + String.format("%6.2f", accumulator) + " t: " + String.format("%6.2f", t) );
		
		while (this.accumulator >= this.dt) {
			this.accumulator -= this.dt;
			
			this.update();
			
			this.t += this.dt;
		}

		var alpha = this.accumulator / this.dt;
        var state = interpolate(this.previous, this.current, alpha);

        this.renderFunc( state );

        return 0;
	}
	
    // Update physics state.
	update: function () {
        this.previous.set(this.current);
        this.integrate( this.current, this.t, this.dt );
    },
    
    // Interpolate between two physics states.
	protected State interpolate( State prev, State curr, double alpha)
	{
		State state = new State(curr);

		state.position.interpolate(prev.position, curr.position, alpha);
		state.momentum.interpolate(prev.momentum,curr.momentum,alpha);
		state.orientation.slerp(prev.orientation, curr.orientation, alpha);
		state.angularMomentum.interpolate(prev.angularMomentum, curr.angularMomentum ,alpha);
		
		state.recalculate();
		
		return state;
	}


  
    // Evaluate all derivative values for the physics state at time t.
    // @param state the physics state of the cube.
	Derivative evaluate( State state, double t)
	{
		Derivative output = new Derivative();
		output.velocity.set(state.velocity);
		output.spin.set(state.spin);
		
		forces(state, t, output.force, output.torque);
		
		return output;
	}
	
    // Evaluate derivative values for the physics state at future time t+dt 
    // using the specified set of derivatives to advance dt seconds from the 
    // specified physics state.
	protected Derivative evaluate(State state, double t, double dt,  Derivative derivative)
	{
		state.position.scaleAdd(dt, derivative.velocity, state.position);
		state.momentum.scaleAdd(dt, derivative.force, state.momentum);
		state.orientation.add(derivative.spin.scale(dt));
		state.angularMomentum.scaleAdd( dt, derivative.torque, state.angularMomentum);
		
		state.recalculate();
		
		Derivative output = new Derivative();
		output.velocity.set(state.velocity);
		output.spin.set(state.spin);
		
		forces(state, t+dt, output.force, output.torque);
		
		return output;
	}

    // Integrate physics state forward by dt seconds.
    // Uses an RK4 integrator to numerically integrate with error O(5).
	
	
	protected void integrate( State state, double t, double dt )
	{
		Derivative a = evaluate(state, t);
		tmpState.set(state);
		Derivative b = evaluate(tmpState, t, dt*0.5f, a);
		tmpState.set(state);
		Derivative c = evaluate(tmpState, t, dt*0.5f, b);
		tmpState.set(state);
		Derivative d = evaluate(tmpState, t, dt, c);
			
		rkVector(state.position, a.velocity, b.velocity,c.velocity, d.velocity, dt);
		rkVector(state.momentum, a.force, b.force, c.force, d.force, dt);
		state.orientation.rkIntegrateAdd(a.spin, b.spin, c.spin, d.spin, dt);
		rkVector(state.angularMomentum, a.torque, b.torque, c.torque, d.torque, dt);

		state.recalculate();
		
		try
		{
			Thread.sleep(0,0);
		}
		catch (InterruptedException e)
		{
			e.printStackTrace();
		}

	}	

	
	protected void rkVector( THREE.Vector3 state, THREE.Vector3 a, THREE.Vector3 b, THREE.Vector3 c, THREE.Vector3 d, double dt )
	{
		tmpVec.set(0.0, 0.0, 0.0);
		tmpVec.add(b,c);
		tmpVec.scale(2.0);
		tmpVec.add(a);
		tmpVec.add(d);
		tmpVec.scale(dt/6.0);
		state.add(tmpVec);		
	}
	
    // Calculate force and torque for physics state at time t.
    // Due to the way that the RK4 integrator works we need to calculate
    // force implicitly from state rather than explicitly applying forces
    // to the rigid body once per update. This is because the RK4 achieves
    // its accuracy by detecting curvature in derivative values over the 
    // timestep so we need our force values to supply the curvature.

	void forces( State state, double t, THREE.Vector3 force, THREE.Vector3 torque)
	{
		// attract towards origin

		force.set(state.position);
		force.scale(FORCE_SCALE);
	
		// sine force to add some randomness to the motion

		force.x += FORCE_X * Math.sin(t*0.9f + 0.5f);
		force.y += FORCE_Y * Math.sin(t*0.5f + 0.4f);
		force.z += FORCE_Z * Math.sin(t*0.5f + 0.4f);

		// sine torque to get some spinning action

		torque.x = TORQUE_X * Math.sin(t*0.9f + 0.5f);
		torque.y = TORQUE_Y * Math.sin(t*0.5f + 0.4f);
		torque.z = TORQUE_Z * Math.sin(t*0.7f + 0.9f);

		// damping torque so we don't spin too fast

		torque.scaleAdd(DAMPING_TORQUE, state.angularVelocity, torque);
	}

	
