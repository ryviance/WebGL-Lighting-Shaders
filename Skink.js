// Skink.js

function renderSkink() {
    // Clear the color and depth buffers.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // --- Compute global object rotation matrix from sliders ---
    var globalRotationX = mat4.create();
    mat4.fromXRotation(globalRotationX, gAnimalGlobalRotationX * Math.PI / 180);
    var globalRotationY = mat4.create();
    mat4.fromYRotation(globalRotationY, gAnimalGlobalRotation * Math.PI / 180);
    var globalRotationMatrix = mat4.create();
    mat4.multiply(globalRotationMatrix, globalRotationY, globalRotationX);
    
    // --- Compute view–projection matrix using camera controls ---
    var viewMatrix = mat4.create();
    var azimuth = gCameraAzimuth * Math.PI / 180;
    var elevation = gCameraElevation * Math.PI / 180;
    var distance = gCameraZoom;
    var eyeX = distance * Math.sin(azimuth) * Math.cos(elevation);
    var eyeY = distance * Math.sin(elevation);
    var eyeZ = distance * Math.cos(azimuth) * Math.cos(elevation);
    var eye = [eyeX, eyeY, eyeZ];
    mat4.lookAt(viewMatrix, eye, [0, 0, 0], [0, 1, 0]);
    var projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    var vpMatrix = mat4.create();
    mat4.multiply(vpMatrix, projectionMatrix, viewMatrix);
    
    // Set uniforms.
    var u_GlobalRotation = gl.getUniformLocation(program, "u_GlobalRotation");
    gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotationMatrix);
    var u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
    
    // Helper: combine vpMatrix with a local transform and draw a cube.
    function drawCubePiece(localTransform) {
      var finalMatrix = mat4.create();
      mat4.multiply(finalMatrix, vpMatrix, localTransform);
      gl.uniformMatrix4fv(u_ModelMatrix, false, finalMatrix);
      drawCube(gl, program);
    }
    
    // --- Determine vertical offsets based on mouth animation ---
    // When the mouth is animated open, crouch the body and head.
    var bodyYOffset = mouthAnimationOn ? -0.3 * gMouthOpenAmount : 0;
    var headYOffset = mouthAnimationOn ? (0.3 - 0.3 * gMouthOpenAmount) : 0.3;
    
    // --- Draw Body (5 cubes in a gentle curve) ---
    var local = mat4.create();
    mat4.fromTranslation(local, [-2, bodyYOffset, 0]);
    drawCubePiece(local);
    mat4.fromTranslation(local, [-1, bodyYOffset, 0.3]);
    drawCubePiece(local);
    mat4.fromTranslation(local, [0, bodyYOffset, 0.5]);
    drawCubePiece(local);
    mat4.fromTranslation(local, [1, bodyYOffset, 0.3]);
    drawCubePiece(local);
    mat4.fromTranslation(local, [2, bodyYOffset, 0]);
    drawCubePiece(local);
    
    // --- Draw Head and Snout ---
    var headTransform = mat4.create();
    mat4.fromTranslation(headTransform, [3, headYOffset, 0]);
    // Apply head shake rotation.
    mat4.rotateY(headTransform, headTransform, gHeadShakeAngle * Math.PI / 180);
    drawCubePiece(headTransform);
    
    // Extended snout if mouth animation is on.
    if (mouthAnimationOn && gMouthOpenAmount > 0.2) {
      // Draw an extra snout cube that extends further.
      var snoutTransform = mat4.create();
      // The snout is extended further when mouth is open.
      mat4.fromTranslation(snoutTransform, [3.5 + 0.5 * gMouthOpenAmount, headYOffset, 0]);
      // Scale the snout a little.
      mat4.scale(snoutTransform, snoutTransform, [0.7, 0.7, 0.7]);
      drawCubePiece(snoutTransform);
      
      // Draw the tongue as a long, thin red cube.
      var tongueTransform = mat4.create();
      mat4.fromTranslation(tongueTransform, [4.0 + 1.0 * gMouthOpenAmount, headYOffset - 0.1, 0]);
      mat4.scale(tongueTransform, tongueTransform, [1.5, 0.2, 0.2]);
      // Use a helper that forces the cube color to red.
      function drawTonguePiece(localTransform) {
        var finalMatrix = mat4.create();
        mat4.multiply(finalMatrix, vpMatrix, localTransform);
        gl.uniformMatrix4fv(u_ModelMatrix, false, finalMatrix);
        var colorLoc = gl.getAttribLocation(program, "a_Color");
        gl.disableVertexAttribArray(colorLoc);
        gl.vertexAttrib4f(colorLoc, 1, 0, 0, 1);
        drawCube(gl, program);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
      }
      drawTonguePiece(tongueTransform);
    } else {
      // If mouth animation is off, draw the standard snout.
      var snoutTransform = mat4.create();
      mat4.fromTranslation(snoutTransform, [3.5, headYOffset, 0]);
      mat4.scale(snoutTransform, snoutTransform, [0.7, 0.7, 0.7]);
      drawCubePiece(snoutTransform);
    }
    
    // --- Draw Tail (4 segments) ---
    var segLength = 1.0;
    var tailBase = mat4.create();
    mat4.fromTranslation(tailBase, [-2, 0, 0]); // Tail attaches at (-2, 0, 0)
    
    // Segment 1:
    var R1 = mat4.create();
    mat4.fromYRotation(R1, gTailJointAngle1 * Math.PI / 180);
    var T1 = mat4.create();
    mat4.fromTranslation(T1, [-segLength, 0, 0]);
    var S1 = mat4.create();
    mat4.fromScaling(S1, [1, 1, 1]);
    var tailSeg1 = mat4.create();
    mat4.multiply(tailSeg1, tailBase, R1);
    mat4.multiply(tailSeg1, tailSeg1, T1);
    mat4.multiply(tailSeg1, tailSeg1, S1);
    drawCubePiece(tailSeg1);
    var tailSeg1Unscaled = mat4.create();
    mat4.multiply(tailSeg1Unscaled, tailBase, R1);
    mat4.multiply(tailSeg1Unscaled, tailSeg1Unscaled, T1);
    
    // Segment 2:
    var R2 = mat4.create();
    mat4.fromYRotation(R2, gTailJointAngle2 * Math.PI / 180);
    var T2 = mat4.create();
    mat4.fromTranslation(T2, [-segLength, 0, 0]);
    var S2 = mat4.create();
    mat4.fromScaling(S2, [0.9, 0.9, 0.9]);
    var tailSeg2 = mat4.create();
    mat4.multiply(tailSeg2, tailSeg1Unscaled, R2);
    mat4.multiply(tailSeg2, tailSeg2, T2);
    mat4.multiply(tailSeg2, tailSeg2, S2);
    drawCubePiece(tailSeg2);
    var tailSeg2Unscaled = mat4.create();
    mat4.multiply(tailSeg2Unscaled, tailSeg1Unscaled, R2);
    mat4.multiply(tailSeg2Unscaled, tailSeg2Unscaled, T2);
    
    // Segment 3:
    var R3 = mat4.create();
    mat4.fromYRotation(R3, gTailJointAngle3 * Math.PI / 180);
    var T3 = mat4.create();
    mat4.fromTranslation(T3, [-segLength, 0, 0]);
    var S3 = mat4.create();
    mat4.fromScaling(S3, [0.8, 0.8, 0.8]);
    var tailSeg3 = mat4.create();
    mat4.multiply(tailSeg3, tailSeg2Unscaled, R3);
    mat4.multiply(tailSeg3, tailSeg3, T3);
    mat4.multiply(tailSeg3, tailSeg3, S3);
    drawCubePiece(tailSeg3);
    var tailSeg3Unscaled = mat4.create();
    mat4.multiply(tailSeg3Unscaled, tailSeg2Unscaled, R3);
    mat4.multiply(tailSeg3Unscaled, tailSeg3Unscaled, T3);
    
    // Segment 4:
    var T4 = mat4.create();
    mat4.fromTranslation(T4, [-segLength, 0, 0]);
    var S4 = mat4.create();
    mat4.fromScaling(S4, [0.7, 0.7, 0.7]);
    var tailSeg4 = mat4.create();
    mat4.multiply(tailSeg4, tailSeg3Unscaled, T4);
    mat4.multiply(tailSeg4, tailSeg4, S4);
    drawCubePiece(tailSeg4);
    
    // --- Draw Legs (unchanged) ---
    var pivot = [0, 0.5, 0];
    var temp = mat4.create();
    
    var frontLeftLeg = mat4.create();
    mat4.fromTranslation(frontLeftLeg, [-1.5, -0.75, 0.7]);
    mat4.fromTranslation(temp, pivot);
    mat4.multiply(frontLeftLeg, frontLeftLeg, temp);
    var rotFL = mat4.create();
    mat4.fromXRotation(rotFL, gFrontLeftLegJointAngle * Math.PI / 180);
    mat4.multiply(frontLeftLeg, frontLeftLeg, rotFL);
    mat4.fromTranslation(temp, [-pivot[0], -pivot[1], -pivot[2]]);
    mat4.multiply(frontLeftLeg, frontLeftLeg, temp);
    mat4.scale(frontLeftLeg, frontLeftLeg, [0.5, 0.5, 0.5]);
    drawCubePiece(frontLeftLeg);
    
    var frontRightLeg = mat4.create();
    mat4.fromTranslation(frontRightLeg, [-1.5, -0.75, -0.7]);
    mat4.fromTranslation(temp, pivot);
    mat4.multiply(frontRightLeg, frontRightLeg, temp);
    var rotFR = mat4.create();
    mat4.fromXRotation(rotFR, gFrontRightLegJointAngle * Math.PI / 180);
    mat4.multiply(frontRightLeg, frontRightLeg, rotFR);
    mat4.fromTranslation(temp, [-pivot[0], -pivot[1], -pivot[2]]);
    mat4.multiply(frontRightLeg, frontRightLeg, temp);
    mat4.scale(frontRightLeg, frontRightLeg, [0.5, 0.5, 0.5]);
    drawCubePiece(frontRightLeg);
    
    var backLeftLeg = mat4.create();
    mat4.fromTranslation(backLeftLeg, [1.5, -0.75, 0.7]);
    mat4.fromTranslation(temp, pivot);
    mat4.multiply(backLeftLeg, backLeftLeg, temp);
    var rotBL = mat4.create();
    mat4.fromXRotation(rotBL, gBackLeftLegJointAngle * Math.PI / 180);
    mat4.multiply(backLeftLeg, backLeftLeg, rotBL);
    mat4.fromTranslation(temp, [-pivot[0], -pivot[1], -pivot[2]]);
    mat4.multiply(backLeftLeg, backLeftLeg, temp);
    mat4.scale(backLeftLeg, backLeftLeg, [0.5, 0.5, 0.5]);
    drawCubePiece(backLeftLeg);
    
    var backRightLeg = mat4.create();
    mat4.fromTranslation(backRightLeg, [1.5, -0.75, -0.7]);
    mat4.fromTranslation(temp, pivot);
    mat4.multiply(backRightLeg, backRightLeg, temp);
    var rotBR = mat4.create();
    mat4.fromXRotation(rotBR, gBackRightLegJointAngle * Math.PI / 180);
    mat4.multiply(backRightLeg, backRightLeg, rotBR);
    mat4.fromTranslation(temp, [-pivot[0], -pivot[1], -pivot[2]]);
    mat4.multiply(backRightLeg, backRightLeg, temp);
    mat4.scale(backRightLeg, backRightLeg, [0.5, 0.5, 0.5]);
    drawCubePiece(backRightLeg);
  }  