/**
 * drawCube constructs a cube with per‐vertex positions, colors, and normals.
 * Interleaved vertex layout: [position(3), color(4), normal(3)] = 10 floats per vertex
 */
function drawCube(gl, program) {
  // 24 vertices for the 6 faces
  var vertices = new Float32Array([
    // Front face (normal: 0, 0, 1)
    -0.5, -0.5,  0.5,   1, 0, 0, 1,    0, 0, 1,
     0.5, -0.5,  0.5,   1, 0, 0, 1,    0, 0, 1,
     0.5,  0.5,  0.5,   1, 0, 0, 1,    0, 0, 1,
    -0.5,  0.5,  0.5,   1, 0, 0, 1,    0, 0, 1,

    // Back face (normal: 0, 0, -1)
    -0.5, -0.5, -0.5,   0, 1, 0, 1,    0, 0, -1,
     0.5, -0.5, -0.5,   0, 1, 0, 1,    0, 0, -1,
     0.5,  0.5, -0.5,   0, 1, 0, 1,    0, 0, -1,
    -0.5,  0.5, -0.5,   0, 1, 0, 1,    0, 0, -1,

    // Top face (normal: 0, 1, 0)
    -0.5,  0.5,  0.5,   0, 0, 1, 1,    0, 1, 0,
     0.5,  0.5,  0.5,   0, 0, 1, 1,    0, 1, 0,
     0.5,  0.5, -0.5,   0, 0, 1, 1,    0, 1, 0,
    -0.5,  0.5, -0.5,   0, 0, 1, 1,    0, 1, 0,

    // Bottom face (normal: 0, -1, 0)
    -0.5, -0.5,  0.5,   1, 1, 0, 1,    0, -1, 0,
     0.5, -0.5,  0.5,   1, 1, 0, 1,    0, -1, 0,
     0.5, -0.5, -0.5,   1, 1, 0, 1,    0, -1, 0,
    -0.5, -0.5, -0.5,   1, 1, 0, 1,    0, -1, 0,

    // Right face (normal: 1, 0, 0)
     0.5, -0.5,  0.5,   1, 0, 1, 1,    1, 0, 0,
     0.5, -0.5, -0.5,   1, 0, 1, 1,    1, 0, 0,
     0.5,  0.5, -0.5,   1, 0, 1, 1,    1, 0, 0,
     0.5,  0.5,  0.5,   1, 0, 1, 1,    1, 0, 0,

    // Left face (normal: -1, 0, 0)
    -0.5, -0.5,  0.5,   0, 1, 1, 1,   -1, 0, 0,
    -0.5, -0.5, -0.5,   0, 1, 1, 1,   -1, 0, 0,
    -0.5,  0.5, -0.5,   0, 1, 1, 1,   -1, 0, 0,
    -0.5,  0.5,  0.5,   0, 1, 1, 1,   -1, 0, 0
  ]);
  
  var indices = new Uint16Array([
    0, 1, 2,   0, 2, 3,    // front
    4, 5, 6,   4, 6, 7,    // back
    8, 9, 10,  8, 10, 11,  // top
    12, 13, 14, 12, 14, 15, // bottom
    16, 17, 18, 16, 18, 19, // right
    20, 21, 22, 20, 22, 23  // left
  ]);
  
  // Create and bind the vertex buffer.
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  var FSIZE = vertices.BYTES_PER_ELEMENT;
  
  // a_Position: 3 floats starting at offset 0.
  var a_Position = gl.getAttribLocation(program, "a_Position");
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 10, 0);
  gl.enableVertexAttribArray(a_Position);
  
  // a_Color: 4 floats after position.
  var a_Color = gl.getAttribLocation(program, "a_Color");
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 10, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);
  
  // a_Normal: 3 floats after position+color.
  var a_Normal = gl.getAttribLocation(program, "a_Normal");
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 10, FSIZE * 7);
  gl.enableVertexAttribArray(a_Normal);
  
  // Create and bind the index buffer.
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
  // Draw the cube.
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}
