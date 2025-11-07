import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { initStats, initRenderer, initCamera, initOrbitControls } from './util.js';

let mesh = null;

const scene = new THREE.Scene();

// 2. 카메라 설정
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);
scene.add(camera);

// 3. 렌더러 설정
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 6. 조명 추가
const light = new THREE.DirectionalLight(0xffffff, 10);
light.position.set(10, 10, 10);
scene.add(light);

const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
light2.position.set(-10, -5, 10);
scene.add(light2);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// 4. 파라미터 초기 설정
const params = {
    a: 2,   // 3차 곡선 계수
    b: 1,   // 2차 곡선 계수
    c: 3,   // 1차 곡선 계수
    vSlope: 4,  // V 방향 직선의 기울기
    slices: 50,  // U 방향 세그먼트 수
    stacks: 20   // V 방향 세그먼트 수
};

// 5. 초기 곡면 생성
createSurface();

// 7. GUI 설정
const gui = new GUI();
gui.add(params, 'a', 0.1, 5, 0.1).onChange(createSurface);
gui.add(params, 'b', 0.1, 5, 0.1).onChange(createSurface);
gui.add(params, 'c', 0.1, 5, 0.1).onChange(createSurface);
gui.add(params, 'vSlope', 0, 10, 0.1).onChange(createSurface);
gui.add(params, 'slices', 10, 100, 1).onChange(createSurface);
gui.add(params, 'stacks', 10, 100, 1).onChange(createSurface);

const orbitControls = initOrbitControls(camera, renderer);
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 8. 애니메이션 루프 시작
animate();

// Parametric function: 0 <= u <= 1, 0 <= v <= 1 인 (u, v) 를 받아
// 3D 좌표 target = (x, y, z) 를 return 하는 function
// params는 GUI에서 입력되는 값
function surfaceFunction(u, v, target) {
    // U 방향 3차 곡선
    let uMapped = (u - 0.5) * 2; // u 값을 -1 ~ 1 범위로 조정

    // x(u) = au^3, y(u) = bu^2, z(u) = cu; 
    let x = params.a * Math.pow(uMapped, 3);
    let y = params.b * Math.pow(uMapped, 2);
    let z = params.c * u;

    // V 방향 직선 추가: z(v) = slope * v 
    let zEnd = z + params.vSlope * v; 
    z = z * (1 - v) + zEnd * v;

    target.set(x, y, z);
}

function createSurface() {
    if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    // 새로운 ParametricGeometry 생성
    const geometry = new ParametricGeometry(surfaceFunction, params.slices, params.stacks);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x0077ff, 
        metalness: 0.5, 
        roughness: 0.3, 
        side: THREE.DoubleSide 
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function animate() {
    orbitControls.update();
    requestAnimationFrame(animate);
    //mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});