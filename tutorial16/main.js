var crateTexture;
var	yTranslation = 1.05;
var	zTranslation = 0.0;
var	xPos, yPos;
var fogDensity = 0.05;

// allocate the Scene object, request orbitControls, some of 3D axes 10 units high and the stats
var nScene = new Scene( { axisHeight:10, 
						  controls:true, 
						  displayStats:true,
						  floorRepeat:10,
						  fogType:'linear',
						  fogDensity : fogDensity,
						  fogColor: 0xffffff });

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

	// Create the cubes
	var boxGeometry = new THREE.BoxGeometry(2.0, 2.0, 2.0);

	// Load an image as texture
	crateTexture = new THREE.ImageUtils.loadTexture("images/Crate.jpg");

	var boxMaterial = new THREE.MeshLambertMaterial({
		map:crateTexture,
		side:THREE.DoubleSide
	});

	for ( var x=-20; x<=20; x += 4 ) {
		boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
		boxMesh.position.set(x, yTranslation, zTranslation);
		nScene.addToScene(boxMesh);
	}
	
	for ( var z=-20; z<=20; z += 4 ) {
		boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
		boxMesh.position.set(0.0, yTranslation, z);
		nScene.addToScene(boxMesh);
	}
	
	document.addEventListener("keypress", onDocumentKeyPress, false);
};

function onDocumentKeyPress(event) {
	// Get the key code of the pressed key
	var keyChar = String.fromCharCode(event.which);

	if (keyChar == '+') {  
		if (fogDensity < 0.225 )
			fogDensity += 0.025;
		else 
			fogDensity = 0.25;
		nScene.addFog( { fogDensity: fogDensity } );
	}
	else if (keyChar == '-') {  
		if (fogDensity > 0.025)
			fogDensity -= 0.025;
		else
			fogDensity = 0;
		nScene.addFog( { fogDensity: fogDensity } );
	}
	else if (keyChar == 'r') {
		nScene.addFog( { fogColor: 0xff0000 } );
	}
	else if (keyChar == 'g') {
		nScene.addFog( { fogColor: 0x00ff00 } );
	}	
	else if (keyChar == 'b') {
		nScene.addFog( { fogColor: 0x0000ff } );
	}
	else if (keyChar == 'k') {
		nScene.addFog( { fogColor: 0x000000 } );
	}	
	else if (keyChar == 'w') {
		nScene.addFog( { fogColor: 0xffffff } );
	}
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
