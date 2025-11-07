// 03-geometries.js
// - DirectionalLightHelper
// - CameraHelper for shadow range
// - ConvexGeometry, LatheGeometry, OctahedronGeometry, ParametricGeometry
// - TetrahedronGeometry, TorusGeometry
// - MeshStandardMaterial, MeshBasicMaterial
// - MultiMaterialObject

import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ParametricGeometries } from 'three/addons/geometries/ParametricGeometries.js';
import * as SceneUtils from 'three/addons/utils/SceneUtils.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = -50;
camera.position.y = 30;
camera.position.z = 20;
camera.lookAt(new THREE.Vector3(-10, 0, 0));
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x000000));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

// ground plane
const planeGeometry = new THREE.PlaneGeometry(60, 40, 1, 1);
const planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;
plane.rotation.x = -0.5 * Math.PI;
plane.position.x = 0;
plane.position.y = 0;
plane.position.z = 0;
scene.add(plane);

// add subtle ambient lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(-10, 40, 50);
directionalLight.castShadow = true;

// shadow 설정 추가
directionalLight.shadow.camera.left = -30;  // 그림자 생성 구간 설정
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.camera.near = 30;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.mapSize.width = 2048;  // 그림자 해상도 증가
directionalLight.shadow.mapSize.height = 2048;  // 그림자 해상도 증가
scene.add(directionalLight);

// DirectionalLightHelper: size: light의 크기 (default = 1) 
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 3);
scene.add(directionalLightHelper);

// Shadow 범위 확인을 위한 CameraHelper
const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
cameraHelper.visible = true;
scene.add(cameraHelper);

// 보조 directional light 추가
const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight2.position.set(5, 0, 50);
scene.add(dirLight2);

// add geometries
addGeometries(scene);

// call the render function
let step = 0;

function addGeometries(scene) {
    const geoms = [];

    geoms.push(new THREE.CylinderGeometry(1, 4, 4)); // radius-top, radius-bottom, height

    // basic cube
    geoms.push(new THREE.BoxGeometry(4, 4, 4)); // width, height, depth

    // basic sphere
    geoms.push(new THREE.SphereGeometry(3)); // radius

    geoms.push(new THREE.IcosahedronGeometry(3, 0)); // 정12면체: radius, detail (0, 1, 2, ...) 

    // create a convex shape (a shape without dents)
    // using a couple of points
    // for instance a cube shape
    const points = [ // 8 vertices
        new THREE.Vector3(2, 2, 2),
        new THREE.Vector3(2, 2, -2),
        new THREE.Vector3(-2, 2, -2),
        new THREE.Vector3(-2, 2, 2),
        new THREE.Vector3(2, -2, 2),
        new THREE.Vector3(2, -2, -2),
        new THREE.Vector3(-2, -2, -2),
        new THREE.Vector3(-2, -2, 2)
    ];
    geoms.push(new ConvexGeometry(points));

    // create a lathe (레이드) geometry
    // 1) Profile point array 생성
    //    Vector2 (2D) array로 profile curve를 정의
    //    x 좌표: curve의 반지름, y 좌표: curve의 높이
    const lathePoints = [];
    for (let i = 0; i < 10; i++) {
      const x = Math.sin(i * 0.2) * 2 + 2; // radius: 2 ~ 4 구간에서 변화
      const y = (i - 5) * 0.5;             // height: -5 ~ 0 구간에서 변화 
      lathePoints.push(new THREE.Vector2(x, y));
    }
    // 2) LatheGeometry 생성 (회전각: 0 ~ 2π, 분할수: 12)
    const latheGeometry = new THREE.LatheGeometry(lathePoints, 12, 0, Math.PI * 2);
    geoms.push(latheGeometry);

    // create a OctahedronGeometry
    geoms.push(new THREE.OctahedronGeometry(4, 0)); // 정팔면체: radius, detail (0, 1, 2, ...)

    // create a geometry based on a function
    // parameters: function, slices, stacks
    const klein = new ParametricGeometry(ParametricGeometries.klein, 20, 10);
    klein.name = "klein";
    geoms.push(klein); 

    geoms.push(new THREE.TetrahedronGeometry(4, 0)); // 정4면체: radius, detail (0, 1, 2, ...)

    geoms.push(new THREE.TorusGeometry(3, 1, 10, 30)); // Torus: radius, tube, radialSegments, tubularSegments

    geoms.push(new THREE.TorusKnotGeometry(3, 0.5, 50, 20));

    let j = 0;
    for (let i = 0; i < geoms.length; i++) {
        const cubeMaterial = new THREE.MeshStandardMaterial({
            wireframe: true,
            color: Math.random() * 0xffffff
        });

        const materials = [

            new THREE.MeshLambertMaterial({
                color: Math.random() * 0xffffff
            }),
            new THREE.MeshBasicMaterial({  // 조명의 영향 받지 않음 (빠른 rendering, UI용)
                color: 0x333333,
                wireframe: true
            })

        ];

        const mesh = SceneUtils.createMultiMaterialObject(geoms[i], materials);
        if (geoms[i].name === "klein") {
            mesh.scale.set(0.7, 0.7, 0.7);
        }   
        mesh.traverse(function (e) {
            e.castShadow = true
        });

        //const mesh = new THREE.Mesh(geoms[i],materials[i]);
        mesh.castShadow=true;
        mesh.position.x = -24 + ((i % 4) * 12);
        mesh.position.y = 4;
        mesh.position.z = -8 + (j * 12);

        if ((i + 1) % 4 == 0) j++;
        scene.add(mesh);
    }

}

render();

function render() {
    orbitControls.update();
    stats.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}