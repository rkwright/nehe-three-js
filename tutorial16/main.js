var crateTexture;
var	yTranslation = 1.05;
var	zTranslation = 0.0;
var	xPos, yPos;

// allocate the Scene object, request orbitControls, some of 3D axes 10 units high and the stats
var nScene = new Scene( { axisHeight:10, 
						  controls:true, 
						  displayStats:true,
						  floorRepeat:10,
						  fogDensity : 0.05,
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
	
};

/**
 * Animate the scene and call rendering.
 */
function animateScene() {

	// Tell the browser to call this function when page is visible
	requestAnimationFrame(animateScene);
	
	// Map the 3D scene down to the 2D screen (render the frame)
	nScene.renderScene();
}
