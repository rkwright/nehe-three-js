/*******************************************************************************
 * 
 * Code from Game Physics by Glen Fielder
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
 * Contributors:
 *    
 *     Ric Wright - July 2008 - Ported to Eclipse 3.5, minor tweaks
 *******************************************************************************/
package com.geofx.scenes.physics3d;

import java.awt.event.KeyEvent;

import javax.media.opengl.GL;
import javax.media.opengl.GLAutoDrawable;
import javax.vecmath.Matrix4d;
import javax.vecmath.Vector3d;
import javax.vecmath.Vector3f;

import com.geofx.opengl.scene.GLScene;
import com.geofx.opengl.util.Quaternion;
import com.geofx.opengl.view.GLComposite;

public class Physics3DScene extends GLScene 
{
	
	public Physics3DScene( GLComposite parent )
	{
		super(parent);

		System.out.println("Physics3D - constructor");

		glComposite.getGrip().setOffsets(0.0f, 0.0f, -5.0f);
		glComposite.getGrip().setRotation(45.0f, -30.0f, 0.0f);
	}

	// a default constructor used by the ClassInfo enumerator
	public Physics3DScene()
	{
		super();
	}


	public void init ( GLAutoDrawable drawable ) 
	{
		super.init(drawable);	
		
		System.out.println("Physics 3D - init");

		glComposite.initAnimator(drawable, 60);
	    
	    initState();
	}

