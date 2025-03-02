// Sphere.js

/**
 * Draws a red sphere.
 * @param {WebGLRenderingContext} gl - The WebGL context.
 * @param {WebGLProgram} program - The shader program.
 * @param {number} radius - Radius of the sphere.
 * @param {number} latitudeBands - Number of latitudinal subdivisions.
 * @param {number} longitudeBands - Number of longitudinal subdivisions.
 */
function drawSphere(gl, program, radius, latitudeBands, longitudeBands) {
    var vertices = [];
    var colors = [];
    var indices = [];

    // Generate vertices and color data.
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

            // Position.
            vertices.push(radius * x, radius * y, radius * z);
            // Color: red.
            colors.push(1.0, 0.0, 0.0, 1.0);
        }
    }

    // Generate indices for triangles.
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    // Interleave vertices and colors (3 position floats and 4 color floats per vertex).
    var interleavedData = [];
    var numVertices = vertices.length / 3;
    for (var i = 0; i < numVertices; i++) {
        interleavedData.push(
            vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2],
            colors[i * 4], colors[i * 4 + 1], colors[i * 4 + 2], colors[i * 4 + 3]
        );
    }
    var interleavedArray = new Float32Array(interleavedData);

    // Create and bind the vertex buffer.
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, interleavedArray, gl.STATIC_DRAW);
    var FSIZE = interleavedArray.BYTES_PER_ELEMENT;

    // Set up the attribute pointers.
    const a_Position = gl.getAttribLocation(program, "a_Position");
    const a_Color = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 7, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 7, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    // Create and bind the index buffer.
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}
