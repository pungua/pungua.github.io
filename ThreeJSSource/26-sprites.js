// Scene을 2개 (scene, sceneOrtho) 만들어서
// scene에는 3d object (sphere)를 넣고
// sceneOrtho에는 2d object (sprite) 를 넣음
// 두 개의 scene이 겹쳐 보이게 함
import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initRenderer, initCamera, initStats } from './util.js';

let step = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const sceneOrtho = new THREE.Scene();
const webGLRenderer = initRenderer();
const camera = initCamera(new THREE.Vector3(0, 0, 50));
// orthographic camera (parameters: left, right, top, bottom, near, far)
const cameraOrtho = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -10, 10);

const stats = initStats();

const material = new THREE.MeshNormalMaterial(); // normal 값에 따라 rgb로 표현
const geom = new THREE.SphereGeometry(15, 20, 20);
const mesh = new THREE.Mesh(geom, material); // sphere mesh
scene.add(mesh);

const getTexture = function () { // return 값이 getTexture로 assign
  const texture = new THREE.TextureLoader().load("./assets/textures/sprite-sheet.png");
  return texture;
};

const controls = new function () { // anonymous class를 만들고 그 constructor가 function이 됨
  this.size = 150;
  this.sprite = 0;
  this.transparent = true;
  this.opacity = 0.6;
  this.color = 0xffffff;
  this.rotateSystem = true;

  this.redraw = function () { // 현재 controls 값으로 새로운 sprite 생성
    sceneOrtho.children.forEach(function (child) {
      if (child instanceof THREE.Sprite) sceneOrtho.remove(child);
    });
    createSprite(controls.size, controls.transparent, controls.opacity, controls.color, controls.sprite);
  };
};

const gui = new GUI();
gui.add(controls, 'sprite', 0, 4).step(1).onChange(controls.redraw); // sprite 값 0~4 증가 (1씩 증가))
gui.add(controls, 'transparent').onChange(controls.redraw);
gui.add(controls, 'opacity', 0, 1).onChange(controls.redraw);
gui.addColor(controls, 'color').onChange(controls.redraw);

controls.redraw(); // 첫번째 redraw 호출

render();

function createSprite(size, transparent, opacity, color, spriteNumber) {
  const spriteMaterial = new THREE.SpriteMaterial({
    opacity: opacity,
    color: color,
    transparent: transparent,
    map: getTexture()
  });

  // we have 1 row, with five sprites
  // 0.2 * spriteNumber: 0.2, 0.4, 0.6, 0.8, 1 로 sprite의 시작 위치 설정
  spriteMaterial.map.offset = new THREE.Vector2(0.2 * spriteNumber, 0);
  spriteMaterial.map.repeat = new THREE.Vector2(1 / 5, 1); // 5개의 sprite가 1 row에 있음
  // sprite가 black (0, 0, 0) background 이므로, AdditiveBlending 사용하면 
  // 겹치는 부분에서는 sphere의 color만 보이게 되므로, 자연스럽게 sprite가 sphere위에 그려지게 됨
  spriteMaterial.blending = THREE.AdditiveBlending;
  //spriteMaterial.blending = THREE.MultiplyBlending;
  // make sure the object is always rendered at the front
  spriteMaterial.depthTest = false;
  
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(size, size, size);
  sprite.position.set(100, 50, -10);
  sprite.velocityX = 5;

  sceneOrtho.add(sprite);
}

function render() {

  stats.update();

  camera.position.y = Math.sin(step += 0.01) * 20;

  sceneOrtho.children.forEach(function (e) {
    if (e instanceof THREE.Sprite) {
      // move the sprite along the bottom
      e.position.x = e.position.x + e.velocityX;
      if (e.position.x > window.innerWidth) {
        e.velocityX = -5;
        controls.sprite += 1;
        e.material.map.offset.set(1 / 5 * (controls.sprite % 4), 0);
      }
      if (e.position.x < 0) {
        e.velocityX = 5;
      }
    }
  });


  requestAnimationFrame(render);

  webGLRenderer.render(scene, camera);
  // animation 때 autoClear 하지 않고 sprite가 겹쳐 보이게 함
  webGLRenderer.autoClear = false;
  webGLRenderer.render(sceneOrtho, cameraOrtho);

}