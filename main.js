"use strict";

// Global variables.
var canvas, gl, program;
var normalVis = false;   // Toggle normal visualization
var lightingOn = true;   // Toggle lighting
var lightPos = vec3.fromValues(10, 10, 10);
var lightColor = vec3.fromValues(1.0, 1.0, 1.0);
var spotCutoff = 45.0;   // degrees for the spotlight cutoff

// Camera parameters.
var zoom = 15;
var azimuth = 45;
var elevation = 30;
var eye = vec3.create();
var center = vec3.fromValues(0, 0, 0);
var up = vec3.fromValues(0, 1, 0);

// Matrices.
var modelMatrix = mat4.create();
var viewMatrix = mat4.create();
var projMatrix = mat4.create();
var normalMatrix = mat3.create();

var lastTime = 0;

// Variables for mouse dragging.
var isDragging = false;
var lastMouseX = 0;
var lastMouseY = 0;

function initWebGL() {
  canvas = document.getElementById("glCanvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    alert("Unable to initialize WebGL.");
    return;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  
  // Add mouse event listeners for camera control.
  canvas.addEventListener("mousedown", function(e) {
    if (e.button === 0) { // left button
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });
  
  canvas.addEventListener("mousemove", function(e) {
    if (isDragging) {
      var dx = e.clientX - lastMouseX;
      var dy = e.clientY - lastMouseY;
      // Adjust sensitivity factor as needed.
      azimuth += dx * 0.5;
      elevation += dy * 0.5;
      // Clamp elevation between -90 and 90 degrees.
      if (elevation > 90) elevation = 90;
      if (elevation < -90) elevation = -90;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });
  
  canvas.addEventListener("mouseup", function(e) {
    isDragging = false;
  });
  
  canvas.addEventListener("mouseleave", function(e) {
    isDragging = false;
  });
}

function initShaders() {
  // Vertex shader.
  var vsSource = `
    attribute vec3 a_Position;
    attribute vec4 a_Color;
    attribute vec3 a_Normal;
    
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjMatrix;
    uniform mat3 u_NormalMatrix;
    
    varying vec4 v_Color;
    varying vec3 v_Normal;
    varying vec3 v_FragPos;
    
    void main() {
      // Calculate world position of the vertex.
      vec4 worldPos = u_ModelMatrix * vec4(a_Position, 1.0);
      gl_Position = u_ProjMatrix * u_ViewMatrix * worldPos;
      
      // Pass color and normal to the fragment shader.
      v_Color = a_Color;
      v_Normal = normalize(u_NormalMatrix * a_Normal);
      v_FragPos = worldPos.xyz;  // in world space.
    }
  `;
  
  // Fragment shader with updated spotlight calculations and light marker flag.
  var fsSource = `
    precision mediump float;
    
    varying vec4 v_Color;
    varying vec3 v_Normal;
    varying vec3 v_FragPos;
    
    uniform vec3 u_LightPos;
    uniform vec3 u_LightColor;
    uniform vec3 u_ViewPos;
    uniform bool u_NormalVis;
    uniform bool u_LightOn;
    uniform float u_SpotCutoff; // in degrees
    uniform vec3 u_Center;      // center of the sphere (target of spotlight)
    uniform bool u_IsLightMarker;  // when true, draw light marker without lighting
    
    // Material properties.
    const float ambientStrength = 0.05;  // reduced ambient to emphasize spotlight effect
    const float specularStrength = 0.5;
    const float shininess = 32.0;
    
    void main() {
      // If drawing the light marker, output the light color directly.
      if(u_IsLightMarker) {
        gl_FragColor = vec4(u_LightColor, 1.0);
        return;
      }
      
      // Normal visualization mode.
      if(u_NormalVis) {
        // Map normal from [-1,1] to [0,1] for color.
        vec3 normalColor = normalize(v_Normal) * 0.5 + 0.5;
        gl_FragColor = vec4(normalColor, 1.0);
        return;
      }
      
      // If lighting is off, just output the base color.
      if(!u_LightOn) {
        gl_FragColor = v_Color;
        return;
      }
      
      // Ambient term.
      vec3 ambient = ambientStrength * u_LightColor;
      
      // Updated spotlight calculations.
      // Define spotlight direction as the direction from the light toward the sphere's center.
      vec3 spotDir = normalize(u_Center - u_LightPos);
      // Compute light direction from the light to the fragment.
      vec3 lightDir = normalize(v_FragPos - u_LightPos);
      
      // Compute the cosine of the angle between lightDir and spotDir.
      float cosTheta = dot(lightDir, spotDir);
      // Calculate cutoff as cosine of the cutoff angle.
      float cutoff = cos(radians(u_SpotCutoff));
      // Use smoothstep for a tight falloff.
      float intensity = smoothstep(cutoff, cutoff + 0.1, cosTheta);
      
      // Diffuse term.
      vec3 norm = normalize(v_Normal);
      float diff = max(dot(norm, lightDir), 0.0);
      vec3 diffuse = diff * u_LightColor;
      
      // Specular term.
      vec3 viewDir = normalize(u_ViewPos - v_FragPos);
      vec3 reflectDir = reflect(-lightDir, norm);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
      vec3 specular = specularStrength * spec * u_LightColor;
      
      // Combine all lighting components with the base color.
      vec3 result = (ambient + intensity*(diffuse + specular)) * v_Color.rgb;
      gl_FragColor = vec4(result, v_Color.a);
    }
  `;
  
  // Compile and link shaders.
  var vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
  var fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Shader program failed to link: " + gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);
}

function loadShader(type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("Shader compile error: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function setUniformMatrices() {
  // Model matrix = identity for the main sphere.
  mat4.identity(modelMatrix);
  
  // Calculate eye position from spherical coordinates.
  var radAz = glMatrix.toRadian(azimuth);
  var radEl = glMatrix.toRadian(elevation);
  eye[0] = zoom * Math.cos(radEl) * Math.sin(radAz);
  eye[1] = zoom * Math.sin(radEl);
  eye[2] = zoom * Math.cos(radEl) * Math.cos(radAz);
  
  mat4.lookAt(viewMatrix, eye, center, up);
  mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 100.0);
  
  // Normal matrix.
  mat3.normalFromMat4(normalMatrix, modelMatrix);
  
  // Pass matrices to the shader.
  var uModel = gl.getUniformLocation(program, "u_ModelMatrix");
  var uView = gl.getUniformLocation(program, "u_ViewMatrix");
  var uProj = gl.getUniformLocation(program, "u_ProjMatrix");
  var uNormal = gl.getUniformLocation(program, "u_NormalMatrix");
  
  gl.uniformMatrix4fv(uModel, false, modelMatrix);
  gl.uniformMatrix4fv(uView, false, viewMatrix);
  gl.uniformMatrix4fv(uProj, false, projMatrix);
  gl.uniformMatrix3fv(uNormal, false, normalMatrix);
  
  // Pass the camera/view position.
  var uViewPos = gl.getUniformLocation(program, "u_ViewPos");
  gl.uniform3fv(uViewPos, eye);
}

function setUniformLighting(isLightMarker) {
  // Set lighting-related uniforms.
  var uLightPos = gl.getUniformLocation(program, "u_LightPos");
  var uLightColor = gl.getUniformLocation(program, "u_LightColor");
  var uNormalVis = gl.getUniformLocation(program, "u_NormalVis");
  var uLightOn = gl.getUniformLocation(program, "u_LightOn");
  var uSpotCutoff = gl.getUniformLocation(program, "u_SpotCutoff");
  var uCenter = gl.getUniformLocation(program, "u_Center");
  var uIsLightMarker = gl.getUniformLocation(program, "u_IsLightMarker");
  
  gl.uniform3fv(uLightPos, lightPos);
  gl.uniform3fv(uLightColor, lightColor);
  gl.uniform1i(uNormalVis, normalVis);
  gl.uniform1i(uLightOn, lightingOn);
  gl.uniform1f(uSpotCutoff, spotCutoff);
  gl.uniform3fv(uCenter, center);
  gl.uniform1i(uIsLightMarker, isLightMarker);
}

function renderScene() {
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  setUniformMatrices();
  
  // --- Draw main sphere at the origin ---
  setUniformLighting(false);  // For the sphere, use lighting calculations.
  var sphereModel = mat4.create();
  mat4.translate(sphereModel, sphereModel, [0, 0, 0]);
  var uModel = gl.getUniformLocation(program, "u_ModelMatrix");
  gl.uniformMatrix4fv(uModel, false, sphereModel);
  
  var sphereNormal = mat3.create();
  mat3.normalFromMat4(sphereNormal, sphereModel);
  var uNormal = gl.getUniformLocation(program, "u_NormalMatrix");
  gl.uniformMatrix3fv(uNormal, false, sphereNormal);
  
  // Draw sphere (its vertex color is set in Sphere.js, e.g. red).
  drawSphere(gl, program, 1.5, 30, 30);
  
  // --- Draw a small cube at the light position ---
  // Set the flag so the light marker is drawn unlit.
  setUniformLighting(true);
  var lightModel = mat4.create();
  mat4.translate(lightModel, lightModel, lightPos);
  mat4.scale(lightModel, lightModel, [0.2, 0.2, 0.2]);
  gl.uniformMatrix4fv(uModel, false, lightModel);
  
  var lightNormal = mat3.create();
  mat3.normalFromMat4(lightNormal, lightModel);
  gl.uniformMatrix3fv(uNormal, false, lightNormal);
  
  drawCube(gl, program);
}

function tick() {
  var currentTime = performance.now();
  var deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Animate the light in a circle (optional).
  var speed = 0.05;
  var angle = speed * currentTime * 0.001;
  lightPos[0] = 10 * Math.cos(angle);
  lightPos[2] = 10 * Math.sin(angle);
  
  renderScene();
  requestAnimationFrame(tick);
}

function initControls() {
  document.getElementById("toggleNormalVis").addEventListener("click", function() {
    normalVis = !normalVis;
  });
  document.getElementById("toggleLighting").addEventListener("click", function() {
    lightingOn = !lightingOn;
  });
  
  document.getElementById("zoomSlider").addEventListener("input", function() {
    zoom = Number(this.value);
  });
  document.getElementById("azimuthSlider").addEventListener("input", function() {
    azimuth = Number(this.value);
  });
  document.getElementById("elevationSlider").addEventListener("input", function() {
    elevation = Number(this.value);
  });
  
  document.getElementById("lightX").addEventListener("input", function() {
    lightPos[0] = Number(this.value);
  });
  document.getElementById("lightY").addEventListener("input", function() {
    lightPos[1] = Number(this.value);
  });
  document.getElementById("lightZ").addEventListener("input", function() {
    lightPos[2] = Number(this.value);
  });
  
  document.getElementById("lightR").addEventListener("input", function() {
    lightColor[0] = Number(this.value);
  });
  document.getElementById("lightG").addEventListener("input", function() {
    lightColor[1] = Number(this.value);
  });
  document.getElementById("lightB").addEventListener("input", function() {
    lightColor[2] = Number(this.value);
  });
  
  document.getElementById("spotCutoff").addEventListener("input", function() {
    spotCutoff = Number(this.value);
  });
}

function main() {
  initWebGL();
  initShaders();
  initControls();
  lastTime = performance.now();
  tick();
}

window.onload = main;
