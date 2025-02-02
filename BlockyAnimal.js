// BlockyAnimal.js

// Global variables for object rotation, camera controls, leg joints, tail joints, and head shake.
var gl, program, canvas;
var gAnimalGlobalRotation = 0;    // Object Y rotation (degrees)
var gAnimalGlobalRotationX = 0;   // Object X rotation (degrees)
var gCameraZoom = 12;             // Camera distance
var gCameraAzimuth = 0;           // Camera azimuth (degrees)
var gCameraElevation = 0;         // Camera elevation (degrees)

// Leg joint angles (degrees)
var gFrontLeftLegJointAngle  = 0;
var gFrontRightLegJointAngle = 0;
var gBackLeftLegJointAngle   = 0;
var gBackRightLegJointAngle  = 0;

// Tail joint angles (degrees)
var gTailJointAngle1 = 0;
var gTailJointAngle2 = 0;
var gTailJointAngle3 = 0;

// Head shake angle (degrees)
var gHeadShakeAngle = 0;

// Run animation control.
var runAnimationOn = false;

// Animation constants.
var tailWagFrequency = 2;          // cycles per second for tail wag
var tailWagAmplitude1 = 30;        // degrees for tail joint 1
var tailWagAmplitude2 = 20;        // degrees for tail joint 2
var tailWagAmplitude3 = 10;        // degrees for tail joint 3
var tailWagPhase2 = Math.PI / 4;   // phase offset for tail joint 2
var tailWagPhase3 = Math.PI / 2;   // phase offset for tail joint 3

var legFrequency = 2;              // cycles per second for leg swing
var legAmplitude = 20;             // degrees for leg swing
// Set alternating phases for diagonal leg movement.
var frontLeftLegPhase = 0;
var frontRightLegPhase = Math.PI;
var backLeftLegPhase = Math.PI;
var backRightLegPhase = 0;

var headShakeFrequency = 2;        // cycles per second for head shake
var headShakeAmplitude = 10;       // degrees for head shake

const vertexShaderSource = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_GlobalRotation;
    uniform mat4 u_ModelMatrix;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_ModelMatrix * u_GlobalRotation * a_Position;
        v_Color = a_Color;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vShaderSource, fShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error: " + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

function tick() {
    if (runAnimationOn) {
        var t = performance.now() / 1000;
        // Update tail joints.
        gTailJointAngle1 = tailWagAmplitude1 * Math.sin(2 * Math.PI * tailWagFrequency * t);
        gTailJointAngle2 = tailWagAmplitude2 * Math.sin(2 * Math.PI * tailWagFrequency * t + tailWagPhase2);
        gTailJointAngle3 = tailWagAmplitude3 * Math.sin(2 * Math.PI * tailWagFrequency * t + tailWagPhase3);
        // Update leg joints (alternating).
        gFrontLeftLegJointAngle = legAmplitude * Math.sin(2 * Math.PI * legFrequency * t + frontLeftLegPhase);
        gFrontRightLegJointAngle = legAmplitude * Math.sin(2 * Math.PI * legFrequency * t + frontRightLegPhase);
        gBackLeftLegJointAngle = legAmplitude * Math.sin(2 * Math.PI * legFrequency * t + backLeftLegPhase);
        gBackRightLegJointAngle = legAmplitude * Math.sin(2 * Math.PI * legFrequency * t + backRightLegPhase);
        // Update head shake.
        gHeadShakeAngle = headShakeAmplitude * Math.sin(2 * Math.PI * headShakeFrequency * t);
        renderSkink();
    }
    requestAnimationFrame(tick);
}

function main() {
    canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("Failed to get WebGL context.");
        return;
    }
    gl.clearColor(0.2, 0.2, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
        console.error("Failed to create shader program.");
        return;
    }
    gl.useProgram(program);

    // Register slider events.
    document.getElementById("rotationSliderY").addEventListener("input", function () {
        gAnimalGlobalRotation = Number(this.value);
        renderSkink();
    });
    document.getElementById("rotationSliderX").addEventListener("input", function () {
        gAnimalGlobalRotationX = Number(this.value);
        renderSkink();
    });
    document.getElementById("zoomSlider").addEventListener("input", function () {
        gCameraZoom = Number(this.value);
        renderSkink();
    });
    document.getElementById("cameraAzimuthSlider").addEventListener("input", function () {
        gCameraAzimuth = Number(this.value);
        renderSkink();
    });
    document.getElementById("cameraElevationSlider").addEventListener("input", function () {
        gCameraElevation = Number(this.value);
        renderSkink();
    });
    // Leg joint sliders (manual control).
    document.getElementById("frontLeftLegSlider").addEventListener("input", function () {
        gFrontLeftLegJointAngle = Number(this.value);
        renderSkink();
    });
    document.getElementById("frontRightLegSlider").addEventListener("input", function () {
        gFrontRightLegJointAngle = Number(this.value);
        renderSkink();
    });
    document.getElementById("backLeftLegSlider").addEventListener("input", function () {
        gBackLeftLegJointAngle = Number(this.value);
        renderSkink();
    });
    document.getElementById("backRightLegSlider").addEventListener("input", function () {
        gBackRightLegJointAngle = Number(this.value);
        renderSkink();
    });
    // Tail joint sliders (manual control).
    document.getElementById("tailJointSlider1").addEventListener("input", function () {
        gTailJointAngle1 = Number(this.value);
        renderSkink();
    });
    document.getElementById("tailJointSlider2").addEventListener("input", function () {
        gTailJointAngle2 = Number(this.value);
        renderSkink();
    });
    document.getElementById("tailJointSlider3").addEventListener("input", function () {
        gTailJointAngle3 = Number(this.value);
        renderSkink();
    });

    // Button to toggle running animation.
    document.getElementById("tailWagButton").addEventListener("click", function () {
        runAnimationOn = !runAnimationOn;
        this.textContent = runAnimationOn ? "Stop Running Animation" : "Start Running Animation";
    });

    renderSkink();
    tick();
}

window.onload = main;