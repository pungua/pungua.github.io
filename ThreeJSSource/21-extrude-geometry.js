import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initStats, initRenderer, initCamera, initOrbitControls } from './util.js';

const scene = new THREE.Scene();
const stats = initStats();
const renderer = initRenderer();
const camera = initCamera();
const orbitControls = initOrbitControls(camera, renderer);
const clock = new THREE.Clock();

// 7. 조명 추가
const light = new THREE.DirectionalLight(0xffffff, 5.0);
light.position.set(10, 10, 10);
scene.add(light);

const light2 = new THREE.DirectionalLight(0xffffff, 2.0);
light2.position.set(-10, 0, 10);
scene.add(light2);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

// extrude mesh object 
let mesh;

// Shape (2D 도형) 생성
const shape = new THREE.Shape();
shape.moveTo(0, 0);
shape.lineTo(5, 0);
shape.lineTo(4, 3);
shape.lineTo(1, 4);
shape.lineTo(0, 0);

// 5. 기본 Extrude 설정값 정의
const extrudeSettings = {
    steps: 2,  // 단면의 갯수, 최소는 2 (맨앞, 맨뒤), 증가할 수록 중간에 단면 수가 증가
    depth: 5,  // extrude 깊이 
    bevelEnabled: true, // 단면 모서리 둥글게 만들기 활성화 
    bevelThickness: 0.5, // 둥근 부분 제외한 단면이 튀어 나오는 사이즈
    bevelSize: 0.5, // 둥근 부분의 크기 
    bevelOffset: 0, // 둥근 부분이 단면을 크게 만드는 크기 
    bevelSegments: 5 // 둥근 부분을 나누어 곡선으로 보이게 만들기 위한 세그먼트 수
};

createExtrudedMesh();

const gui = new GUI();

// GUI 컨트롤 추가
gui.add(extrudeSettings, 'steps', 1, 10, 1).onChange(createExtrudedMesh);
gui.add(extrudeSettings, 'depth', 1, 20, 1).onChange(createExtrudedMesh);
gui.add(extrudeSettings, 'bevelThickness', 0, 2, 0.1).onChange(createExtrudedMesh);
gui.add(extrudeSettings, 'bevelSize', 0, 2, 0.1).onChange(createExtrudedMesh);
gui.add(extrudeSettings, 'bevelOffset', -1, 1, 0.1).onChange(createExtrudedMesh);
gui.add(extrudeSettings, 'bevelSegments', 0, 10, 1).onChange(createExtrudedMesh);

render();

function createExtrudedMesh() {
    // 이전 mesh 제거 (기존 geometry 메모리 정리)
    if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    // 새로운 ExtrudeGeometry 생성
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Material 설정
    const material = new THREE.MeshStandardMaterial({ color: 0x0077ff, metalness: 0.5, roughness: 0.3 });

    // Mesh 생성 및 씬에 추가
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function render() {
    requestAnimationFrame(render);
    stats.update();
    orbitControls.update();
    //mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
}

