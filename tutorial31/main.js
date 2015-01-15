var crateTexture;
var	yTranslation = 1.05;
var	zTranslation = 0.0;
var	xPos, yPos;
var fogDensity = 0.05;
var	car;

// allocate the Scene object, request orbitControls, some of 3D axes 10 units high and the stats
var nScene = new Scene( { axisHeight:10, 
						  controls:true, 
						  displayStats:true,
						  floorRepeat:10,
						  fogType:'linear'});

// set up the THREE.js scene via our Scene object
nScene.initialize();

// then initialize our demo's stuff
initializeDemo();

// Animate the scene
animateScene();

/**
 * Initialize the Demo.  
 */

function initializeDemo() {

	document.addEventListener("keypress", onDocumentKeyPress, false);

	new THREE.BinaryLoader().load('models/VeyronNoUv_bin.js', function(geometry) {     
		var orange = new THREE.MeshLambertMaterial( { color: 0x995500, opacity: 1.0, transparent: false } );     
		var mesh	= new THREE.Mesh( geometry, orange );     
		mesh.scale.x = mesh.scale.y = mesh.scale.z = 0.025;
		mesh.position.y += 0.90;
		nScene.addToScene( mesh ); 
		
		car = mesh; 
	}); 
}

/*
function initializeDemo() {

	document.addEventListener("keypress", onDocumentKeyPress, false);
	var binaryLoader = new THREE.BinaryLoader().load( "models/VeyronNoUv_bin.js", addModelToScene );
	
};

function addModelToScene( geometry, materials ) {
	var material = new THREE.MeshFaceMaterial( materials );
	car = new THREE.Mesh( geometry, material );
	car.scale.set(0.025, 0.025, 0.025);
	car.position.y += 0.90;
	nScene.addToScene( car );
}
*/

function onDocumentKeyPress(event) {
	// Get the key code of the pressed key
	var keyChar = String.fromCharCode(event.which);

}

/**
 * Animate the scene and call rendering.
 */
function animateScene() {

	// Tell the browser to call this function when page is visible
	requestAnimationFrame(animateScene);
	
	// Map the 3D scene down to the 2D screen (render the frame)
	nScene.renderScene();
}
