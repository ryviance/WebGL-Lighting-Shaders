// BlockyAnimal.js

// Global variables for the animal's rotation angles (set by sliders).
var gAnimalGlobalRotation = 0;   // Rotation around Y-axis (in degrees)
var gAnimalGlobalRotationX = 0;  // Rotation around X-axis (in degrees)

// Vertex shader now uses two uniforms:
// - u_GlobalRotation: the global rotation matrix (applied in object space)
// - u_ModelMatrix: the view–projection matrix (applied after the global rotation)
const vertexShaderSource = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_GlobalRotation;
    uniform mat4 u_ModelMatrix;
    varying vec4 v_Color;
    void main() {
        // First apply the global rotation, then the view-projection transformation.
        gl_Position = u_ModelMatrix * u_GlobalRotation * a_Position;
        v_Color = a_Color;
    }
`;

// Fragment shader remains the same.
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
 * Main function: Sets up WebGL, registers the sliders to update global rotations,
 * computes the view–projection matrix and the combined global rotation matrix,
 * sets the shader uniforms, and calls drawCube() (from Cube.js) in the render loop.
 */
function main() {
    const canvas = document.getElementById("webgl");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("Failed to get WebGL context.");
        return;
    }

    // Set clear color and enable depth testing.
    gl.clearColor(0.2, 0.2, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Create the shader program.
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
        console.error("Failed to create shader program.");
        return;
    }
    gl.useProgram(program);

    // Set up the slider that controls the Y-axis global rotation.
    const sliderY = document.getElementById("rotationSliderY");
    sliderY.addEventListener("input", function () {
        gAnimalGlobalRotation = Number(this.value);
    });

    // Set up the slider that controls the X-axis global rotation.
    const sliderX = document.getElementById("rotationSliderX");
    sliderX.addEventListener("input", function () {
        gAnimalGlobalRotationX = Number(this.value);
    });

    function render() {
        // Clear both color and depth buffers.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Compute the global rotation matrices.
        const globalRotationX = mat4.create();
        mat4.fromXRotation(globalRotationX, gAnimalGlobalRotationX * Math.PI / 180);
        const globalRotationY = mat4.create();
        mat4.fromYRotation(globalRotationY, gAnimalGlobalRotation * Math.PI / 180);

        // Combine the rotations (order: apply X rotation first, then Y rotation).
        const globalRotationMatrix = mat4.create();
        mat4.multiply(globalRotationMatrix, globalRotationY, globalRotationX);

        // Compute the view and projection matrices to form the view–projection matrix.
        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, [0, 0, 3], [0, 0, 0], [0, 1, 0]);
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
        const vpMatrix = mat4.create();
        mat4.multiply(vpMatrix, projectionMatrix, viewMatrix);

        // Set the uniform for the view–projection matrix.
        const u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
        gl.uniformMatrix4fv(u_ModelMatrix, false, vpMatrix);

        // Set the uniform for the global rotation matrix.
        const u_GlobalRotation = gl.getUniformLocation(program, "u_GlobalRotation");
        gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotationMatrix);

        // Call drawCube() from Cube.js to render the cube.
        drawCube(gl, program);

        requestAnimationFrame(render);
    }
    render();
}

window.onload = main;