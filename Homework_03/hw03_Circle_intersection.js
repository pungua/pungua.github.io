/*-------------------------------------------------------------------------
07_LineSegments.js

left mouse button을 click하면 선분을 그리기 시작하고, 
button up을 하지 않은 상태로 마우스를 움직이면 임시 선분을 그리고, 
button up을 하면 최종 선분을 저장하고 임시 선분을 삭제함.

임시 선분의 color는 회색이고, 최종 선분의 color는 빨간색임.

이 과정을 반복하여 여러 개의 선분 (line segment)을 그릴 수 있음. 
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from './util/util.js';
import { Shader, readShaderFile } from './util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
 /** @type {WebGLRenderingContext} */  // gl 알림.
const gl = canvas.getContext('webgl2');

let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null;  // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치

let lines = []; // 그려진 선분들을 저장하는 array
let textOverlay; // 원 정보 표시
let textOverlay2; // 2nd line segment 정보 표시
let textOverlay3; // intersection 정보 표시

let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

// 원 정보도 Line 정보와 동일하다. but, 그걸 한번 더 계산해서 원을 만들기.
let circle_r = 0.0;
let intersection = []; // intersection 정보 저장

// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임
// mouse input을 사용할 때 이와 같이 main을 call 한다. 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
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
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

// 1. 원의 중심을 클릭 ~ 드래그하여 R 결정
// 2. 선분 그리기

// 선분의 길이 구하기
function getDistance(p1, p2)
{
    let vTemp = [p2[0]-p1[0], p2[1]-p1[1]];
    return Math.sqrt(vTemp[0]*vTemp[0] + vTemp[1]*vTemp[1]);
}

