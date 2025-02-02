// Cube.js

/**
 * drawCube builds the necessary buffers for a cube (composed of triangles)
 * and draws it. It assumes that the shader program is in use and that the
 * uniforms u_ModelMatrix and u_GlobalRotation are already set.
 *
 * @param {WebGLRenderingContext} gl - The WebGL context.
 * @param {WebGLProgram} program - The shader program (which uses attributes a_Position and a_Color).
 */
function drawCube(gl, program) {
    // Cube vertex data: 3 position components and 4 color components per vertex.
    const verticesColors = new Float32Array([
      // Front face
      -0.5, -0.5,  0.5,   1, 0, 0, 1,  // Red
       0.5, -0.5,  0.5,   0, 1, 0, 1,  // Green
       0.5,  0.5,  0.5,   0, 0, 1, 1,  // Blue
      -0.5,  0.5,  0.5,   1, 1, 0, 1,  // Yellow
  
      // Back face
      -0.5, -0.5, -0.5,   1, 0, 1, 1,  // Purple
       0.5, -0.5, -0.5,   0, 1, 1, 1,  // Cyan
       0.5,  0.5, -0.5,   1, 1, 1, 1,  // White
      -0.5,  0.5, -0.5,   0, 0, 0, 1   // Black
    ]);
  
    // Indices for 12 triangles (2 per cube face)
    const indices = new Uint16Array([
      // Front face
      0, 1, 2,   0, 2, 3,
      // Back face
      4, 5, 6,   4, 6, 7,
      // Left face
      0, 3, 7,   0, 7, 4,
      // Right face
      1, 5, 6,   1, 6, 2,
      // Top face
      3, 2, 6,   3, 6, 7,
      // Bottom face
      0, 1, 5,   0, 5, 4
    ]);
  
    // Create and bind the vertex buffer.
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
    const FSIZE = verticesColors.BYTES_PER_ELEMENT;
  
    // Get attribute locations.
    const a_Position = gl.getAttribLocation(program, "a_Position");
    const a_Color = gl.getAttribLocation(program, "a_Color");
  
    // Set up the position attribute (3 floats per vertex).
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 7, 0);
    gl.enableVertexAttribArray(a_Position);
  
    // Set up the color attribute (4 floats per vertex, starting after 3 floats).
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 7, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);
  
    // Create and bind the index buffer.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
    // Finally, draw the cube.
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }  