// directional, spot, point light 이외에도 hemisphere, area light 등이 있음

import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initStats, initRenderer, initCamera, initOrbitControls, addHouseAndTree } from './util.js';

const scene = new THREE.Scene();

const stats = initStats();
const renderer = initRenderer();
const camera = initCamera();
const orbitControls = initOrbitControls(camera, renderer);
const clock = new THREE.Clock();

// add a simple scene
addHouseAndTree(scene)

// add subtle ambient lighting
const ambientLight = new THREE.AmbientLight("#0c0c0c");
scene.add(ambientLight);

// add a directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
directionalLight.position.set(10, 20, 20);
scene.add(directionalLight);

// add a point light
const pointColor = "#ccffcc";
const pointIntensity = 100;
const pointDecay = 200;
const pointLight = new THREE.PointLight(pointColor, pointIntensity, pointDecay);
pointLight.castShadow = true;
scene.add(pointLight);

const pointLightHelper = new THREE.PointLightHelper(pointLight);
//scene.add(pointLightHelper);

const shadowHelper = new THREE.CameraHelper(pointLight.shadow.camera)
//scene.add(shadowHelper)

// point light를 표시하는 작은 sphere
const sphereLight = new THREE.SphereGeometry(0.2);
const sphereLightMaterial = new THREE.MeshBasicMaterial({
  color: 0xac6c25
});
const sphereLightMesh = new THREE.Mesh(sphereLight, sphereLightMaterial);
sphereLightMesh.position.set(3, 0, 5);
scene.add(sphereLightMesh);

// call the render function
let step = 0;

// used to determine the switch point for the light animation
let invert = 1;
let phase = 0;

const controls = setupControls();
render();

function render() {

  pointLightHelper.update();
  shadowHelper.update();
  stats.update();
  orbitControls.update();
  pointLight.position.copy(sphereLightMesh.position);

  // move the light simulation
  if (phase > 2 * Math.PI) {
    invert = invert * -1;
    phase -= 2 * Math.PI;
  } else {
    phase += controls.rotationSpeed;
  }
  sphereLightMesh.position.z = +(25 * (Math.sin(phase)));
  sphereLightMesh.position.x = +(14 * (Math.cos(phase)));
  sphereLightMesh.position.y = 5;

  if (invert < 0) {
    const pivot = 14;
    sphereLightMesh.position.x = (invert * (sphereLightMesh.position.x - pivot)) + pivot;
  }
  // render using requestAnimationFrame
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function setupControls() {
  const controls = new function () {
    this.rotationSpeed = 0.01;
    this.bouncingSpeed = 0.03;
    this.ambientColor = ambientLight.color.getStyle();;
    this.pointColor = pointLight.color.getStyle();;
    this.intensity = 100;
    this.distance = pointLight.distance;
  };

  const gui = new GUI();
  gui.addColor(controls, 'ambientColor').onChange(function (e) {
    ambientLight.color = new THREE.Color(e);
  });

  gui.addColor(controls, 'pointColor').onChange(function (e) {
    pointLight.color = new THREE.Color(e);
  });

  gui.add(controls, 'distance', 0, 300).onChange(function (e) {
    pointLight.distance = e;
  });

  gui.add(controls, 'intensity', 0, 200).onChange(function (e) {
    pointLight.intensity = e;
  });

  return controls;
}