// 06-ambient-light.js
// - SpotLightHelper
// - AmbientColor: intensity and color

import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initStats, initRenderer, initCamera, initOrbitControls, addHouseAndTree } from './util.js';

const scene = new THREE.Scene();

const stats = initStats();  // see util.js
const renderer = initRenderer();  // see util.js
const camera = initCamera();  // see util.js
scene.add(camera);

// add ambient lighting
const ambientLight = new THREE.AmbientLight("#606008", 1);
scene.add(ambientLight);

// add directional lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 20);
scene.add(directionalLight);

// add spotlight for the shadows
const spotLight = new THREE.SpotLight(0xffffff, 100, 200, Math.PI / 4, 0.1, 1);
spotLight.position.set(-30, 40, -10); 
spotLight.target.position.set(0, 0, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.set(2048, 2048);
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 200;

scene.add(spotLight);
scene.add(spotLight.target);  // target도 scene에 추가

// SpotLightHelper는 spotlight의 위치와 방향을 시각적으로 보여줌
const spotLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(spotLightHelper);

// add a simple scene, see util.js
addHouseAndTree(scene)

// add controls
const orbitControls = initOrbitControls(camera, renderer);

// add gui controls
//const guiControls = 
setupGUIControls();

// call the render function
render();

function render() {
  stats.update();
  orbitControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function setupGUIControls() {
  const controls = new function () {
    this.intensity = ambientLight.intensity;
    this.ambientColor = ambientLight.color.getStyle();
    this.disableSpotlight = false;
  };

  const gui = new GUI();
  gui.add(controls, 'intensity', 0, 3, 0.1).onChange(function (e) {
    ambientLight.color = new THREE.Color(controls.ambientColor);
    ambientLight.intensity = controls.intensity;
  });
  gui.addColor(controls, 'ambientColor').onChange(function (e) {
    ambientLight.color = new THREE.Color(controls.ambientColor);
    ambientLight.intensity = controls.intensity;
  });
  gui.add(controls, 'disableSpotlight').onChange(function (e) {
    spotLight.visible = !e;
  });

  return controls;
}