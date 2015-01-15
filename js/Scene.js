//some constants
	var    	X_AXIS = 0;
	var    	Y_AXIS = 1;
	var    	Z_AXIS = 2;
	
Scene = function ( parameters ) {
	
	this.scene;
	this.renderer;
	this.camera;

	this.controls = false;
	this.orbitControls;

	this.displayStats = false;
	this.stats;

	this.ambientLight;
	this.directionalLight;

	this.axisHeight = 0;
	
	this.floorRepeat = 0;
	
	this.fogType = 'none';	// else 'linear' or 'exponential' 
	this.fogDensity = 0;
	this.fogColor = 0xffffff;
	this.fogNear = 0.015;
	this.fogFar = 100;

	this.setParameters( parameters );
};

// the scene's parameters from the values JSON object
// lifted from MrDoob's implementation in three.js
Scene.prototype = {
		
	setParameters: function( values ) {

		if ( values === undefined ) return;
	
		for ( var key in values ) {
	
			var newValue = values[ key ];
	
			if ( newValue === undefined ) {
				console.warn( "NEHE: '" + key + "' parameter is undefined." );
				continue;
			}
	
			if ( key in this ) {
				var currentValue = this[ key ];
	
				if ( currentValue instanceof THREE.Color ) {
					currentValue.set( newValue );
				} else if ( currentValue instanceof THREE.Vector3 && newValue instanceof THREE.Vector3 ) {
					currentValue.copy( newValue );
				} else if ( key == 'overdraw' ) {
					// ensure overdraw is backwards-compatible with legacy boolean type
					this[ key ] = Number( newValue );
				} else {
					this[ key ] = newValue;
				}
			}
		}
	},

	initialize: function () {
		// Check whether the browser supports WebGL. 
		if ( !Detector.webgl ) Detector.addGetWebGLMessage();
	
		// Create the scene, in which all objects are stored (e. g. camera, lights, geometries, ...)
		this.scene = new THREE.Scene();

		this.addFog();
		
		//this.scene.fog = new THREE.Fog( 0xffffff,  0.015, 100 );
		//this.scene.fog = this.scene.fog = new THREE.FogExp2( 0xffffff, 0.15 );
			 

		// Get the size of the inner window (content area)
		var canvasWidth = window.innerWidth;
		var canvasHeight = window.innerHeight;
	
		// if the caller supplied the container elm ID try to find it
		var container;
		var containerID;
		if (containerID != null && typeof containerID != 'undefined')
			container = document.getElementById(containerID);
		
		// couldn't find it, so create it ourselves
		if (container == null || typeof container == 'undefined') {
			container = document.createElement( 'div' );
			document.body.appendChild( container );
		}
		else {
			canvasWidth = container.clientWidth;
			canvasHeight = container.clientHeight;
		}
	
		// set up the camera
		this.camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 1000);
		this.camera.position.set(0, 6, 6);
		this.camera.lookAt(this.scene.position);
		this.scene.add(this.camera);
	
		// allocate the THREE.js renderer
		this.renderer = new THREE.WebGLRenderer({antialias:true});
	
		// Set the background color of the renderer to black, with full opacity
		this.renderer.setClearColor(0x000000, 1);
	
		// Set the renderers size to the content areas size
		this.renderer.setSize(canvasWidth, canvasHeight);
	
		// Get the DIV element from the HTML document by its ID and append the renderer's DOM object
		container.appendChild(this.renderer.domElement);
				
		// Ambient light has no direction, it illuminates every object with the same
		// intensity. If only ambient light is used, no shading effects will occur.
		this.ambientLight = new THREE.AmbientLight(0x404040);
		this.scene.add(this.ambientLight);
	
		// Directional light has a source and shines in all directions, like the sun.
		// This behaviour creates shading effects.
		this.directionalLight = new THREE.DirectionalLight(0xffffff);
		this.directionalLight.position.set(5, 20, 12);
		this.scene.add(this.directionalLight);

		this.pointLight = new THREE.PointLight(0xffffff, 0.25);
		this.pointLight.position.set(15, -20, -12);
		this.scene.add(this.pointLight);

		// request the orbitControls be created and enabled
		// add the controls
		if (this.controls == true)
			this.orbitControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
		
		if ( this.axisHeight != 0 )
			this.drawAxes(this.axisHeight);
		
		if (this.floorRepeat != 0)
			this.addFloor(this.floorRepeat);
		
		//------ STATS --------------------	
		// displays current and past frames per second attained by scene
		if (this.displayStats == true) {
			this.stats = new Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.bottom = '0px';
			this.stats.domElement.style.zIndex = 100;
			container.appendChild( this.stats.domElement );
		}
	},

	addToScene: function ( obj ) {
		this.scene.add(obj);
	},

	remove: function ( obj ) {
		this.scene.remove(obj);
	},

