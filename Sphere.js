/**
 * drawSphere generates a sphere with per-vertex positions, colors, and normals.
 * For a sphere centered at the origin, Normal = normalized position.
 * Interleaved layout per vertex: [pos(3), color(4), normal(3)] = 10 floats.
 *
 * This version sets the sphere's base color to red.
 */
function drawSphere(gl, program, radius, latitudeBands, longitudeBands) {
    var vertices = [];
    var colors = [];
    var normals = [];
    var indices = [];
    
    // Generate vertices and normals.
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);
      
      for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        var phi = longNumber * 2 * Math.PI / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        
        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        
        // Position
        vertices.push(radius * x, radius * y, radius * z);
        // Color: set to red
        colors.push(1.0, 0.0, 0.0, 1.0);
        // Normal (normalized position)
        normals.push(x, y, z);
      }
    }
    
    // Generate indices.
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
        var first = (latNumber * (longitudeBands + 1)) + longNumber;
        var second = first + longitudeBands + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }
    
    // Interleave the attributes: pos(3), color(4), normal(3).
    var interleaved = [];
    var numVertices = vertices.length / 3;
    for (var i = 0; i < numVertices; i++) {
      interleaved.push(
        vertices[i*3], vertices[i*3+1], vertices[i*3+2],
        colors[i*4], colors[i*4+1], colors[i*4+2], colors[i*4+3],
        normals[i*3], normals[i*3+1], normals[i*3+2]
      );
    }
    
    var interleavedArray = new Float32Array(interleaved);
    
    // Create and bind the vertex buffer.
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, interleavedArray, gl.STATIC_DRAW);
    var FSIZE = interleavedArray.BYTES_PER_ELEMENT;
    
    // a_Position
    var a_Position = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 10, 0);
    gl.enableVertexAttribArray(a_Position);
    
    // a_Color
    var a_Color = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 10, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);
    
    // a_Normal
    var a_Normal = gl.getAttribLocation(program, "a_Normal");
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 10, FSIZE * 7);
    gl.enableVertexAttribArray(a_Normal);
    
    // Create and bind the index buffer.
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    // Draw the sphere.
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }
  