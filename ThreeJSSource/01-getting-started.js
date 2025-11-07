// 01-getting-started.js
// - import add-ons
// - default export vs named export
// - scene, background
// - camera, PerspectiveCamera
// - Setting a position
// - renderer: antialiasing, outputColorSpace, enabling shadowMap, shadowMap type, 
// - renderer: setting size, setting clearColor, append renderer to html document
// - stats object
// - orbitControls object: damping
// - GUI value input
// - resize event listener
// - AxesHelper
// - GridHelper
// - ambient light
// - directional light, how to change the target of directional light, casting shadow
// - Mesh = geometry + material
// - cubeGeometry, torusKnotGeometry, planeGeometry, casting shadows, receiving shadows
// - MeshLambertMaterial, MeshPhongMaterial
// - rotation transformation
// - requestAnimationFrame

// main three.module.js library
import * as THREE from 'three';  

// addons: OrbitControls (jsm/controls), Stats (jsm/libs), GUI (jsm/libs)
//
// module default export & import (library에서 export하는 것이 하나뿐인 경우):
//             export default function myFunction() { ... }
//             import myFunction from './myModule'; // 중괄호 없이 import
//
// module named export & import:
//             export myFunction() { ... };
//             export const myVariable = 42;
//             import { myFunction, myVariable } from './myModule'; // 중괄호 사용

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// main scene
const scene = new THREE.Scene();
scene.backgroundColor = 0xffffff;  // white background

// Perspective camera: fov, aspect ratio, near, far
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

// set camera position: camera.position.set(-3, 8, 2) 가 더 많이 사용됨 (약간 빠름))
camera.position.x = -3;
camera.position.y = 8;
camera.position.z = 2;

// add camera to the scene
scene.add(camera);

// setup the renderer
// antialias = true: 렌더링 결과가 부드러워짐
const renderer = new THREE.WebGLRenderer({ antialias: true });

// outputColorSpace의 종류
// sRGBColorSpace: 보통 monitor에서 보이는 color로, 어두운 부분을 약간 밝게 보이게 Gamma correction을 함
// sRGBColorSpace는 PBR (Physically Based Rendering), HDR(High Dynamic Range)에서는 필수적으로 사용함
// LinearColorSpace: 모든 색상을 선형으로 보이게 함
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.shadowMap.enabled = true; // scene에서 shadow를 보이게

// shadowMap의 종류
// BasicShadowMap: 가장 기본적인 shadow map, 쉽고 빠르지만 부드럽지 않음
// PCFShadowMap (default): Percentage-Closer Filtering, 주변의 색상을 평균내서 부드럽게 보이게 함
// PCFSoftShadowMap: 더 부드럽게 보이게 함
// VSMShadowMap: Variance Shadow Map, 더 자연스러운 블러 효과, GPU에서 더 많은 연산 필요
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 현재 열린 browser window의 width와 height에 맞게 renderer의 size를 설정
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
// attach renderer to the body of the html page
document.body.appendChild(renderer.domElement);

// add Stats: 현재 FPS를 보여줌으로써 rendering 속도 표시
const stats = new Stats();
// attach Stats to the body of the html page
document.body.appendChild(stats.dom);

// add OrbitControls: arcball-like camera control
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true; // 관성효과, 바로 멈추지 않고 부드럽게 멈춤
orbitControls.dampingFactor = 0.05; // 감속 정도, 크면 더 빨리 감속, default = 0.05

// add GUI: 간단한 user interface를 제작 가능
// 사용법은 https://lil-gui.georgealways.com/ 
// http://yoonbumtae.com/?p=942 참고

const gui = new GUI();
const props = {
    cubeRotSpeed: 0.01,
    torusRotSpeed: 0.01,
};
gui.add(props, 'cubeRotSpeed', -0.2, 0.2, 0.01);
gui.add(props, 'torusRotSpeed', -0.2, 0.2, 0.01);