/**
 * Render the scene. Map the 3D world to the 2D screen.
 */
	renderScene: function() {
		
		//this.scene.fog = new THREE.FogExp2( Math.random() * 0xfffff, 0.1, 0.01, 100);
		/*
		 * if (this.fogType == 'exponential')
			
			this.scene.fog = new THREE.FogExp2(this.fogColor, this.fogDensity, this.fogNear, this.fogFar );
		else if (this.fogType == 'linear')
			this.scene.fog = new THREE.Fog( this.fogColor, this.fogNear, this.fogFar );
		else
			this.scene.fog = null;
			*/
		
		this.renderer.render(this.scene, this.camera);

		// the orbit controls, if used, have to be updated as well
		if (this.orbitControls != null && typeof this.orbitControls != 'undefined') 
			this.orbitControls.update();

		if (this.stats != null && typeof this.stats != 'undefined') 
			this.stats.update();

},

	addFog: function( values ) {
		
		if ( values != undefined ) {

			for ( var key in values ) {
				
				var newValue = values[ key ];
		
				if ( newValue === undefined ) {
					console.warn( "Fog parameter '" + key + "' parameter is undefined." );
					continue;
				}
		
				if ( key == 'fogType' ) 
					this.fogType = newValue;
				else if ( key == 'fogDensity' ) 
					this.fogDensity = newValue;
				else if ( key == 'fogColor' ) 
					this.fogColor = newValue;
				else if ( key == 'fogLinear' ) 
					this.fogLinear = newValue;
				else if ( key == 'fogNear' ) 
					this.fogNear = newValue;
				else if ( key == 'fogFar' ) 
					this.fogFar = newValue;
			}
		}
				
		if (this.fogType == 'exponential')
			this.scene.fog = new THREE.FogExp2(this.fogColor, this.fogDensity, this.fogNear, this.fogFar );
		else if (this.fogType == 'linear')
			this.scene.fog = new THREE.Fog( this.fogColor, this.fogNear, this.fogFar );
		else
			this.scene.fog = null;
	},
	
	addFloor: function( floorRepeat ) {
		
		// note: 4x4 checker-board pattern scaled so that each square is 25 by 25 pixels.
		var floorTexture = new THREE.ImageUtils.loadTexture( '../images/checkerboard.jpg' );
		floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
		floorTexture.repeat.set( floorRepeat, floorRepeat );
		
		// DoubleSide: render texture on both sides of mesh
		var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
		var floorGeometry = new THREE.PlaneGeometry(50, 50, 1, 1);
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.y = 0.0;
		floor.rotation.x = Math.PI / 2;
		this.scene.add(floor);
	},
	
	drawAxis: function( axis, axisColor, axisHeight ) {
		var		AXIS_RADIUS   =	axisHeight/200.0;
		var		AXIS_HEIGHT   =	axisHeight;
		var		AXIS_STEP     =	axisHeight/20.0;
		var    	AXIS_SEGMENTS = 32;
		var		AXIS_GRAY     = 0x777777;
		var		AXIS_WHITE    = 0xEEEEEE;
		
		//console.log("drawAxis " + axis + " ht: " +  AXIS_HEIGHT + ", " + AXIS_STEP + " color: " + axisColor);
	
		for ( i=0; i<(AXIS_HEIGHT/AXIS_STEP); i++ )
		{
			//console.log("loop " +  i);
			
			var pos = -AXIS_HEIGHT / 2 + i * AXIS_STEP;
	
			if ((i & 1) == 0)
				curColor = axisColor;
			else if (pos < 0)
				curColor = AXIS_GRAY;
			else
				curColor = AXIS_WHITE;
			
			//console.log(i + " pos: " + pos + " color: " + curColor);
			
			var geometry = new THREE.CylinderGeometry( AXIS_RADIUS, AXIS_RADIUS, AXIS_STEP, AXIS_SEGMENTS ); 
			var material = new THREE.MeshLambertMaterial( { color: curColor } ); 
			var cylinder = new THREE.Mesh( geometry, material ); 
			
			pos += AXIS_STEP/2.0;
			if (axis == X_AXIS)
			{
				cylinder.position.x = pos;
				cylinder.rotation.z = Math.PI/2;
			}
			else if (axis == Y_AXIS)
			{
				cylinder.rotation.y = Math.PI/2;
				cylinder.position.y = pos;
			}
			else
			{	
				cylinder.position.z = pos;
				cylinder.rotation.x = Math.PI/2;
			}
			
			this.scene.add( cylinder );
		};
	},

	drawAxes: function( height ) {
	
		this.drawAxis(X_AXIS, 0xff0000, height);
		this.drawAxis(Y_AXIS, 0x00ff00, height);
		this.drawAxis(Z_AXIS, 0x0000ff, height);
	}
}
