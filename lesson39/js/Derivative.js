

    
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
