/*-------------------------------------------------------------------------
06_FlipTriangle.js

1) Change the color of the triangle by keyboard input
   : 'r' for red, 'g' for green, 'b' for blue
2) Flip the triangle vertically by keyboard input 'f' 
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText } from './util/util.js'; // 그냥 폴더 내에 util 통합함.
import { Shader, readShaderFile } from './util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;   // shader program
let vao;      // vertex array object
let colorTag = "red"; // triangle 초기 color는 red
let verticalFlip = 1.0; // 1.0 for normal, -1.0 for vertical flip
let textOverlay3; // for text output third line (see util.js)


// 이동한 정도를 표시하기 위해 moveX, moveY 설정, 이걸 shVert에 등록해두고, render에서 매 번 업데이트 시켜줌.
let moveX = 0.0;
let moveY = 0.0;

// 속도
const veloc_h = 0.01;
const veloc_v = 0.01;

// edge 확인용..
const boundary_h = 1.0 -0.1;
const boundary_v = 1.0 -0.1;

// 버튼 상태 확인용
let upPressed = false;
let downPressed = false;
let leftPressed = false;
let rightPressed = false;

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 600;
    canvas.height = 600;

    resizeAspectRatio(gl, canvas);

    // Initialize WebGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // background color : Black으로 설정
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key == 'f') {
            //console.log("f key pressed");
            //updateText(textOverlay3, "f key pressed");
            //verticalFlip = -verticalFlip; 
        }
        else if (event.key == 'r') {
            //console.log("r key pressed");
            //updateText(textOverlay3, "r key pressed");
            //colorTag = "red";
        }
        else if (event.key == 'g') {
            //console.log("g key pressed");
            //updateText(textOverlay3, "g key pressed");
            //colorTag = "green";
        }
        else if (event.key == 'b') {
            //console.log("b key pressed");
            //updateText(textOverlay3, "b key pressed");
            //colorTag = "blue";
        }
    });

    // 방향키용 이벤트 리스너 추가.
    document.addEventListener('keydown', (event) => {
        if(event.key == 'ArrowUp'){
            upPressed = true;
        }
        else if(event.key == 'ArrowDown'){
            downPressed = true;
        }
        else if(event.key == 'ArrowLeft'){
            leftPressed = true;
        }
        else if(event.key == 'ArrowRight'){
            rightPressed = true;
        }
    });

    document.addEventListener('keyup', (event) => {
        if(event.key == 'ArrowUp'){
            upPressed = false;
        }
        else if(event.key == 'ArrowDown'){
            downPressed = false;
        }
        else if(event.key == 'ArrowLeft'){
            leftPressed = false;
        }
        else if(event.key == 'ArrowRight'){
            rightPressed = false;
        }
    });

}



function setupBuffers() {
    const vertices = new Float32Array([
        -0.1, -0.1, 0.0,  // Bottom left
         0.1, -0.1, 0.0,  // Bottom right
        -0.1,  0.1, 0.0,  // Top left
         0.1,  0.1, 0.0   // Top right
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let color = [1.0, 0.0, 0.0, 1.0]; // red로 고정.
    /*
    if (colorTag == "red") {
        color = [1.0, 0.0, 0.0, 1.0];
    }
    else if (colorTag == "green") {
        color = [0.0, 1.0, 0.0, 1.0];
    }
    else if (colorTag == "blue") {
        color = [0.0, 0.0, 1.0, 1.0];
    }
        */

    // move
    if(upPressed && !downPressed)
        moveY += veloc_v;
    if(downPressed && !upPressed)
        moveY -= veloc_v

    if(leftPressed && !rightPressed)
        moveX -= veloc_h;
    if(rightPressed && !leftPressed)
        moveX += veloc_h

    // 경계 처리
    if(moveY < -boundary_v)
        moveY = -boundary_v
    else if(moveY > boundary_v)
        moveY = boundary_v

    if(moveX < -boundary_h)
        moveX = -boundary_h
    else if(moveX > boundary_h)
        moveX = boundary_h
    


    shader.setVec4("uColor", color);
    shader.setFloat("verticalFlip", verticalFlip);
    shader.setFloat("moveX", moveX);
    shader.setFloat("moveY", moveY);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(() => render());
}

async function main() {
    try {

        // WebGL 초기화
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        // 셰이더 초기화
        await initShader();

        // setup text overlay (see util.js)

        // setupText(canvas, "r, g, b: change color", 1);
        // setupText(canvas, "f: flip vertically", 2);
        // textOverlay3 = setupText(canvas, "no key pressed", 3);

        setupText(canvas, "Use arrow keys to move the rectangle", 1);

        // 키보드 이벤트 설정
        setupKeyboardEvents();
        
        // 나머지 초기화
        setupBuffers(shader);
        shader.use();
        
        // 렌더링 시작
        render();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

// call main function
main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});
