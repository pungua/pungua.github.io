// 02-foggy-cubes.js
// - Fog, SpotLight
// - GUI folders, GUI buttons, GUI output
// - Children of the scene

import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


const scene = new THREE.Scene();
// 안개 (fog) 효과 추가
scene.fog = new THREE.Fog(0xaaaaaa, 30, 100); // fog color, near, far

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-40, 20, 40);
camera.lookAt(scene.position); // scene의 position default (0,0,0)
scene.add(camera);

const stats = new Stats();
document.body.appendChild(stats.dom);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

// listen to the resize events
window.addEventListener('resize', onResize, false);
function onResize() { // resize handler
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

// create the ground plane
// PlaneGeometry: width, height, widthSegments, heightSegments
const planeGeometry = new THREE.PlaneGeometry(60, 40, 1, 1);
const planeMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;
plane.rotation.x = -0.5 * Math.PI;
plane.position.set(0, 0, 0);
scene.add(plane);

// add ambient lighting
// AmbientLight: color, intensity
const ambientLight = new THREE.AmbientLight(0x222222, 0.8);
scene.add(ambientLight);

// SpotLight: color, intensity, 
// distance (max range of light, attenuation의 범위)
// angle (radian)
// penumbra (angle중에 soft edge의 비율 (%))
// decay: 감쇠 type, 1 (linear), 2 (quadratic, 자연광), 3 (cubic)
const spotLight = new THREE.SpotLight(0xffffff, 5, 100);
spotLight.position.set(-10, 60, 0);
spotLight.castShadow = true;
spotLight.angle = Math.PI / 8;
spotLight.penumbra = 0;
spotLight.decay = 0.5; 
scene.add(spotLight);

// add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(-10, 10, 20);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

// GUI
const gui = new GUI();
const folder1 = gui.addFolder('Render Parameters');
const folder1Params = {
    rotationSpeed: 0.02
};
folder1.add(folder1Params, 'rotationSpeed', 0, 0.5);
const folder2 = gui.addFolder('Cube Parameters');
const folder2Params = {
    addCube: function() { // addCube button press action
        const cubeSize = Math.ceil((Math.random() * 3)); // 1, 2, 3 중 하나
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        // Math.floor: integer로 만들어 주어야 함
        const randomColor = Math.floor(Math.random() * 0xffffff); 
        const cubeMaterial = new THREE.MeshPhongMaterial({
            color: randomColor,
            shininess: 30
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.castShadow = true;
    
        // position the cube randomly in the scene
        // planeGeometry: width = 60, height = 40 으로 생성되어 있음
        // planeGeometry.parameters.width: 이미 생성된 geometry의 attribute를 access
        cube.position.x = -30 + Math.round((Math.random() * planeGeometry.parameters.width));
        cube.position.y = Math.round((Math.random() * 5));
        cube.position.z = -20 + Math.round((Math.random() * planeGeometry.parameters.height));
    
        // add the cube to the scene
        scene.add(cube);
        folder2Params.numberOfObjects = scene.children.length; // scene에 add된 cube의 개수
        // GUI 컨트롤러 업데이트
        numObjects.updateDisplay();
    },
    removeCube: function() { // removeCube button press action
        const allChildren = scene.children;
        const lastObject = allChildren[allChildren.length - 1];
        if (lastObject instanceof THREE.Mesh) {
            scene.remove(lastObject);
            folder2Params.numberOfObjects = scene.children.length;
            // GUI 컨트롤러 업데이트

            numObjects.updateDisplay();
        }
    },
    outputObjects: function() { // outputObjects button press action
        console.log(scene.children);
    },
    // 시작할 때 scene.children.length는 4 (plane, ambientLight, spotLight, directionalLight)
    numberOfObjects: scene.children.length  // 아래의 numberOfObjects의 개수를 update해 줌
};

folder2.add(folder2Params, 'addCube');
folder2.add(folder2Params, 'removeCube');
folder2.add(folder2Params, 'outputObjects');
const numObjects = folder2.add(folder2Params, 'numberOfObjects');

function render() {
    stats.update();
    orbitControls.update();

    // rotate the cubes around its axes
    scene.traverse(function (e) {
        if (e instanceof THREE.Mesh && e != plane) {
            e.rotation.x += folder1Params.rotationSpeed;
            e.rotation.y += folder1Params.rotationSpeed;
            e.rotation.z += folder1Params.rotationSpeed;
        }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

render();






