// Points object에 texture (sprite)를 mapping 하여 particle animation 효과 주기
import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initRenderer, initCamera, initStats, createGhostTexture } from './util.js';

// global variables
let system1;
let cloud;

const scene = new THREE.Scene();
const renderer = initRenderer();
const camera = initCamera(new THREE.Vector3(20, 40, 110));
camera.lookAt(new THREE.Vector3(20, 30, 0));
scene.add(camera);
const stats = initStats();

const controls = new function () {
  this.size = 3;
  this.transparent = true;
  this.opacity = 0.6;
  this.color = 0xffffff;

  this.sizeAttenuation = true;

  this.redraw = function () {
    scene.remove(scene.getObjectByName("particles1"));
    createPointCloud(controls.size, controls.transparent, controls.opacity, 
                     controls.sizeAttenuation, controls.color);
  };
};

const gui = new GUI();
gui.add(controls, 'size', 0, 20).onChange(controls.redraw);
gui.add(controls, 'transparent').onChange(controls.redraw);
gui.add(controls, 'opacity', 0, 1).onChange(controls.redraw);
gui.addColor(controls, 'color').onChange(controls.redraw);
gui.add(controls, 'sizeAttenuation').onChange(controls.redraw);

controls.redraw();

render();

function createPointCloud(size, transparent, opacity, sizeAttenuation, color) {
  const texture = new THREE.TextureLoader().load("./assets/textures/raindrop-3.png");
  const geom = new THREE.BufferGeometry(); 
  const positions = [];   // array for positions
  const velocities = [];  // array for velocities

  // Blending modes
  // THREE.NormalBlending: 기본 블렌딩 모드, 투명도에 따라 두 color 더함
  // THREE.AdditiveBlending: 더하기 블렌딩 모드, 두 color 더함 (겹치는 부분이 더 밝아짐), 빛, 불꽃 등에 사용
  // THREE.SubtractiveBlending: 빼기 블렌딩 모드, 이전 color에서 새 color를 빼기 (겹치는 부분이 더 어두워 짐)
  // THREE.MultiplyBlending: 곱하기 블렌딩 모드, 두 color 곱함 (겹치는 부분이 더 어두워 짐)
  
  const material = new THREE.PointsMaterial({
    size: size,
    transparent: transparent,
    opacity: opacity,
    map: texture,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: sizeAttenuation,
    color: color
  });

  // random position
  const range = 40;
  for (let i = 0; i < 1500; i++) {
    positions.push(
      Math.random() * range - range / 2,  // x = -20 ~ 20 사이의 랜덤 value
      Math.random() * range * 1.5,        // y = 0 ~ 30 사이의 랜덤 value
      1 + (i/100)                         // z = 1 + (i/100): 1 ~ 15로 순차적으로 증가
    );
    
    // 속도 정보 저장
    velocities.push(
      (Math.random() - 0.5) / 3,  // velocityX: -0.167 ~ 0.167
      0.1 + Math.random() / 5     // velocityY: 0.1 ~ 0.3
    );
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  // 속도 정보를 사용자 정의 속성으로 저장
  geom.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 2));

  cloud = new THREE.Points(geom, material);
  cloud.sortParticles = true;
  cloud.name = "particles1";

  scene.add(cloud);
}

function render() {
  stats.update();
  
  const positions = cloud.geometry.attributes.position.array;
  const velocities = cloud.geometry.attributes.velocity.array;
  
  for (let i = 0; i < positions.length; i += 3) {
    // y 위치 업데이트: 위에서 아래로 하강
    positions[i + 1] -= velocities[(i/3) * 2 + 1];  // velocityY
    // x 위치 업데이트: 우측에서 좌측으로 이동
    positions[i] -= velocities[(i/3) * 2];          // velocityX

    // 경계 체크, 범위 밖으로 나가면 X velocity 부호 반대로
    if (positions[i + 1] <= 0) positions[i + 1] = 60;
    if (positions[i] <= -20 || positions[i] >= 20) {
      velocities[(i/3) * 2] *= -1;  // velocityX 방향 전환
    }
  }

  cloud.geometry.attributes.position.needsUpdate = true;

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
