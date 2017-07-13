/**
 *  @author rkwright   /  http://www.geofx.com
 */

var GFX = { revision: '02' };

//some constants
	var    	X_AXIS = 0;
	var    	Y_AXIS = 1;
	var    	Z_AXIS = 2;
	
GFX.Scene = function ( parameters ) {
	
	this.scene = [];
	this.renderer = null;
	this.camera = null;
    this.containerID = null;
    this.shadowMapEnabled = false;

    this.clearColor = 0x000000;

	this.canvasWidth = 0;
	this.canvasHeight = 0;

    this.perspective = true;
    this.fov = 45;
    this.near = 0.01;
    this.far = 1000;
	this.cameraPos = [0,20,40];
    this.orthoSize = 1;

	this.controls = false;
	this.orbitControls = null;

	this.displayStats = false;
	this.stats = null;

	this.defaultLights = true;
	this.ambientLights = [];
	this.directionalLights = [];
	this.pointLights = [];
	this.hemisphereLights =[];
	this.spotLights = [];

	this.axesHeight = 0;
	
	this.floorRepeat = 0;
	this.floorX      = 0;
	this.floorZ      = 0;
    this.floorImage  = null;
	
	this.fogType = 'none';	// else 'linear' or 'exponential' 
	this.fogDensity = 0;
	this.fogColor = 0xffffff;
	this.fogNear = 0.015;
	this.fogFar = 100;

    GFX.setParameters( this, parameters );

    this.initialize();
};

GFX.setParameters= function( object, values ) {

    if ( values === undefined ) return;

    for ( var key in values ) {

        var newValue = values[ key ];

        if ( newValue === undefined ) {
            console.warn( "GFX: '" + key + "' parameter is undefined." );
            continue;
        }

        if ( key in object ) {
            var currentValue = object[ key ];

            if ( currentValue instanceof THREE.Color ) {
                currentValue.set( newValue );
            }
            else if ( currentValue instanceof THREE.Vector3 && newValue instanceof THREE.Vector3 ) {
                currentValue.copy( newValue );
            }
            else if ( key === 'overdraw' ) {
                // ensure overdraw is backwards-compatible with legacy boolean type
                object[ key ] = Number( newValue );
            }
            else if (currentValue instanceof Array) {
                object[ key ] = newValue.slice();
            }
            else {
                object[ key ] = newValue;
            }

        }
    }
};

