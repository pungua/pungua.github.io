/*-------------------------------------------------------------------------
08_Transformation.js

canvas의 중심에 한 edge의 길이가 0.3인 정사각형을 그리고, 
이를 크기 변환 (scaling), 회전 (rotation), 이동 (translation) 하는 예제임.
    T는 x, y 방향 모두 +0.5 만큼 translation
    R은 원점을 중심으로 2초당 1회전의 속도로 rotate
    S는 x, y 방향 모두 0.3배로 scale
이라 할 때, 
    keyboard 1은 TRS 순서로 적용
    keyboard 2는 TSR 순서로 적용
    keyboard 3은 RTS 순서로 적용
    keyboard 4는 RST 순서로 적용
    keyboard 5는 STR 순서로 적용
    keyboard 6은 SRT 순서로 적용
    keyboard 7은 원래 위치로 돌아옴
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from './util/util.js';
import { Shader, readShaderFile } from './util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
 /** @type {WebGLRenderingContext} */  // gl 알림.
const gl = canvas.getContext('webgl2');
let shader;
let vao1; // vao 분리
let vao2;
let vao3;
let vao4;

let axes;
let finalTransform1;
let finalTransform2;
let finalTransform3;
let finalTransform4;

let rotationAngle = 0;
let rotationAngle_small = 0; // 작은 날개 각도
let currentTransformType = null;
let isAnimating = false;
let lastTime = 0;
let textOverlay; 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

// 중앙 갈색 기둥
const cubeVertices1 = new Float32Array([
    -0.10,  0.50,  // 좌상단
    -0.10, -0.50,  // 좌하단
     0.10, -0.50,  // 우하단
     0.10,  0.50   // 우상단
]);

const cubeColors1 = new Float32Array([
    0.5, 0.3, 0.0, 1.0,  // 갈색
    0.5, 0.3, 0.0, 1.0,
    0.5, 0.3, 0.0, 1.0,
    0.5, 0.3, 0.0, 1.0
]);

// 날개 1
const cubeVertices2 = new Float32Array([
    -0.30,  0.05,  // 좌상단
    -0.30, -0.05,  // 좌하단
     0.30, -0.05,  // 우하단
     0.30,  0.05   // 우상단
]);

const cubeColors2 = new Float32Array([
    1.0, 1.0, 1.0, 1.0,  // 흰색
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0
]);

// 날개 2, 3은 일단 동일
const cubeVertices3 = new Float32Array([
    -0.10,  0.025,  // 좌상단
    -0.10, -0.025,  // 좌하단
     0.10, -0.025,  // 우하단
     0.10,  0.025   // 우상단
]);

const cubeColors3 = new Float32Array([
    0.5, 0.5, 0.5, 1.0,  // 회색
    0.5, 0.5, 0.5, 1.0,
    0.5, 0.5, 0.5, 1.0,
    0.5, 0.5, 0.5, 1.0
]);


// Cube를 그리기 위해 특정 vao에 Vert, color를 세팅하는 함수로 바꿈.
function setupBuffers(cubeVertices,cubeColors) {
    
    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao
}

function setupKeyboardEvents() {
    let key;
    document.addEventListener('keydown', (event) => {
        key = event.key;
        switch(key) {
            case '1': currentTransformType = 'TRS'; isAnimating = true; break;
            case '2': currentTransformType = 'TSR'; isAnimating = true; break;
            case '3': currentTransformType = 'RTS'; isAnimating = true; break;
            case '4': currentTransformType = 'RST'; isAnimating = true; break;
            case '5': currentTransformType = 'STR'; isAnimating = true; break;
            case '6': currentTransformType = 'SRT'; isAnimating = true; break;
            case '7':
                currentTransformType = null;
                isAnimating = false;
                rotationAngle = 0;
                //finalTransform = mat4.create();
                break;
        }
        if (currentTransformType) {
            updateText(textOverlay, event.key + ': ' + currentTransformType);
        } else {
            updateText(textOverlay, 'NO TRANSFORMA1TION');
        }
    });
}

// 예시..
//let TRS_set1 = [0.5, 0.5, rotationAngle, 0.3, 0.3];

// T, R, S setting 인자를 입력하면 TRS matrix를 한번에 리턴해주는 함수로 바꿈
function getTransformMatrices(TRS_set) {

    const Tx    = TRS_set[0];
    const Ty    = TRS_set[1];
    const Angle = TRS_set[2];
    const Sx    = TRS_set[3];
    const Sy    = TRS_set[4];

    const T = mat4.create();
    const R = mat4.create();
    const S = mat4.create();
    
    mat4.translate(T, T, [Tx, Ty, 0]);  // translation by (0.5, 0.5)
    mat4.rotate(R, R, Angle, [0, 0, 1]); // rotation about z-axis
    mat4.scale(S, S, [Sx, Sy, 1]); // scale by (0.3, 0.3)
    
    return { T, R, S };
}


