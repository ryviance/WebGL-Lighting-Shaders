// BlockyAnimal.js

// Simple shader sources (they must match the attributes/uniforms expected by drawCube())
const vertexShaderSource = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_ModelViewProjection;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_ModelViewProjection * a_Position;
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

// Utility functions to compile shaders and create a shader program.
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
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
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

// Main function to set up WebGL and animate the cube.
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

  // Create and use our shader program.
  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  if (!program) {
    console.error("Failed to create shader program.");
    return;
  }
  gl.useProgram(program);

  // Animation: update rotation angle and redraw cube.
  let angle = 0;
  function render() {
    // Clear the canvas (color & depth buffers).
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create the model matrix (apply rotation).
    const modelMatrix = mat4.create();
    mat4.fromYRotation(modelMatrix, angle * Math.PI / 180);

    // Create the view matrix (camera).
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 0, 3], [0, 0, 0], [0, 1, 0]);

    // Create the projection matrix.
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

    // Compute the final Model-View-Projection matrix.
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);

    // Call drawCube() from Cube.js to build the cube buffers and draw the cube.
    drawCube(gl, program, mvpMatrix);

    angle += 1; // Update rotation angle
    requestAnimationFrame(render);
  }
  render();
}

window.onload = main;