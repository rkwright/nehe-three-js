var vertShader = document.getElementById('vertex_shh').innerHTML;
var fragShader = document.getElementById('fragment_shh').innerHTML;

var attributes = {}; // custom attributes

var uniforms = {    // custom uniforms (your textures)

  tOne: { type: "t", value: THREE.ImageUtils.loadTexture( "cover.png" ) },
  tSec: { type: "t", value: THREE.ImageUtils.loadTexture( "grass.jpg" ) }

};

var material_shh = new THREE.ShaderMaterial({

  uniforms: uniforms,
  attributes: attributes,
  vertexShader: vertShader,
  fragmentShader: fragShader

});

var me = new THREE.Mesh( new THREE.CubeGeometry(80,80,80), material_shh );

varying vec2 vUv;

void main()
{
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}