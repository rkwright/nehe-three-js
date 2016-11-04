/**
 *  @author rkwright   /  http://www.geofx.com
 */

var BALL = { revision: '02' };

// some constants
var SEGMENTS        = 8;
var BASE_RADIUS     = 0.1;
var DELTA_RADIUS    = 0.025;
var RESTITUTION     = 0.75;

BALL.BeachBall = function ( parameters ) {
	
	this.vel      = new THREE.Vector3(0,0,0);
	this.loc      = new THREE.Vector3(0,0,0);
    this.radius   = 0;
    this.mesh     = null;

    GFX.setParameters(this, parameters);

    this.radius = BASE_RADIUS + DELTA_RADIUS * Math.random();

    var geometry = new THREE.SphereGeometry( this.radius, SEGMENTS, SEGMENTS );

    var material = new THREE.MeshLambertMaterial( { transparent: true });
    material.color.setRGB(Math.random(), Math.random(), Math.random());

    this.mesh = new THREE.Mesh( geometry, material );

    this.restitution = RESTITUTION;
};

BALL.BeachBall.prototype = {

/**
 * Update the ball's location and velocity as well as its life-force
 */
	update: function( gravity ) {

        this.loc.add( this.vel );
        this.vel.add( gravity );
        this.mesh.position.set(this.loc.x, this.loc.y, this.loc.z);
	}
};
