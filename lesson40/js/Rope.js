/**
 * Rope.js
 * Use springs to simulate a falling rope.
 * Contains three classes:
 *      Rope
 *      Spring
 *      Particle
 */
GFX.State = function ( position, velocity ) {
    this.pos = position;
    this.vel = velocity;
};

GFX.State.prototype = {

    copy: function( state ) {

        this.vel.copy( state.vel );
        this.pos.copy( state.pos );
    }
};

GFX.Particle = function ( mass ) {

    this.mass = mass;
    this.curState  = new GFX.State(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
    this.prevState = new GFX.State(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
    this.forces = new THREE.Vector3(0, 0, 0);
};

GFX.Particle.prototype = {

    applyForce: function( force ) {
        this.forces.add(force);
    },

    acceleration: function( forces, mass ) {
        return forces.divideScalar( mass );
    },

    update: function( dt ) {
        this.prevState.copy(this.curState);
        var accel = this.acceleration(this.forces, this.mass).multiplyScalar(dt);
        this.curState.vel.add(accel);
        this.curState.pos.add(this.curState.vel.multiplyScalar(dt));
    }
};
GFX.Spring = function ( particle1, particle2, springConstant, springLen, friction ) {

    this.particle1 = particle1;
    this.particle2 = particle2;
    this.springConstant = springConstant;
    this.springLen = springLen;
    this.friction = friction;
};

GFX.Spring.prototype = {

    solve: function() {

        var springVector = this.particle2.curState.pos.sub(this.particle1.curState.pos).clone();
        springVector.normalize();
        var len = springVector.length();
        var force = new THREE.Vector3(0, 0, 0);
        if (len !== 0) {
            force.add(springVector.multiplyScalar(len - this.springLen).multiplyScalar(this.springConstant));
        }

        force.add(this.particle1.curState.vel.sub(this.particle2.curState.vel).multiplyScalar(-this.friction));
        if (this.particle1.head !== true) {
            this.particle1.applyForce(force);
        }

        this.particle2.applyForce(force.multiplyScalar(-1));
    }
};

GFX.Rope = function ( args ) {

    var i, particle, mass, numParticles;
    var springConstant, springFriction, springLen;

    numParticles = args.numOfParticles || 30;
    mass = args.mass || 0.05;
    springConstant = args.springConstant || 1000;
    springLen = args.springLen || 0.05;
    springFriction = args.springFriction || 0.5;
    this.gravitation = args.gravitation || 9.82;
    this.airFriction = args.airFriction || 0.04;
    this.groundRepulsion = args.groundRepulsion || 100;
    this.groundFriction = args.groundFriction || 0.2;
    this.groundAbsorption = args.groundAbsorption || 2;

    if (args.renderFunc !== undefined)
      this.renderFunc = args.renderFunc;
    else
        console.error("No renderFunc supplied!");

    this.particles = [];

    for ( i = 0; i < numParticles; i++ ) {
        this.particles[i] = new GFX.Particle(mass);
    }

    for ( i = 0; i<this.particles.length;  i++ ) {
        particle = this.particles[i];
        particle.curState.pos.x = i * springLen;
        particle.curState.pos.y = this.particles.length * springLen * (2 / 3);
    }

    this.particles[0].head = true;
    this.springs = [];

    for ( i = 0; i<numParticles - 1; i++ ) {
        this.springs[i] = new GFX.Spring(this.particles[i], this.particles[i + 1],
                                        springConstant, springLen, springFriction);
    }

    this.MAX_RENDER_TIME = 0.250;
    this.start = 0;
    this.t = 0;
    this.dt = 0.01;
    this.currentTime = performance.now() / 1e03;
    this.accumulator = 0;
};

GFX.Rope.prototype = {

    update: function( dt ) {
        var i, force, particle, vec;

        for (i = 0; i<this.particles.length; i++ ) {
            this.particles[i].forces.set(0, 0, 0);
        }

        for ( i = 0; i<this.springs.length; i++ ) {
            this.springs[i].solve();
        }

        for ( i = 0; i<this.particles.length; i++ ) {
            if (i !== 0) {
                this.particles[i].applyForce(this.gravitation.multiplyScalar(this.particles[i].mass));
                this.particles[i].applyForce(this.particles[i].curState.vel.multiplyScalar(-this.airFriction));
            }
        }

        for ( i = 0; i<this.particles.length; i++ ) {
            particle = this.particles[i];
            if (particle.curState.pos.y < 0) {
                vec = new THREE.Vector3(0, 0, 0);
                vec.set(particle.curState.vel);
                vec.y = 0;
                particle.applyForce(vec.multiplyScalar(-this.groundFriction));
                vec.y = particle.curState.vel.y;
                vec.x = 0;
                vec.z = 0;
                if (vec.y < 0) {
                    particle.applyForce(vec.multiplyScalar(-this.groundAbsorption));
                }

                force = new THREE.Vector3(0, this.groundRepulsion, 0).multiplyScalar(0 - particle.curState.pos.y);
                particle.applyForce(force);
            }
        }

        for ( i = 0; i<this.particles.length; i++ ) {
            this.particles[i].update(dt);
        }
    },

    render:  function( blending ) {

        this.renderFunc( this.particles, blending );
    },

    timeStep: function() {

        var newTime = performance.now() / 1e03;
        var deltaTime = Math.min(newTime - this.currentTime, this.MAX_RENDER_TIME);
        this.currentTime = newTime;

        this.accumulator += deltaTime;

        //console.log("Accum:" + this.accumulator.toFixed(2) + " t: " + this.t.toFixed(2) );

        while (this.accumulator >= this.dt) {
            this.accumulator -= this.dt;

            this.update( this.dt );

            this.t += this.dt;
        }

        var alpha = this.accumulator / this.dt;
        //this.render( alpha );

        this.renderFunc(this.particles, alpha);

        return 0;
    }
};


