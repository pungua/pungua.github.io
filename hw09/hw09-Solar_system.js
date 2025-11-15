import * as THREE from 'three';  


import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { initRenderer, initCamera, initStats, initOrbitControls, 
         initDefaultLighting, addLargeGroundPlane, addGeometry } from './util.js';

const textureLoader = new THREE.TextureLoader();

// main scene
const scene = new THREE.Scene();
scene.backgroundColor = 0x000000;  // 배경색 : 검정


// 렌더러 추가, 안티앨리어싱
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; // scene에서 shadow를 보이게

// 현재 열린 browser window의 width와 height에 맞게 renderer의 size를 설정
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(scene.backgroundColor); // 검정색으로.. 
// attach renderer to the body of the html page
document.body.appendChild(renderer.domElement);

// listen to the resize events
window.addEventListener('resize', onResize, false);
function onResize() { // resize handler
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Perspective camera: fov, aspect ratio, near, far
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(120,60,180)
camera.lookAt(scene.position);
scene.add(camera);

// add OrbitControls: arcball-like camera control
let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true; // 관성효과, 바로 멈추지 않고 부드럽게 멈춤
orbitControls.dampingFactor = 0.05; // 감속 정도, 

// stats : fps 보여주기
const stats = new Stats();
document.body.appendChild(stats.dom); // attach Stats to the body of the html page






// const axesHelper = new THREE.AxesHelper(10); // 10 unit 길이의 축을 보여줌
// scene.add(axesHelper);

// // GridHelper: xz plane에 grid를 보여줌
// const gridHelper = new THREE.GridHelper(10, 7); // size: 10, division: 7
// scene.add(gridHelper);


// add ambient light
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// add directional light
const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(5, 12, 8); // 여기서 부터 (0, 0, 0) 방향으로 light ray 방향
dirLight.castShadow = true;  // 이 light가 shadow를 만들어 낼 것임
scene.add(dirLight);

// 태양 배치 : basic Material
const sun = new THREE.Mesh(new THREE.SphereGeometry(10), new THREE.MeshBasicMaterial({ color:0xFFFF00 }));
scene.add(sun);

let mat; // 텍스쳐 로딩해둘 머터리얼 임시 저장용

// mercury
mat = new THREE.MeshLambertMaterial({map: textureLoader.load('./Mercury.jpg')})
const mercury = new THREE.Mesh(new THREE.SphereGeometry(1.5) ,mat);

mercury.position.x=20;
mercury.castShadow = true;
let mercury_base = new THREE.Object3D().add(mercury);
scene.add(mercury_base);


// venus
mat = new THREE.MeshLambertMaterial({map: textureLoader.load('./Venus.jpg')})
const venus = new THREE.Mesh(new THREE.SphereGeometry(3) ,mat);

venus.position.x=35;
venus.castShadow = true;
let venus_base = new THREE.Object3D().add(venus);
scene.add(venus_base);


// earth
mat = new THREE.MeshLambertMaterial({map: textureLoader.load('./Earth.jpg')})
const earth = new THREE.Mesh(new THREE.SphereGeometry(3.5) ,mat);

earth.position.x=50;
earth.castShadow = true;
let earth_base = new THREE.Object3D().add(earth);
scene.add(earth_base);


// venus
mat = new THREE.MeshLambertMaterial({map: textureLoader.load('./Mars.jpg')})
const mars = new THREE.Mesh(new THREE.SphereGeometry(2.5) ,mat);

mars.position.x=65;
mars.castShadow = true;
earth.castShadow = true;
let mars_base = new THREE.Object3D().add(mars);
scene.add(mars_base);



// 행성 속성
let mercury_param   = { rotate: 0.02,   orbit: 0.02 };
let venus_param     = { rotate: 0.015,  orbit: 0.015 };
let earth_param     = { rotate: 0.01,   orbit: 0.01 };
let mars_param      = { rotate: 0.008,  orbit: 0.008 };


// gui 추가
const gui = new GUI();
// gui에 폴더 추가
const f1 = gui.addFolder("Camera");
const f2 = gui.addFolder("Mercury");
const f3 = gui.addFolder("Venus");
const f4 = gui.addFolder("Earth");
const f5 = gui.addFolder("Mars");
// 폴더에 변수 추가

// mercury
f2.add(mercury_param, 'rotate', -0.2, 0.2, 0.001).name("Rotate Speed")
f2.add(mercury_param, 'orbit' , -0.2, 0.2, 0.001).name("Orbit Speed")
// venus
f3.add(venus_param, 'rotate', -0.2, 0.2, 0.001).name("Rotate Speed")
f3.add(venus_param, 'orbit' , -0.2, 0.2, 0.001).name("Orbit Speed")
// earth
f4.add(earth_param, 'rotate', -0.2, 0.2, 0.001).name("Rotate Speed")
f4.add(earth_param, 'orbit' , -0.2, 0.2, 0.001).name("Orbit Speed")
// mars
f5.add(mars_param, 'rotate', -0.2, 0.2, 0.001).name("Rotate Speed")
f5.add(mars_param, 'orbit' , -0.2, 0.2, 0.001).name("Orbit Speed")


// 카메라 perspec/ortho 변경
const controls = new function () {
    this.perspective = "Perspective";
    this.switchCamera = function () {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = 120;
            camera.position.y = 60;
            camera.position.z = 180;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Perspective";
        }
    };
};
f1.add(controls, 'switchCamera').name("Switch Camera Type");
f1.add(controls, 'perspective').name("Current Camera").listen();

function animate() {

    // stats와 orbitControls는 매 frame마다 update 해줘야 함
    stats.update();
    orbitControls.update();
    
    // rotate
    mercury.rotateY(mercury_param.rotate);
    venus.rotateY(venus_param.rotate);
    earth.rotateY(earth_param.rotate);
    mars.rotateY(mars_param.rotate);

    // orbit
    mercury_base.rotateY(mercury_param.orbit);
    venus_base.rotateY(venus_param.orbit);
    earth_base.rotateY(earth_param.orbit);
    mars_base.rotateY(mars_param.orbit);






    // 모든 transformation 적용 후, renderer에 렌더링을 한번 해 줘야 함
    renderer.render(scene, camera);

    // 다음 frame을 위해 requestAnimationFrame 호출 
    requestAnimationFrame(animate);
}

animate();