// the scene's parameters from the values JSON object
// lifted from MrDoob's implementation in three.js
GFX.Scene.prototype = {

	initialize: function () {
		if (this.scene.length > 0) {
			console.error("GFXScene initialize called twice!");
			return;
		}
		// Check whether the browser supports WebGL. 
		if ( !Detector.webgl ) Detector.addGetWebGLMessage();
	
		// Create the scene, in which all objects are stored (e. g. camera, lights, geometries, ...)
		this.scene[0] = new THREE.Scene();

		this.addFog();
		
		// If the user didn't supply a fixed size for the window,
		// get the size of the inner window (content area)
		if (this.canvasHeight === 0) {
			this.canvasWidth = window.innerWidth;
			this.canvasHeight = window.innerHeight;

            var _self = this;

			// add an event listener to handle changing the size of the window
			window.addEventListener('resize', function() {
                _self.canvasWidth  = window.innerWidth;
                _self.canvasHeight = window.innerHeight;
                var aspect = _self.canvasWidth / _self.canvasHeight;

                if (_self.perspective === true ) {
                    _self.camera.aspect = aspect;
                } else {
                    var w2 = _self.orthoSize * aspect / 2;
                    var h2 = _self.orthoSize / 2;

                    _self.camera.left   = -w2;
                    _self.camera.right  = w2;
                    _self.camera.top    = h2;
                    _self.camera.bottom = -h2;
                }

                _self.camera.updateProjectionMatrix();
                _self.renderer.setSize( _self.canvasWidth, _self.canvasHeight );
            });
		}
	
		// if the caller supplied the container elm ID try to find it
		var container;
		if (this.containerID !== null && typeof this.containerID !== 'undefined')
			container = document.getElementById(this.containerID);
		
		// couldn't find it, so create it ourselves
		if (container === null || typeof container === 'undefined') {
			container = document.createElement( 'div' );
			document.body.appendChild( container );
		}
		else {
			this.canvasWidth = container.clientWidth;
			this.canvasHeight = container.clientHeight;
		}
	
		// set up the camera
		this.setCamera(null);

		this.scene[0].add(this.camera);
	
		// allocate the THREE.js renderer
		this.renderer = new THREE.WebGLRenderer({antialias:true});
	
		// Set the background color of the renderer to black, with full opacity
		this.renderer.setClearColor(new THREE.Color( this.clearColor ), 1);

		if (this.shadowMapEnabled === true )
		    this.renderer.shadowMap.enabled = true;

		// Set the renderers size to the content areas size
		this.renderer.setSize(this.canvasWidth, this.canvasHeight);
	
		// Get the DIV element from the HTML document by its ID and append the renderer's DOM object
		container.appendChild(this.renderer.domElement);

		// if the user hasn't set defaultLights to false, then set them up
		if (this.defaultLights === true)
		    this.setDefaultLights();

		// request the orbitControls be created and enabled
		// add the controls
		if (this.controls === true && this.renderer !== null)
			this.orbitControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
		
		if ( this.axesHeight !== 0 )
			this.drawAxes(this.axesHeight);
		
		if (this.floorRepeat !== 0)
			this.addFloor(this.floorRepeat);
		
		//------ STATS --------------------	
		// displays current and past frames per second attained by scene
		if (this.displayStats === true) {
			this.stats = new Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.bottom = '0px';
			this.stats.domElement.style.zIndex = 100;
			container.appendChild( this.stats.domElement );
		}
	},

	add: function ( obj, nScene ) {
	    if (nScene === undefined)
		    this.scene[0].add(obj);
	    else if (nScene < this.scene.length)
	        this.scene[nScene].add(obj);
	},

	remove: function ( obj, nscene ) {
        if (nScene === undefined)
		    this.scene.remove(obj);
        else if (nScene < this.scene.length)
            this.scene[nScene].remove(obj);
	},

	/**
	 * Set up the camera for the scene.  Perspective or Orthographic
	 */
	setCamera: function ( jsonObj, nScene ) {
	    if (jsonObj !== null)
	        GFX.setParameters(this, jsonObj);

        if (this.perspective === true)
		    this.camera = new THREE.PerspectiveCamera(this.fov, this.canvasWidth / this.canvasHeight, this.near, this.far);
        else {

            var aspect = this.canvasWidth / this.canvasHeight;
            var w2 = this.orthoSize * aspect / 2;
            var h2 = this.orthoSize / 2;
            this.camera = new THREE.OrthographicCamera( -w2, w2, h2, -h2, 0.01, 1000);

            //this.camera = new THREE.OrthographicCamera( this.canvasWidth / -2, this.canvasWidth / 2,
            //    this.canvasHeight / 2, this.canvasHeight / -2, 0.01, 1000 );

        }

        this.camera.updateProjectionMatrix();

        if (this.cameraPos === undefined)
			this.camera.position.set(0, 10, 20);
		else
			this.camera.position.set(this.cameraPos[0], this.cameraPos[1], this.cameraPos[2]);

		this.camera.lookAt(this.scene.position);

        if (this.controls === true && this.renderer !== null)
            this.orbitControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
    },

    /**
     * If the user doesn't want to set custom lights, just allocate some defaults
     */
    setDefaultLights: function () {
        // Ambient light has no direction, it illuminates every object with the same
        // intensity. If only ambient light is used, no shading effects will occur.
        var ambLight = new THREE.AmbientLight(0x808080);
        this.scene.add( ambLight );
        this.ambientLights.push( ambLight);

        // Directional light has a source and shines in all directions, like the sun.
        // This behaviour creates shading effects.
        var dirLight = new THREE.DirectionalLight(0xc0c0c0);
        dirLight.position.set(5, 20, 12);
        this.scene.add( dirLight );
        this.directionalLights.push( dirLight );

        var pointLight = new THREE.PointLight(0xc0c0c0, 0.25);
        pointLight.position.set(15, -20, -12);
        this.scene.add( pointLight );
        this.pointLights.push( pointLight );
    },

    /**
	 * Add one or more lights to the current scene.  If the JSON object is null,
	 * then the default lights are used.
	 *
     * All lights support color and intensity
	 * Supported types of light and their parameters are
	 * 	AmbientLight
     *  DirectionalLight
     *    castShadow
     *    position
     *    target
     *  HemisphereLight
     *    castShadow
     *    position
     *    color   (of the sky)
     *    groundColor
     *  PointLight
     *    castShadow
     *    position
     *    decay
     *    power
     *  SpotLight
     *    distance
     *    angle
     *    penumbra
     *    decay
     *
     * @param type
     * @param values
     * @param nScene
     */
    addLight: function ( type, values, nScene ) {

        var light;
        var color = this.getLightProp('color', values, 0xffffff);
        var intensity = this.getLightProp ('intensity', values, 1);
        var castShadow = this.getLightProp('castShadow', values, false);
        var debug = this.getLightProp('debug', values, false);
        var distance, decay;

        if (type === 'ambient') {
            light = new THREE.AmbientLight( color, intensity );
            this.ambientLights.push( light );
        }
        else {
            var pos = this.getLightProp('position', values, [0, 10, 0]);

            if (type === 'directional') {
                var target = this.getLightProp('target', values, undefined);
                light = new THREE.DirectionalLight(color, intensity);
                light.shadow.mapSize.x = 2048;
                light.shadow.mapSize.y = 2048;
                light.shadow.camera.left = -20;
                light.shadow.camera.bottom = -20;
                light.shadow.camera.right = 20;
                light.shadow.camera.top = 20;

                this.directionalLights.push(light);
           }
            else if (type === 'point') {
                distance = this.getLightProp('distance', values, 0);
                decay = this.getLightProp('decay', values, 1);
                light = new THREE.PointLight(color, intensity, distance, decay);
                this.pointLights.push(light);
            }
            else if (type === 'hemisphere') {
                var groundColor = this.getLightProp('groundColor', values, 0x000000);
                light = new THREE.HemisphereLight(color, groundColor, intensity);
                this.hemisphereLights.push(light);
             }
            else if (type === 'spot') {
                var angle = this.getLightProp('angle', values, Math.PI/3);
                var penumbra = this.getLightProp('penumbra', values, 0);
                distance = this.getLightProp('distance', values, 0);
                decay = this.getLightProp('decay', values, 1);
                light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
                this.spotLights.push(light);
            }

            light.position.set(pos[0], pos[1], pos[2]);
            light.castShadow = castShadow;
            if (debug === true) {
                var helper = new THREE.CameraHelper( light.shadow.camera );
                if (nScene === undefined)
                    this.scene[0].add( helper );
                else if (nScene < scene.length)
                    this.scene[nScene].add(helper);
                //light.shadowCameraVisible = true;
            }
        }

        if (nScene === undefined)
            this.scene[0].add( light );
        else if (nScene < this.scene.length)
            this.scene[nScene].add( light );

        return light;
    },

    getLightProp: function ( prop, values, def ) {
        var value = values[ prop ];
        return ( value === undefined ) ? def : value;
    },

    /**
	 * Remove all the lights currently created for the scene
     */
	clearAllLights: function () {

	    this.clearLights( this.ambientLights );
        this.clearLights( this.directionalLights );
        this.clearLights( this.pointLights );
        this.clearLights( this.spotLights );
        this.clearLights( this.hemisphereLights );
    },

    /**
     * Remove all the lights from the specified array
     */
    clearLights : function ( lightArray, nScene ) {

        while (lightArray.length > 0) {
            if (nScene ===  undefined)
                this.scene[0].remove(lightArray.pop());
            else if (nScene < this.scene.length)
                this.scene[nScene].remove(lightArray.pop());
        }
    },

    /**
	 * Render the scene. Map the 3D world to the 2D screen.
     */
	renderScene: function( nScene ) {

	    if (nScene === undefined)
		    this.renderer.render(this.scene[0], this.camera);
	    else if (nScene < this.scene.length)
	        this.renderer.render(this.scene[nScene], this.camera)

		// the orbit controls, if used, have to be updated as well
		if (this.orbitControls !== null && typeof this.orbitControls !== 'undefined')
			this.orbitControls.update();

		if (this.stats !== null && typeof this.stats !== 'undefined')
			this.stats.update();

	},

	addFog: function( values, nScene ) {
		
		if ( values !== undefined ) {

			for ( var key in values ) {
				
				var newValue = values[ key ];
		
				if ( newValue === undefined ) {
					console.warn( "Fog parameter '" + key + "' parameter is undefined." );
					continue;
				}
		
				if ( key === 'fogType' )
					this.fogType = newValue;
				else if ( key === 'fogDensity' )
					this.fogDensity = newValue;
				else if ( key === 'fogColor' )
					this.fogColor = newValue;
				else if ( key === 'fogNear' )
					this.fogNear = newValue;
				else if ( key === 'fogFar' )
					this.fogFar = newValue;
			}
		}

		if (nScene === undefined || nScene >= nScene.length)
		    sc = this.scene[0];
		else if (nScene < this.scene.length)
		    sc = this.scene[nScene];

		if (this.fogType === 'exponential')
			sc.fog = new THREE.FogExp2(this.fogColor, this.fogDensity );
		else if (this.fogType === 'linear')
			sc.fog = new THREE.Fog( this.fogColor, this.fogNear, this.fogFar );
		else
			sc.fog = null;
	},
	
	addFloor: function( floorRepeat, nScene ) {
		
		// note: 4x4 checker-board pattern scaled so that each square is 25 by 25 pixels.
        var image = this.floorImage === null ? '../images/checkerboard.jpg' : this.floorImage;
		var texture = new THREE.ImageUtils.loadTexture( image );
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( this.floorRepeat, this.floorRepeat );
		
		// DoubleSide: render texture on both sides of mesh
		var floorMaterial = new THREE.MeshBasicMaterial( { map: texture, side: THREE.DoubleSide } );
        var width = this.floorX === 0 ? 10 : this.floorX;
        var height = this.floorZ === 0 ? 10 : this.floorZ;

        var floorGeometry = new THREE.PlaneGeometry(width, height, 1, 1);
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.y = 0.0;
		floor.rotation.x = Math.PI / 2;

		if (nScene === undefined)
		    this.scene[0].add(floor);
		else if (nScene < this.scene.length)
		    this.scene[nScene].add(floor, nScene);
	},
	
	drawAxis: function( axis, axisColor, axisHeight, nScene ) {
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
	
			if ((i & 1) === 0)
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
			if (axis === X_AXIS)
			{
				cylinder.position.x = pos;
				cylinder.rotation.z = Math.PI/2;
			}
			else if (axis === Y_AXIS)
			{
				cylinder.rotation.y = Math.PI/2;
				cylinder.position.y = pos;
			}
			else
			{	
				cylinder.position.z = pos;
				cylinder.rotation.x = Math.PI/2;
			}

			if (nScene === undefined)
	    		this.scene[0].add( cylinder );
			else if (nScene < this.scene.length)
			    this.scene[nScene].add( cylinder, nScene );
		}
	},

	drawAxes: function( height ) {
	
		this.drawAxis(X_AXIS, 0xff0000, height);
		this.drawAxis(Y_AXIS, 0x00ff00, height);
		this.drawAxis(Z_AXIS, 0x0000ff, height);
	}
};
