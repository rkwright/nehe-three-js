var quadTexture;
var	quadric;
var	quadGeometry;
var	quadMaterial;
var	materialType = 'p';	// texture, paint or wire
var	quadType = 'b';

// allocate the Scene object, request orbitControls, some of 3D axes 10 units high and the stats
var nScene = new Scene( { axisHeight:10, 
						  controls:true, 
						  displayStats:true });

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

	// Load an image as texture
	quadTexture = new THREE.ImageUtils.loadTexture("images/clouds.jpg");

	quadMaterial = makeMaterial(materialType);

	quadric = makeQuad('0');
	
	document.addEventListener("keypress", onDocumentKeyPress, false);
};

function makeMaterial ( matType ) {
	
	materialType = matType;
	if ( materialType == 't')
		quadMat = new THREE.MeshPhongMaterial({ map:quadTexture, side:THREE.DoubleSide });
	else if (materialType == 'w')
		quadMat = new THREE.MeshBasicMaterial({ wireframe:true });
	else
		quadMat = new THREE.MeshLambertMaterial({ color: '#00abb1' });
	
	return quadMat;
}

function makeQuad( qType ) {

	quadType = qType;
	
	nScene.remove( quadric );

	switch ( quadType ) {
		case '0':
			quadGeometry = new THREE.BoxGeometry(2.0, 2.0, 2.0);
		break;		
		case '1':
			quadGeometry = new THREE.CircleGeometry(2.0, 32);
		break;
		case '2':
			quadGeometry = new THREE.CylinderGeometry(2.0, 2.0, 5, 32);
		break;
		case '3':
			quadGeometry = new THREE.DodecahedronGeometry(2.0);
		break;
		case '4':
			quadGeometry = new THREE.IcosahedronGeometry(2.0);
		break;
		case '5': 
			quadGeometry = new THREE.CylinderGeometry(0.0, 2.0, 5, 64);	
		break;
		case '6':
			quadGeometry = new THREE.OctahedronGeometry(2.0, 2.0, 2.0);
		break;
		case '7':
			quadGeometry = new THREE.RingGeometry(0.5, 2.0, 32);
		break;
		case '8':
			quadGeometry = new THREE.SphereGeometry(2.0, 32, 32);
		break;
		case '9':
			quadGeometry = new THREE.TetrahedronGeometry(2.0);
		break;
		case 'a':
			quadGeometry = new THREE.TorusGeometry(2.0, 0.5, 16, 100);
		break;
		case 'b':
			quadGeometry = new THREE.TorusKnotGeometry(2.0, 0.5, 100, 16);
		break;
	}

	quad = new THREE.Mesh(quadGeometry, quadMaterial);
	
	nScene.addToScene(quad);
	
	return quad;
}

function onDocumentKeyPress(event) {
	// Get the key code of the pressed key
	var keyChar = String.fromCharCode(event.which);

	var quadString = "0123456789ab";
	var matString = "ptw";
	
	if ( quadString.indexOf(keyChar) != -1) {
		quadric = makeQuad(keyChar);
	}
	else if (matString.indexOf(keyChar) != -1) {
		quadMaterial = makeMaterial(keyChar);
		quadric = makeQuad(quadType);
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
