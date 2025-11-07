// Points object에 texture (sprite)를 mapping 하여 particle animation 효과 주기
import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initRenderer, initCamera, initStats, createGhostTexture } from './util.js';

// global variables
let cloud = null;  // Particle Cloud Group
let step = 0;      // for rotation of particles in animation

const scene = new THREE.Scene();
const webGLRenderer = initRenderer();
const camera = initCamera(new THREE.Vector3(20, 0, 150));
const stats = initStats();

const controls = new function () {
  this.size = 15;           
  this.transparent = true;   
  this.opacity = 0.6;         // 투명도: 0은 완전 투명, 1은 완전 불투명
  this.color = 0xffffff;
  this.rotate = true;
  this.sizeAttenuation = true; // camera에서 멀어질수록 파티클 크기 줄어듦

  this.redraw = function () {
    // scene의 child 중 "points"라는 이름을 가진 object를 cloud로 설정
    let cloud = scene.getObjectByName("points"); 
    if (cloud) scene.remove(cloud); // 이미 존재하는 points 제거
    // 새로운 points를 현재 controls option으로 생성
    createPoints(controls.size, controls.transparent, controls.opacity, 
                 controls.sizeAttenuation, controls.color);
  };
};

const gui = new GUI();
// 각 controls option에 변화가 생기면 controls.redraw() call
gui.add(controls, 'size', 0, 20).onChange(controls.redraw);
gui.add(controls, 'transparent').onChange(controls.redraw);
gui.add(controls, 'opacity', 0, 1).onChange(controls.redraw);
gui.addColor(controls, 'color').onChange(controls.redraw);
gui.add(controls, 'sizeAttenuation').onChange(controls.redraw);
gui.add(controls, 'rotate');

controls.redraw(); // 초기 설정으로 첫번째 points 생성

render(); // 애니메이션 시작

function createPoints(size, transparent, opacity, sizeAttenuation, color) {
  // BufferGeometry 사용
  const geom = new THREE.BufferGeometry();
  const positions = [];

  // x, y, z 각각 -250 ~ 250 사이의 랜덤 위치 5000개 생성 
  const range = 500;
  for (let i = 0; i < 5000; i++) {
    positions.push(
      Math.random() * range - range / 2,  // x
      Math.random() * range - range / 2,  // y
      Math.random() * range - range / 2   // z
    );
  }

  // Float32Array로 변환하고 BufferAttribute (position) 생성
  geom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)  // 3은 3차원 (x, y, z)
  );

  // Particle material 생성
  const material = new THREE.PointsMaterial({
    size: size,
    transparent: transparent,
    opacity: opacity,
    map: createGhostTexture(), // see util.js
    sizeAttenuation: sizeAttenuation,
    color: color
  });

  // Points object 생성 (Mesh와 유사하게 취급됨)
  cloud = new THREE.Points(geom, material); 
  cloud.name = 'points'; // name을 설정해야 나중에 scene.getObjectByName()으로 찾을 수 있음
  scene.add(cloud);
}

function render() {
  stats.update();
  // rotation angle이 positive step 만큼 증가하는데도 
  // particle들이 오른쪽으로 움직이다가 다시 왼쪽으로를 반복하는 이유는
  // step의 증가가 rotation angle의 증가이기 때문에 
  // angle이 2*PI를 넘어가면 다시 0도와 마찬가지가 되기 때문
  if (controls.rotate) {
    step += 0.005;
    cloud.rotation.x = step;
    cloud.rotation.z = step;
  }
  requestAnimationFrame(render);
  webGLRenderer.render(scene, camera);
}