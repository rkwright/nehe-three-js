// standard global variables
var scene, camera, renderer;
 
// Character 3d object
var character = null;
 
//standard global variables
var scene, camera, renderer;
 
// Character 3d object
var character = null;
 
// FUNCTIONS
function init() {
    // SCENE
    scene = new THREE.Scene();
 
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth,
        SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 45,
        ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
        NEAR = 0.1, FAR = 1000;
 
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0,0,5);
    camera.lookAt(scene.position);
 
    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha: true });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    var container = document.body;
    container.appendChild( renderer.domElement );
 
    // Main polygon
    character = buildCharacter();
    scene.add(character);
 
    // Create light
    var light = new THREE.PointLight(0xffffff, 1.0);
    // We want it to be very close to our character
    light.position.set(0.0,0.0,0.1);
    scene.add(light);
    
    // Start animation
    animate();
}
 
var buildCharacter = (function() {
    var _geo = null;
 
    // Share the same geometry across all planar objects
    function getPlaneGeometry() {
        if(_geo == null) {
            _geo = new THREE.PlaneGeometry(1.0, 1.0);
        }
 
        return _geo;
    };
 
    return function() {
        var g = getPlaneGeometry();
        
        var creatureImage = THREE.ImageUtils.loadTexture('texture.png');
        creatureImage.magFilter = THREE.NearestFilter;
        
        var mat = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    color: {type: 'f', value: 0.0},
                    evilCreature: {type: 't', value: null}
                }
            ]),
            vertexShader: document.getElementById('vertShader').text,
            fragmentShader: document.getElementById('fragShader').text,
            transparent: true,
            lights: true
        });
        
        // THREE.UniformsUtils.merge() call THREE.clone() on each
        // uniform. We don't want our texture to be duplicated, so
        // I assign it to the uniform value right here.
        mat.uniforms.evilCreature.value = creatureImage;

        var obj = new THREE.Mesh(g, mat);
        return obj;
    }
})();

function animate() {
    // Update uniform
    var c = 0.5+0.5*Math.cos(new Date().getTime()/1000.0 * Math.PI);
    character.material.uniforms.color.value = c;
    // Render scene
    renderer.render( scene, camera );
    requestAnimationFrame( animate );
}