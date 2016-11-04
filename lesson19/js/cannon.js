/**
 *  @author rkwright   /  http://www.geofx.com
 */

var CANNON = { revision: '02' };

// some constants
var RADIUS          = 0.5;
var BASE_VELOCITY_V = 0.1;
var BASE_VELOCITY_H = 0.025;
var MIN_RHO         = 60.0 * Math.PI / 180.0;
var DELTA_RHO       = 30.0 * Math.PI / 180.0;

CANNON.Cannon = function ( parameters ) {
	
	this.deltaT   = 0.0;
    this.lastT    = 0.0;
    this.mesh     = null;
    this.magazine = new Array();
    this.active   = new Array();
    this.xLimit   = 0;
    this.zLimit   = 0;
    this.radius   = RADIUS;
    this.scene    = null;
    this.ballCount = 0;
    this.gravity  = new THREE.Vector3(0, -0.002, 0);

    GFX.setParameters( this, parameters );

    this.init();
};


CANNON.Cannon.prototype = {

    /**
     * Initialize all the parameters of the cannon
     */
	init: function () {
        this.radius = BASE_RADIUS;

        var geometry = new THREE.CylinderGeometry( this.radius * 2.0,
                                                   this.radius * 3.0,
                                                   this.radius * 10,
                                                   32, 1, true);

        var material = new THREE.MeshPhongMaterial( { color : 0xdddddd,
                                                      specular: 0x009900,
                                                      shininess: 30,
                                                      side:THREE.DoubleSide});

        this.mesh = new THREE.Mesh( geometry, material );
    },

    /**
     * Initialize all the parameters of the beachball
     */
    initBall: function ( ball ) {

        var theta = Math.PI * 2.0 * Math.random();
        var velX = Math.sin(theta) * BASE_VELOCITY_H;
        var velZ = Math.cos(theta) * BASE_VELOCITY_H;

        var rho = MIN_RHO + DELTA_RHO * Math.random();
        var velY = Math.sin(rho) * BASE_VELOCITY_V;

        ball.vel.set( velX, velY, velZ);
        ball.loc.set(0, this.radius, 0);

        ball.mesh.material.opacity = 1;
    },

    /**
     * Launch a new beachball, either by creating one or, if available,
     * fetch an existing one from the magazine
     */
	launchBall: function() {
        var now = performance.now();
        if ((now - this.lastT) < this.deltaT)
            return;
        this.lastT = now;

        var newBall;
        if (this.magazine.length > 0) {
            newBall = this.magazine.pop();
        }
        else {
            newBall = new BALL.BeachBall( {  } );
            this.ballCount++;
            this.scene.add( newBall.mesh );
            // console.log("ballcount = " + this.ballCount);
        }

        this.initBall( newBall );

        this.active.push( newBall );
 	},

    /**
     * Update each beachball's location by iterating through the
     * array of active balls
     */
    update: function() {
        //console.log(" active: " + this.active.length + " magazine: " + this.magazine.length);

        this.launchBall();

        for ( var i=this.active.length-1; i>=0; i-- ) {
            var ball = this.active[i];

            if (ball.mesh.material.opacity <= 0) {
                this.active.splice(i, 1);
                this.magazine.push( ball );
                //this.scene.remove(ball.mesh);
                continue;
            }

            //var ball = this.active[i];

            ball.update(this.gravity);

            if (ball.loc.y < 0.0 ) {
                //console.log(" veloc: " + ball.vel.x.toFixed(3) + ", " + ball.vel.y.toFixed(3) +
                //   ", " + ball.vel.z.toFixed(3) + ", loc: " + ball.loc.x.toFixed(3) + ", " +
                // ball.loc.y.toFixed(3) + ", "+ ball.loc.z.toFixed(3));

                if (Math.abs(ball.loc.x) <= this.xLimit && Math.abs(ball.loc.z) <= this.zLimit) {
                    ball.vel.y = -ball.vel.y * ball.restitution;
                    ball.loc.y = ball.radius;
                }

                if ( (Math.abs(ball.loc.x) > this.xLimit || Math.abs(ball.loc.z) > this.zLimit) && ball.loc.y < 0) {
                    ball.mesh.material.opacity -= 0.025;
                }
            }
        }

    }
};
