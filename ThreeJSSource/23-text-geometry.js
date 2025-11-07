import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initOrbitControls } from './util.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// global variables
let textMesh = null;
let font = null;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const params = {
    text: "Hello Three.js!",   // 기본 텍스트
    size: 5,                   // 글자 크기
    height: 1,                  // 글자 두께
    curveSegments: 12,         // 부드러운 정도
    bevelEnabled: true,        // 베벨 효과 (엣지 다듬기)
    bevelThickness: 0.3,       // 베벨 두께
    bevelSize: 0.3,            // 베벨 크기
    bevelOffset: 0,            // 베벨 오프셋
    bevelSegments: 5           // 베벨 세그먼트
};

// 4. 폰트 로드
const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (loadedFont) {
    font = loadedFont;
    createText();
});

// 5. 조명 추가
const light = new THREE.DirectionalLight(0xffffff, 15);
light.position.set(10, 20, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const orbitControls = initOrbitControls(camera, renderer);

const gui = new GUI();
gui.add(params, 'text').onFinishChange(createText);
gui.add(params, 'size', 1, 10, 0.1).onChange(createText);
gui.add(params, 'height', 0.1, 5, 0.1).onChange(createText);
gui.add(params, 'curveSegments', 1, 20, 1).onChange(createText);
gui.add(params, 'bevelEnabled').onChange(createText);
gui.add(params, 'bevelThickness', 0.1, 2, 0.1).onChange(createText);
gui.add(params, 'bevelSize', 0.1, 2, 0.1).onChange(createText);
gui.add(params, 'bevelOffset', -1, 1, 0.1).onChange(createText);
gui.add(params, 'bevelSegments', 1, 10, 1).onChange(createText);

render();

function createText() {
    if (textMesh) {
        scene.remove(textMesh);
        textMesh.geometry.dispose();
        textMesh.material.dispose();
    }
    // 7. TextGeometry 생성
    const geometry = new TextGeometry(params.text, {
        font: font,
        size: params.size,
        height: params.height,
        curveSegments: params.curveSegments,
        bevelEnabled: params.bevelEnabled,
        bevelThickness: params.bevelThickness,
        bevelSize: params.bevelSize,
        bevelOffset: params.bevelOffset,
        bevelSegments: params.bevelSegments
    });

    // 8. 재질(Material) 설정
    const material = new THREE.MeshStandardMaterial({ color: 0x0077ff, metalness: 0.5, roughness: 0.3 });

    // 9. 메시(Mesh) 생성 및 씬에 추가
    textMesh = new THREE.Mesh(geometry, material);
    textMesh.position.set(-10, 0, 0);
    scene.add(textMesh);
}

function render() {
    requestAnimationFrame(render);
    if (textMesh) {
        textMesh.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});