// 원과 선분의 intersection 목록 구하기 intersection : (x1,y1,x2,y2...)
function getIntersectionsCircleLine(c1, radius, p1, p2)
{
    // 원의 방정식에 p1, p2의 매개변수식을 대입 -> At2 + Bt + C = 0 꼴
    
    // line parameter -> x = at+b, y = ct+d
    let a = p2[0]-p1[0];
    let b = p1[0];
    let c = p2[1]-p1[1];
    let d = p1[1];
    let r = radius;

    let e = c1[0];
    let f = c1[1];

    let A = (a*a + c*c);
    let B = 2*(a*(b-e) + c*(d-f));
    let C = b*b + d*d + e*e + f*f - r*r - 2*(b*e + d*f);
    
    let Discrement = B*B -4*A*C;

    let points = [];

    if(Math.abs(Discrement) <= 0.000001 ) // 정밀도 고려. 이 경우 D==0 으로 판단
    {
        let t = (-B)/(2*A); // 중근
        
        // t 범위 체크 : 0~1 사이인지.
        if( 0<=t && t<=1)
            points.push([a*t+b, c*t+d]);
    }
    else if(Discrement > 0)
    {
        let t1 = (-B+Math.sqrt(Discrement))/(2*A);
        let t2 = (-B-Math.sqrt(Discrement))/(2*A); 

        //console.log(t1, t2);
        if( 0<=t1 && t1<=1)
            points.push([a*t1+b, c*t1+d]);
        if( 0<=t2 && t2<=1)
            points.push([a*t2+b, c*t2+d]);
    }
    //else : 그냥 근이 없음

    return points;
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표

        // 원 또는 선분의 첫 점을 "클릭" 한 순간 : 그 점을 startPoint로 세팅.
        if (!isDrawing && lines.length < 2) { 
            // 1번 또는 2번 선분을 그리고 있는 도중이 아닌 경우 (즉, mouse down 상태가 아닌 경우)
            // 캔버스 좌표를 WebGL 좌표로 변환하여 선분의 시작점을 설정
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
        }
    }

    
    function handleMouseMove(event) {
        // 클릭한 채로 움직이는 중
        if (isDrawing) { // 1번 또는 2번 선분을 그리고 있는 도중인 경우
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY]; // 임시 선분의 끝 point

            // 원인 경우, circle_r 값을 계산해둔다.
            if(lines.length == 0)
            {
                // startPoint가 중심, tempendPoint가 끝
                circle_r = getDistance(tempEndPoint, startPoint);
            }
            render();
        }
    }



    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {

            // lines.push([...startPoint, ...tempEndPoint])
            //   : startPoint와 tempEndPoint를 펼쳐서 하나의 array로 합친 후 lines에 추가
            // ex) lines = [] 이고 startPoint = [1, 2], tempEndPoint = [3, 4] 이면,
            //     lines = [[1, 2, 3, 4]] 이 됨
            // ex) lines = [[1, 2, 3, 4]] 이고 startPoint = [5, 6], tempEndPoint = [7, 8] 이면,
            //     lines = [[1, 2, 3, 4], [5, 6, 7, 8]] 이 됨

            lines.push([...startPoint, ...tempEndPoint]); 

            if (lines.length == 1) { // 원일 때
                updateText(textOverlay, "Circle: center (" + lines[0][0].toFixed(2) + ", " + lines[0][1].toFixed(2) +") radius = "+ circle_r.toFixed(2) );
            }
            else { // 선일 때 -> intersection 여기서 구함.
                updateText(textOverlay2, "Line segment: (" + lines[1][0].toFixed(2) + ", " + lines[1][1].toFixed(2) + ") ~ (" + lines[1][2].toFixed(2) + ", " + lines[1][3].toFixed(2) + ")" );

                // intersection 구하기.. : Det 식 D값
                // lines -> line의, 뒷 점에서, 앞 점을 뺀다
                let line_p1 = [lines[1][0], lines[1][1]];
                let line_p2 = [lines[1][2], lines[1][3]];

                let circle_p1 = [lines[0][0], lines[0][1]];
                intersection = getIntersectionsCircleLine(circle_p1, circle_r, line_p1, line_p2);

                //console.log(intersection.length);

                if(intersection.length == 0)
                    updateText(textOverlay3, "No Intersection");
                else if(intersection.length == 1)
                    updateText(textOverlay3, "Intersection Points: "+ intersection.length   +" Point 1: ("+ intersection[0][0].toFixed(2) +", "+ intersection[0][1].toFixed(2) +")");
                else if(intersection.length == 2)
                    updateText(textOverlay3, "Intersection Points: "+ intersection.length   +" Point 1: ("+ intersection[0][0].toFixed(2) +", "+ intersection[0][1].toFixed(2) +")"
                                                                                            +" Point 2: ("+ intersection[1][0].toFixed(2) +", "+ intersection[1][1].toFixed(2) +")" );
            }

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

// 중심, 반지름을 입력받아 원 vertic들을 생성하는 함수
function generateCircleVerticies(p1, radius) 
{
    let angle =0;
    let circleVerticies = [];

    // Math 삼각함수는 라디안 기반
    for(angle=0; angle<2*Math.PI; angle+=Math.PI/360) // 2PI 까지
    {
        let vert_temp = [p1[0] + radius*Math.cos(angle), p1[1] + radius*Math.sin(angle)];
        circleVerticies.push(...vert_temp);
    }

    return circleVerticies;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();
    
    // 저장된 원 + 선 그리기
    let num = 0;
    for (let line of lines) {
        if (num == 0) 
        { // 첫 번째 lines : 인 경우, 원
            
            shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]); // Purple

            let circle_verticies = generateCircleVerticies([line[0],line[1]], circle_r);
            //console.log(circle_verticies);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circle_verticies), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, circle_verticies.length/2 );
        }
        else if(num == 1)
        { // num == 1 (2번째 선분인 경우), 
            shader.setVec4("u_color", [0.5, 0.5, 1.0, 1.0]); // 하늘색??

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }

        num++;
    }

    // 임시 선 그리기
    if (isDrawing && startPoint && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색

        if(lines.length == 0) // 아직 저장된 line 없음 : 임시 원 그리는 중
        {
            let circle_verticies = generateCircleVerticies(startPoint, getDistance(startPoint, tempEndPoint));
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circle_verticies), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, circle_verticies.length/2 );
        }
        else // 저장된 line 1개 있음 : 임시 선분 그리는 중
        {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }

    }

    

    // Intersection point 있는 만큼 그리기
    //console.log(intersection)

    shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // 점의 color는 노란색
    //console.log(intersection);
    for(let point of intersection)
    {
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, 1);
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
    
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
            return false; 
        }

        // 셰이더 초기화
        await initShader();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
