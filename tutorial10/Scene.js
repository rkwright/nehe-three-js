/*
 * @author rkwright   /  www.geofx.com
 */

var scene;					// THREE.js objects	
var renderer;			
var camera;	

var ambientLight;
var directionalLight;

/**
 * Initialize the THREE.js scene.
 */
function initializeScene() {

	// Check whether the browser supports WebGL. 
	if ( !Detector.webgl ) Detector.addGetWebGLMessage();

	// allocate the THREE.js renderer
	renderer = new THREE.WebGLRenderer({antialias:true});

	// Set the background color of the renderer to black, with full opacity
	renderer.setClearColor(0x000000, 1);

	// Get the size of the inner window (content area)
	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;

	// Set the renderers size to the content areas size
	renderer.setSize(canvasWidth, canvasHeight);

	// Get the DIV element from the HTML document by its ID and append the renderer's DOM object
	document.getElementById("WebGLCanvas").appendChild(renderer.domElement);

	// Create the scene, in which all objects are stored (e. g. camera, lights, geometries, ...)
	scene = new THREE.Scene();
	
	camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 1, 100);
	camera.position.set(0, 6, 6);
	camera.lookAt(scene.position);
	scene.add(camera);
	
	// Ambient light has no direction, it illuminates every object with the same
	// intensity. If only ambient light is used, no shading effects will occur.
	ambientLight = new THREE.AmbientLight(0x444444, 1.0);
	scene.add(ambientLight);

	// Directional light has a source and shines in all directions, like the sun.
	// This behaviour creates shading effects.
	directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
	directionalLight.position = camera.position;
	scene.add(directionalLight);
}