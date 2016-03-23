/**
 *  @author rkwright   /  http://www.geofx.com
 */

var CANNON = { revision: '01' };

// some constants
var RHO        = 60.0 * Math.PI / 180.0;
var RADIUS     = 0.5;

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

    this.setParameters( parameters );

    this.init();
};

// the scene's parameters from the values JSON object
// lifted from MrDoob's implementation in three.js
CANNON.Cannon.prototype = {
		
	setParameters: function( values ) {

		if ( values === undefined ) return;
	
		for ( var key in values ) {
	
			var newValue = values[ key ];
	
			if ( newValue === undefined ) {
				console.warn( "BALL: '" + key + "' parameter is undefined." );
				continue;
			}
	
			if ( key in this ) {
				var currentValue = this[ key ];
	
				if ( currentValue instanceof THREE.Color ) {
					currentValue.set( newValue );
				}
                else if ( currentValue instanceof THREE.Vector3 && newValue instanceof THREE.Vector3 ) {
					currentValue.copy( newValue );
				}
                else if (currentValue instanceof Array) {
                    this[ key ] = newValue.slice();
				}
                else {
                    this[ key ] = newValue;
                }
			}
		}
	},

    /**
     * Initialize all the parameters of the cannon
     */
	init: function () {
        this.radius = BASE_RADIUS;  // + DELTA_RADIUS * Math.random();

        var geometry = new THREE.CylinderGeometry( this.radius * 2.0, this.radius * 3.0, this.radius * 10, 32, 1, true);

        var material = new THREE.MeshPhongMaterial( { color : 0xdddddd, specular: 0x009900, shininess: 30 });

        this.mesh = new THREE.Mesh( geometry, material );
    },


    /**
     * Launch a new beachball, either by creating one or, if available,
     * fetch an existing one from the magazine
     */
	launch: function() {
        var now = performance.now();
        if ((now - this.lastT) < this.deltaT)
            return;
        this.lastT = now;

        var newBall;
        if (this.magazine.length > 0) {
            newBall = this.magazine.pop();
            newBall.init();
        }
        else {
            newBall = new BALL.BeachBall( { xLimit : this.xLimit,
                                            zLimit : this.zLimit } );
            this.ballCount++;
            console.log("ballcount = " + this.ballCount);
        }

        this.active.push( newBall );
        this.scene.add( newBall.mesh );
	},

    /**
     * Update each beachball's location by iterating through the
     * array of active balls
     */
    update: function() {

        for ( var i=this.active.length-1; i>=0; i-- ) {
            var ball = this.active[i];

            if (ball.mesh.material.opacity <= 0) {
                this.active.splice(i, 1);
                this.magazine.push( ball );
                this.scene.remove(ball.mesh);
                continue;
            }

            //var ball = this.active[i];

            ball.update();

            if ( (Math.abs(ball.loc.x) > this.xLimit || Math.abs(ball.loc.z) > this.zLimit) && ball.loc.y < 0) {
                ball.mesh.material.opacity -= 0.05;
            }
        }

    }
};