	public void display(GLAutoDrawable drawable) 
	{
		super.display(drawable);
	
		//System.out.println("Physics3D - display");
		
		GL gl = drawable.getGL();

		try
		{
			glComposite.updateLighting(gl);
		
			glComposite.drawAxes(gl);

			timeStep(gl);
           
			if (glComposite.getAnimator().isAnimating())
			{
	    		glComposite.drawFPS();
			}

		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
	}

	public void  enableLighting( GL gl )
	{
	    gl.glEnable(GL.GL_LIGHT0);
	}
	
	public String getDescription()
	{
		return "Demo of full motion in 3D";
	}

	public String getLabel()
	{
		return "Physics 3D Demo";
	}

	// allows subclasses to get key events and do something interesting...
	protected boolean handleKeyEvent( KeyEvent e )
	{
		boolean	handled = true;
		switch (e.getKeyChar())
	
		{
			case 'r':
				//reset();
				break;
			default:
				handled = false;
		}
		
		return handled;
	}

	//======================= Time Step Section ========================================
	
	protected static final double 	TIME_CLAMP = 0.250;
	protected static final double 	TIME_STEP = 0.01;
	protected static final double  	DAMPING_TORQUE = -0.5;
	protected static final double   FORCE_X = 10;
	protected static final double   FORCE_Y = 11;
	protected static final double   FORCE_Z = 12;
	protected static final double   FORCE_SCALE = -10.0;
	protected static final double   TORQUE_X = 1.0;
	protected static final double   TORQUE_Y = 1.1;
	protected static final double   TORQUE_Z = 1.2;
	
	protected State 	previous;		// previous physics state.
	protected State 	current;		// current physics state.

	protected double 	t = 0;
	protected double 	dt = TIME_STEP;
	
	protected double 	currentTime = time();
	protected double 	accumulator = 0;

	private State 		tmpState = new State();
	private Vector3d	tmpVec = new Vector3d();

    /**
     *  Default constructor
     */	
	protected void initState()
	{
		current = new State();
		
		current.size = 1.0;
		current.mass = 1;
		current.inverseMass = 1.0f / current.mass;
		current.position = new Vector3d(2,0,0);
		current.momentum = new Vector3d(0,0,-10);
		current.orientation.identity();
		current.angularMomentum = new Vector3d(0,0,0);
		current.inertiaTensor = current.mass * current.size * current.size * 1.0f / 6.0f;
		current.inverseInertiaTensor = 1.0f / current.inertiaTensor;
		current.recalculate();
		
		previous = new State(current);
	}

	/**
	 * Simple time function that wraps the nanosecond precision timer
	 */
	static long	start     = 0;

	protected double time()
	{
	    if (start == 0)
	    {
	        start = System.nanoTime();
	        return 0.0;
	    }
	    
	    return (double) (System.nanoTime() - start) / 1e09;
	}
		
	protected int timeStep( GL gl )
	{				
		double newTime = time();
		double deltaTime = newTime - currentTime;
		currentTime = newTime;

		if (deltaTime > TIME_CLAMP)
			deltaTime = TIME_CLAMP;

		accumulator += deltaTime;

		// System.out.println("Accum:" + String.format("%6.2f", accumulator) + " t: " + String.format("%6.2f", t) );
		
		while (accumulator >= dt)
		{
			accumulator -= dt;
			
			update(t, dt);
			
			t += dt;
		}

		render(gl, accumulator / dt);			
	
		return 0;
	}
	
    // Update physics state.
	protected void update(double t, double dt)
    {
        previous.set(current);
        integrate(current, t, dt);
    }

    /** 
     * Render cube at interpolated state.
     * Calculates interpolated state then renders cube at the interpolated 
	 * position and orientation using OpenGL.
	 * @param alpha interpolation alpha in [0,1]
     */
    protected void render( GL gl, double alpha )
	{	
		gl.glPushMatrix();

		// interpolate state with alpha for smooth animation

		State state = interpolate(previous, current, alpha);

		// use position and orientation quaternion to build OpenGL body to world

		gl.glTranslated(state.position.x, state.position.y, state.position.z); 
		
		Vector3d axis = new Vector3d();		
		double angle = state.orientation.angleAxis(axis);
		gl.glRotated(angle/Math.PI*180.0, axis.x, axis.y, axis.z);
		
        // render cube
				
		drawCube(gl, (float)state.size * 0.5f);
		
        gl.glPopMatrix();
	}
	
	private void drawCube(GL gl, float faceSize )
	{
		// Six faces of cube
		// Top face
		gl.glPushMatrix();
		gl.glRotatef(-90, 1, 0, 0);
		drawFace(gl, faceSize, 0.2f, 0.2f, 0.8f, "Top");
		gl.glPopMatrix();
		// Front face
		drawFace(gl, faceSize, 0.8f, 0.2f, 0.2f, "Front");
		// Right face
		gl.glPushMatrix();
		gl.glRotatef(90, 0, 1, 0);
		drawFace(gl, faceSize, 0.2f, 0.8f, 0.2f, "Right");
		// Back face
		gl.glRotatef(90, 0, 1, 0);
		drawFace(gl, faceSize, 0.8f, 0.8f, 0.2f, "Back");
		// Left face
		gl.glRotatef(90, 0, 1, 0);
		drawFace(gl, faceSize, 0.2f, 0.8f, 0.8f, "Left");
		gl.glPopMatrix();
		// Bottom face
		gl.glPushMatrix();
		gl.glRotatef(90, 1, 0, 0);
		drawFace(gl, faceSize, 0.8f, 0.2f, 0.8f, "Bottom");
		gl.glPopMatrix();
	}

	private void drawFace(GL gl, float faceSize, float r, float g, float b, String text)
	{
		float halfFaceSize = faceSize / 2;
		
		Vector3f vecA = new Vector3f( halfFaceSize, 0.0f, 0.0f);
		Vector3f vecB = new Vector3f( 0.0f, halfFaceSize, 0.0f);
		Vector3f normal = new Vector3f();
		normal.cross( vecA, vecB );
		normal.normalize();
		gl.glNormal3f( normal.x, normal.y, normal.z ); 

		// Face is centered around the local coordinate system's z axis,
		// at a z depth of faceSize / 2
		

		gl.glColor3f(r,g,b);
		
		gl.glBegin(GL.GL_QUADS);
		gl.glVertex3f(-halfFaceSize, -halfFaceSize, halfFaceSize);
		gl.glVertex3f(halfFaceSize, -halfFaceSize, halfFaceSize);
		gl.glVertex3f(halfFaceSize, halfFaceSize, halfFaceSize);
		gl.glVertex3f(-halfFaceSize, halfFaceSize, halfFaceSize);
		gl.glEnd();
	}
	
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

	
	protected void rkVector( Vector3d state, Vector3d a, Vector3d b, Vector3d c, Vector3d d, double dt )
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

	void forces( State state, double t, Vector3d force, Vector3d torque)
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

	
   //===================== Physics state ======================================

    private class State
    {
        // primary physics state

    	protected Vector3d 		position;                //< the position of the cube center of mass in world coordinates (meters).
    	protected Vector3d 		momentum;                //< the momentum of the cube in kilogram meters per second.
    	protected Quaternion 	orientation;         	 // the orientation of the cube represented by a unit quaternion.
    	protected Vector3d 		angularMomentum;         // angular momentum vector.

        // secondary state

    	protected Vector3d 		velocity;                // velocity in meters per second (calculated from momentum).
    	protected Quaternion 	spin;               	 // quaternion rate of change in orientation.
    	protected Vector3d 		angularVelocity;         // angular velocity (calculated from angularMomentum).
    	protected Matrix4d 		bodyToWorld;             // body to world coordinates matrix.
    	protected Matrix4d 		worldToBody;             // world to body coordinates matrix.

        // constant state

    	protected double 		size;                     // length of the cube sides in meters.
    	protected double 		mass;                     // mass of the cube in kilograms.
    	protected double 		inverseMass;              // inverse of the mass used to convert momentum to velocity.
    	protected double 		inertiaTensor;            // inertia tensor of the cube (i have simplified it to a single value due to the mass properties a cube).
    	protected double 		inverseInertiaTensor;     // inverse inertia tensor used to convert angular momentum to angular velocity.

        
       	/**
    	 * Default constructor
    	 */
    	public State ()
    	{
       		this.position = new Vector3d();
       		this.momentum = new Vector3d();
       		this.orientation = new Quaternion();
       		this.angularMomentum = new Vector3d();

       		this.velocity = new Vector3d();
      		this.spin = new Quaternion();
       		this.angularVelocity = new Vector3d();
       		this.bodyToWorld = new Matrix4d();
       		this.bodyToWorld.setIdentity();
       		this.worldToBody = new Matrix4d();
       		this.worldToBody.setIdentity();
       	}

 
		/**
    	 * Copy constructor
    	 */
    	public State (State state)
    	{
    		set(state);
      	}

       	public void set(State state)
		{
       		this.position = new Vector3d(state.position);
       		this.momentum = new Vector3d(state.momentum);
       		this.orientation = new Quaternion(state.orientation);
       		this.angularMomentum = new Vector3d(state.angularMomentum);

       		this.velocity = new Vector3d(state.velocity);
      		this.spin = new Quaternion(state.spin);
       		this.angularVelocity = new Vector3d(state.angularVelocity);
       		this.bodyToWorld = new Matrix4d(state.bodyToWorld);
       		this.worldToBody = new Matrix4d(state.worldToBody);
       		
       		this.size = state.size;
       		this.mass = state.mass;
       		this.inverseMass = state.inverseMass;
       		this.inertiaTensor = state.inertiaTensor;
       		this.inverseInertiaTensor = state.inverseInertiaTensor;
		}

        // Recalculate secondary state values from primary values.

        protected void recalculate()
        {
            velocity.scale(inverseMass, momentum);
            angularVelocity.scale(inverseInertiaTensor,angularMomentum);
            orientation.normalize();
            
            spin.set(0, angularVelocity.x, angularVelocity.y, angularVelocity.z);
            spin.multiply(0.5);
            spin.multiply(orientation);
     
            Matrix4d translation = new Matrix4d();
            translation.setIdentity();
            translation.setTranslation(position);
            bodyToWorld.mul(translation,orientation.matrix());
            worldToBody.invert(bodyToWorld);
        }
    };
    
    
    //=========================================================================
    
    // Derivative values for primary state.
    // This structure stores all derivative values for primary state in Cube::State.
    // For example velocity is the derivative of position, force is the derivative
    // of momentum etc. Storing all derivatives in this structure makes it easy
    // to implement the RK4 integrator cleanly because it needs to calculate the
    // and store derivative values at several points each timestep.

	private class Derivative
	{
		protected Vector3d 		velocity;           // velocity is the derivative of position.
		protected Vector3d 		force;              // force in the derivative of momentum.
		protected Quaternion 	spin;               // spin is the derivative of the orientation quaternion.
		protected Vector3d 		torque;             // torque is the derivative of angular momentum.
		
		public Derivative()
		{
			this.velocity = new Vector3d();
			this.force = new Vector3d();
			this.spin = new Quaternion();
			this.torque = new Vector3d();			
		}
	};	

}
