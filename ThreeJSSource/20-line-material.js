import * as THREE from 'three';  
import { initStats, initRenderer, initCamera, initOrbitControls } from './util.js';

const scene = new THREE.Scene();

const stats = initStats();
const renderer = initRenderer();
const camera = initCamera();
const orbitControls = initOrbitControls(camera, renderer);

const ambientLight = new THREE.AmbientLight(0x0c0c0c);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// add spotlight for the shadows
const spotLight = new THREE.SpotLight(0xffffff, 100);
spotLight.position.set(-40, 60, -10);
spotLight.castShadow = true;
scene.add(spotLight);

// Creating line geometry
// first, series of points
const positions = [
  -10,  5, 0,   // first point
    0, -3, 0,   // second point
   10,  5, 0    // third point
];

// convert to Float32Array
// 3차원 좌표 이므로 parameter 3
const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', positionAttribute);

// Line Material 
const material = new THREE.LineBasicMaterial({
  color: 0xffff00, 
  linewidth: 1  // WebGL renderer에서는 무시되어 1로만 사용됨
});

// Line object
const line = new THREE.Line(geometry, material);
scene.add(line);

// axes helper
const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

// call the render function
let step = 0;
render();

function render() {
  stats.update();
  orbitControls.update();
  line.rotation.z = step += 0.01;

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

