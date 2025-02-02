// BlockyAnimal.js

// Global variables
var gl, program, canvas;
var gAnimalGlobalRotation = 0;   // Rotation around Y-axis (in degrees)
var gAnimalGlobalRotationX = 0;    // Rotation around X-axis (in degrees)
var gCameraZoom = 12;              // Camera Z position for zoom (default 12)

// Vertex shader uses two uniforms:
// - u_GlobalRotation: a matrix built from the slider values.
// - u_ModelMatrix: the view–projection matrix multiplied by each object's local transform.
const vertexShaderSource = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_GlobalRotation;
    uniform mat4 u_ModelMatrix;
    varying vec4 v_Color;
    void main() {
        // Apply the local transform (u_ModelMatrix) then the global rotation.
        gl_Position = u_ModelMatrix * u_GlobalRotation * a_Position;
        v_Color = a_Color;
    }
`;

// Fragment shader remains unchanged.
const fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;

/**
 * Utility function to compile a shader.
 */
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

/**
 * Utility function to create a shader program.
 */
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

/**
 * renderSkink() clears the canvas, computes the global rotation and view–projection matrices,
 * and then draws two cubes (one larger on the left and one smaller on the right) to form a blocky skink.
 */
function renderSkink() {
    // Clear both the color and depth buffers.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- Compute the global rotation matrix from slider values ---
    var globalRotationX = mat4.create();
    mat4.fromXRotation(globalRotationX, gAnimalGlobalRotationX * Math.PI / 180);
    var globalRotationY = mat4.create();
    mat4.fromYRotation(globalRotationY, gAnimalGlobalRotation * Math.PI / 180);
    var globalRotationMatrix = mat4.create();
    // Apply X rotation first, then Y rotation.
    mat4.multiply(globalRotationMatrix, globalRotationY, globalRotationX);

    // --- Compute the view–projection matrix ---
    var viewMatrix = mat4.create();
    // Position the camera using the zoom variable gCameraZoom.
    mat4.lookAt(viewMatrix, [0, 2, gCameraZoom], [0, 0, 0], [0, 1, 0]);
    var projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    var vpMatrix = mat4.create();
    mat4.multiply(vpMatrix, projectionMatrix, viewMatrix);

    // Set the global rotation uniform.
    var u_GlobalRotation = gl.getUniformLocation(program, "u_GlobalRotation");
    gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotationMatrix);

    // Get location of u_ModelMatrix uniform.
    var u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");

    // Helper function: for a given local transform, combine it with vpMatrix, set uniform, and draw cube.
    function drawCubePiece(localTransform) {
        var finalMatrix = mat4.create();
        mat4.multiply(finalMatrix, vpMatrix, localTransform);
        gl.uniformMatrix4fv(u_ModelMatrix, false, finalMatrix);
        drawCube(gl, program);
    }

    // --- Draw the skink parts ---

    // Body: 3 cubes in a row (centers at x = -1, 0, 1)
    var local = mat4.create();
    mat4.fromTranslation(local, [-1, 0, 0]);
    drawCubePiece(local);
    mat4.fromTranslation(local, [0, 0, 0]);
    drawCubePiece(local);
    mat4.fromTranslation(local, [1, 0, 0]);
    drawCubePiece(local);

    // Head: 1 cube at the front (x = 2)
    mat4.fromTranslation(local, [2, 0, 0]);
    drawCubePiece(local);

    // Tail: 2 cubes at the back (x = -2 and x = -3)
    mat4.fromTranslation(local, [-2, 0, 0]);
    drawCubePiece(local);
    mat4.fromTranslation(local, [-3, 0, 0]);
    drawCubePiece(local);

    // Legs: 4 small cubes (scaled 0.5) attached to the underside of the middle body cube.
    var leg = mat4.create();
    // Front left leg: (0.5, -0.75, 0.5)
    mat4.fromTranslation(leg, [0.5, -0.75, 0.5]);
    mat4.scale(leg, leg, [0.5, 0.5, 0.5]);
    drawCubePiece(leg);
    // Front right leg: (0.5, -0.75, -0.5)
    mat4.fromTranslation(leg, [0.5, -0.75, -0.5]);
    mat4.scale(leg, leg, [0.5, 0.5, 0.5]);
    drawCubePiece(leg);
    // Back left leg: (-0.5, -0.75, 0.5)
    mat4.fromTranslation(leg, [-0.5, -0.75, 0.5]);
    mat4.scale(leg, leg, [0.5, 0.5, 0.5]);
    drawCubePiece(leg);
    // Back right leg: (-0.5, -0.75, -0.5)
    mat4.fromTranslation(leg, [-0.5, -0.75, -0.5]);
    mat4.scale(leg, leg, [0.5, 0.5, 0.5]);
    drawCubePiece(leg);
}

/**
 * main() sets up WebGL, compiles shaders, creates the program, registers slider events
 * for global rotation and zoom, and draws the initial skink scene by calling renderSkink().
 */
function main() {
    canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("Failed to get WebGL context.");
        return;
    }

    // Set clear color and enable depth testing.
    gl.clearColor(0.2, 0.2, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Create the shader program.
    program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
        console.error("Failed to create shader program.");
        return;
    }
    gl.useProgram(program);

    // Register the slider for Y-axis rotation.
    var sliderY = document.getElementById("rotationSliderY");
    sliderY.addEventListener("input", function () {
        gAnimalGlobalRotation = Number(this.value);
        renderSkink();
    });

    // Register the slider for X-axis rotation.
    var sliderX = document.getElementById("rotationSliderX");
    sliderX.addEventListener("input", function () {
        gAnimalGlobalRotationX = Number(this.value);
        renderSkink();
    });

    // Register the slider for camera zoom.
    var zoomSlider = document.getElementById("zoomSlider");
    zoomSlider.addEventListener("input", function () {
        gCameraZoom = Number(this.value);
        renderSkink();
    });

    // Draw the initial skink.
    renderSkink();
}

window.onload = main;