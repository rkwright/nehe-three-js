/*
 * @author rkwright   /  www.geofx.com
 */

var scene;					// THREE.js objects	
var renderer;			
var camera;	
var controls;

var ambientLight;
var directionalLight;

/**
 * Initialize the THREE.js scene.
 */
function initializeScene( containerID ) {

	// Check whether the browser supports WebGL. 
	if ( !Detector.webgl ) Detector.addGetWebGLMessage();

	// Create the scene, in which all objects are stored (e. g. camera, lights, geometries, ...)
	scene = new THREE.Scene();

	// Get the size of the inner window (content area)
	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;

	// if the caller supplied the container elm ID try to find it
	var container;
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
	camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 1000);
	camera.position.set(0, 6, 6);
	camera.lookAt(scene.position);
	scene.add(camera);

	// allocate the THREE.js renderer
	renderer = new THREE.WebGLRenderer({antialias:true});

	// Set the background color of the renderer to black, with full opacity
	renderer.setClearColor(0x000000, 1);

	// Set the renderers size to the content areas size
	renderer.setSize(canvasWidth, canvasHeight);

	// Get the DIV element from the HTML document by its ID and append the renderer's DOM object
	container.appendChild(renderer.domElement);
	
	// Ambient light has no direction, it illuminates every object with the same
	// intensity. If only ambient light is used, no shading effects will occur.
	ambientLight = new THREE.AmbientLight(0x404040);
	scene.add(ambientLight);

	// Directional light has a source and shines in all directions, like the sun.
	// This behaviour creates shading effects.
	directionalLight = new THREE.PointLight(0xffffff);
	directionalLight.position.set(250,250,250); 
	scene.add(directionalLight);
	
	// add the controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
}

//some constants
var    	X_AXIS = 0;
var    	Y_AXIS = 1;
var    	Z_AXIS = 2;

console.log("X_AXIS " + X_AXIS);

// draw some axes
function drawAxis( axis, axisColor, axisHeight )
{
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
		var material = new THREE.MeshLambertMaterial( {color: curColor} ); 
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
		
		scene.add( cylinder );
	};
}

function drawAxes( height )
{	
	console.log("X_AXIS: " + X_AXIS);
	
	drawAxis(X_AXIS, 0xff0000, height);
	drawAxis(Y_AXIS, 0x00ff00, height);
	drawAxis(Z_AXIS, 0x0000ff, height);
}