// TRS를 순서대로 적용하는 Transfromation Matrix 구하는 함수
function getTransform(type, TRS_set) {
    let Transform = mat4.create();
    const { T, R, S } = getTransformMatrices(TRS_set);
    
    const transformOrder = {
        'TRS': [T, R, S],
        'TSR': [T, S, R],
        'RTS': [R, T, S],
        'RST': [R, S, T],
        'STR': [S, T, R],
        'SRT': [S, R, T]
    };

    /*
      type은 'TRS', 'TSR', 'RTS', 'RST', 'STR', 'SRT' 중 하나
      array.forEach(...) : 각 type의 element T or R or S 에 대해 반복
    */
    if (transformOrder[type]) {
        transformOrder[type].forEach(matrix => {
            mat4.multiply(Transform, matrix, Transform); // finalTrans x matrix -> finalTrans
        });
    }

    return Transform;
}

// 두 Transform을 합치는 함수
function mergeTransform(Transform1, Transform2){
    mat4.multiply(Transform1, Transform2, Transform1)
    return Transform1;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw axes
    //axes.draw(mat4.create(), mat4.create()); 

    // draw cube
    shader.use();

    shader.setMat4("u_transform", finalTransform1);
    gl.bindVertexArray(vao1); // 기둥 그리기
    // gl.drawElements(mode, index_count, type, byte_offset);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_transform", finalTransform2); // 날개 1의 Transform 적용
    gl.bindVertexArray(vao2); // 날개 1 그리기
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_transform", finalTransform3);
    gl.bindVertexArray(vao3); // 날개 2 그리기
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_transform", finalTransform4); //
    gl.bindVertexArray(vao4); // 날개 3 그리기
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

// start time - elapsed Time 추가
let startTime = 0;
function animate(currentTime) {

    if (!startTime) startTime = currentTime;
    if (!lastTime) lastTime = currentTime; // if lastTime == 0
    // deltaTime: 이전 frame에서부터의 elapsed time (in seconds)
    const deltaTime = (currentTime - lastTime) / 1000;
    const elapsedTime = (currentTime - startTime) / 1000;
    lastTime = currentTime;

    if (isAnimating) {
        // 2초당 1회전, 즉, 1초당 180도 회전
        //rotationAngle += Math.PI * deltaTime;
        //console.log(Math.sin(deltaTime));

        let rotation = Math.sin(elapsedTime)*Math.PI; // sin 계산값
        rotationAngle = rotation*(2.0);
        rotationAngle_small = rotation*(-10.0);// - rotationAngle; // small rotation에 한번 더 적용될 rotation 상쇄

        // 날개 3개의 움직임 표현
        // let TRS_set2 = [0.0, 0.5, rotationAngle, 1.0, 1.0]; // ex) : y방향으로 0.5, scale 변화 없음

        // 날개 1       : Rotation -> Translation
        // 날개 2, 3    : Rotation -> Translation -> [날개 1의 Rotation -> Translation] 
        //finalTransform1 = applyTransform(currentTransformType, TRS_set1);

        finalTransform2 = getTransform('RTS', [0.0, 0.5, rotationAngle, 1.0, 1.0]); // Rotation -> Translation

         // small rotation + Big rotation으로 해석한 경우.. (small is local rotation)
        finalTransform3 = getTransform('RTS', [0.3, 0.0, rotationAngle_small, 1.0, 1.0]); // 날개 2 : 날개 1 내부에서의 local 움직임
        finalTransform3 = mergeTransform(finalTransform3, finalTransform2) // 날개 2에 날개 1 움직임 합산

        finalTransform4 = getTransform('RTS', [-0.3, 0.0, rotationAngle_small, 1.0, 1.0]); // 날개 3:날개 1 내부에서의 local 움직임
        finalTransform4 = mergeTransform(finalTransform4, finalTransform2) // 날개 3에 날개 1 움직임 합산
        

    }
    render();

    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        finalTransform1 = mat4.create();
        finalTransform2 = mat4.create();
        finalTransform3 = mat4.create();
        finalTransform4 = mat4.create();
        
        await initShader();

        vao1 = setupBuffers(cubeVertices1, cubeColors1); // 기둥
        vao2 = setupBuffers(cubeVertices2, cubeColors2); // 날개1
        vao3 = setupBuffers(cubeVertices3, cubeColors3); // 날개2
        vao4 = setupBuffers(cubeVertices3, cubeColors3); // 날개3
        axes = new Axes(gl, 0.8); 

        //textOverlay = setupText(canvas, 'NO TRANSFORMATION', 1);
        //setupText(canvas, 'press 1~7 to apply different order of transformations', 2);

        //setupKeyboardEvents();

        // 텍스트, 키보드 입력 전부 비활성화, 그냥 animation True 세팅
        isAnimating = true;

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