// listen to the resize events
window.addEventListener('resize', onResize, false);
function onResize() { // resize handler
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// axes helper: x, y, z 축을 보여줌 (red, green, blue 순서))
const axesHelper = new THREE.AxesHelper(10); // 10 unit 길이의 축을 보여줌
scene.add(axesHelper);

// GridHelper: xz plane에 grid를 보여줌
const gridHelper = new THREE.GridHelper(10, 7); // size: 10, division: 7
scene.add(gridHelper);

// add ambient light
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// add directional light
const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(5, 12, 8); // 여기서 부터 (0, 0, 0) 방향으로 light ray 방향
dirLight.castShadow = true;  // 이 light가 shadow를 만들어 낼 것임
scene.add(dirLight);

/*----- Directional light의 target 위치 바꾸기 ----------------------

  // Default target 위치는 (0, 0, 0)임

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10); // 광원이 있는 위치

  // Target Object 생성 (dummy object), Mesh는 Object3D의 subclass
  const targetObject = new THREE.Object3D();
  targetObject.position.set(5, 0, 0); // Target's position
  scene.add(targetObject);

  // Light의 Target 지정
  light.target = targetObject;
  scene.add(light);
-----------------------------------------------------------------*/

// create a cube and add it to the scene
// BoxGeometry: width, height, depth의 default는 1
//            : default center position = (0, 0, 0)
const cubeGeometry = new THREE.BoxGeometry();

// MeshLambertMaterial: ambient + diffuse
const cubeMaterial = new THREE.MeshLambertMaterial({ color:0x990000 });

// 하나의 mesh는 geometry와 material로 이루어짐
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.x = -1;
cube.castShadow = true; // light를 받을 떄 shadow를 만들어 냄
scene.add(cube);

// TorusKnotGeometry(radius, tube, tubularSegment, radialSegments, p, q)
// Threejs.org의 manual 참고 할 것
//                 : radius (default = 1), 전체 torus의 반지름
//                 : tube (default = 0.4), torus tube의 반지름
//                 : tubularSegments (default = 64), 전체 torus를 나누는 horizontal segment의 개수
//                 : radialSegments (default = 8), torus tube를 나누는 vertical segment의 개수
//                 : p (default = 2), torus가 만드는 원 모양의 감긴 개수
//                 : q (default = 3), torus의 큰 circle을 휘감는 개수
const torusKnotGeometry = new THREE.TorusKnotGeometry(0.5, 0.2, 100, 100);

// MeshPhongMaterial: ambient + diffuse + specular
const torusKnotMat = new THREE.MeshPhongMaterial({
	color: 0x00ff88,
});
const torusKnotMesh = new THREE.Mesh(torusKnotGeometry,torusKnotMat);
torusKnotMesh.castShadow = true; // light를 받을 떄 shadow를 만들어 냄
torusKnotMesh.position.x = 2;
scene.add(torusKnotMesh);

// add a plane: 원래 plane은 xy plane 위에 생성됨
const planeGeometry = new THREE.PlaneGeometry(15, 15); // width, height
const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaa00 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;  // x축 기준으로 -90도 회전 (+y를 up으로 하는 plane이 됨)
plane.position.y = -1;
plane.receiveShadow = true;
scene.add(plane);

let step = 0;

function animate() {

    // stats와 orbitControls는 매 frame마다 update 해줘야 함
    stats.update();
    orbitControls.update();

    step += 0.02;
    cube.position.x = 4 * Math.cos(step);  // x = -4 ~ 4 사이를 왕복
    cube.position.y = 4 * Math.abs(Math.sin(step));  // y = 0 ~ 4 사이를 왕복

    // cube의 rotation transformation (model transformation)
    // 각각 x, y, z 축을 기준으로 하는 rotation angle (radian)
    cube.rotation.x += props.cubeRotSpeed;
    cube.rotation.y += props.cubeRotSpeed;
    cube.rotation.z += props.cubeRotSpeed;

    // torusKnot의 rotation transformation
    // 각각 x, y, z 축을 기준으로 하는 rotation angle (radian)
    torusKnotMesh.rotation.x -= props.torusRotSpeed;
    torusKnotMesh.rotation.y += props.torusRotSpeed;
    torusKnotMesh.rotation.z -= props.torusRotSpeed;

    // 모든 transformation 적용 후, renderer에 렌더링을 한번 해 줘야 함
    renderer.render(scene, camera);

    // 다음 frame을 위해 requestAnimationFrame 호출 
    requestAnimationFrame(animate);
}

animate();






