"use strict";

// Global variables.
var canvas, gl, program;
var normalVis = false;   // Toggle normal visualization
var lightingOn = true;   // Toggle lighting
// We'll compute the effective light position as: effective = autoLightPos + lightOffset.
var lightPos = vec3.create(); // effective light position passed to shaders
var lightColor = vec3.fromValues(1.0, 1.0, 1.0);
var spotCutoff = 45.0;   // degrees for the spotlight cutoff

// We'll use autoLightPos for automatic movement and lightOffset for slider control.
var autoLightPos = vec3.create();         // automatically computed part (X, Z move in a circle)
var lightOffset = vec3.fromValues(0, 10, 10); // initial offset so that effectiveLightPos = (10,10,10)

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
      azimuth += dx * 0.5;
      elevation += dy * 0.5;
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
      vec4 worldPos = u_ModelMatrix * vec4(a_Position, 1.0);
      gl_Position = u_ProjMatrix * u_ViewMatrix * worldPos;
      v_Color = a_Color;
      v_Normal = normalize(u_NormalMatrix * a_Normal);
      v_FragPos = worldPos.xyz;
    }
  `;
  
  // Fragment shader.
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
    
    const float ambientStrength = 0.05;
    const float specularStrength = 0.5;
    const float shininess = 32.0;
    
    void main() {
      if(u_IsLightMarker) {
        gl_FragColor = vec4(u_LightColor, 1.0);
        return;
      }
      
      if(u_NormalVis) {
        vec3 normalColor = normalize(v_Normal) * 0.5 + 0.5;
        gl_FragColor = vec4(normalColor, 1.0);
        return;
      }
      
      if(!u_LightOn) {
        gl_FragColor = v_Color;
        return;
      }
      
      vec3 ambient = ambientStrength * u_LightColor;
      
      // Define spotlight direction as from the light to the sphere's center.
      vec3 spotDir = normalize(u_LightPos - u_Center);
      // Compute light direction from the light to the fragment.
      vec3 lightDir = normalize(u_LightPos - v_FragPos);
      
      float cosTheta = dot(lightDir, spotDir);
      float cutoff = cos(radians(u_SpotCutoff));
      float intensity = smoothstep(cutoff, cutoff + 0.1, cosTheta);
      
      vec3 norm = normalize(v_Normal);
      float diff = max(dot(norm, lightDir), 0.0);
      vec3 diffuse = diff * u_LightColor;
      
      vec3 viewDir = normalize(u_ViewPos - v_FragPos);
      vec3 reflectDir = reflect(-lightDir, norm);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
      vec3 specular = specularStrength * spec * u_LightColor;
      
      vec3 result = (ambient + intensity * (diffuse + specular)) * v_Color.rgb;
      gl_FragColor = vec4(result, v_Color.a);
    }
  `;
  
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
  mat4.identity(modelMatrix);
  
  var radAz = glMatrix.toRadian(azimuth);
  var radEl = glMatrix.toRadian(elevation);
  eye[0] = zoom * Math.cos(radEl) * Math.sin(radAz);
  eye[1] = zoom * Math.sin(radEl);
  eye[2] = zoom * Math.cos(radEl) * Math.cos(radAz);
  
  mat4.lookAt(viewMatrix, eye, center, up);
  // Set far clipping plane to 10000 so you can zoom out further.
  mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 10000.0);
  
  mat3.normalFromMat4(normalMatrix, modelMatrix);
  
  var u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
  var u_ViewMatrix = gl.getUniformLocation(program, "u_ViewMatrix");
  var u_ProjMatrix = gl.getUniformLocation(program, "u_ProjMatrix");
  var u_NormalMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix);
  gl.uniformMatrix3fv(u_NormalMatrix, false, normalMatrix);
  
  var u_ViewPos = gl.getUniformLocation(program, "u_ViewPos");
  gl.uniform3fv(u_ViewPos, eye);
}

function setUniformLighting(isLightMarker) {
  var u_LightPos = gl.getUniformLocation(program, "u_LightPos");
  var u_LightColor = gl.getUniformLocation(program, "u_LightColor");
  var u_NormalVis = gl.getUniformLocation(program, "u_NormalVis");
  var u_LightOn = gl.getUniformLocation(program, "u_LightOn");
  var u_SpotCutoff = gl.getUniformLocation(program, "u_SpotCutoff");
  var u_Center = gl.getUniformLocation(program, "u_Center");
  var u_IsLightMarker = gl.getUniformLocation(program, "u_IsLightMarker");
  
  gl.uniform3fv(u_LightPos, lightPos);
  gl.uniform3fv(u_LightColor, lightColor);
  gl.uniform1i(u_NormalVis, normalVis);
  gl.uniform1i(u_LightOn, lightingOn);
  gl.uniform1f(u_SpotCutoff, spotCutoff);
  gl.uniform3fv(u_Center, center);
  gl.uniform1i(u_IsLightMarker, isLightMarker);
}

function renderScene() {
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  setUniformMatrices();
  setUniformLighting(false);
  
  var u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
  var u_NormalMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
  
  // Draw main sphere at the origin.
  var sphereModel = mat4.create();
  mat4.translate(sphereModel, sphereModel, [0, 0, 0]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, sphereModel);
  
  var sphereNormal = mat3.create();
  mat3.normalFromMat4(sphereNormal, sphereModel);
  gl.uniformMatrix3fv(u_NormalMatrix, false, sphereNormal);
  
  drawSphere(gl, program, 1.5, 30, 30);
  
  // Draw eight cubes around the sphere for additional lighting test.
  for (var i = 0; i < 8; i++) {
    var angle = i * (2 * Math.PI / 8);
    var cubeX = 3 * Math.cos(angle);
    var cubeZ = 3 * Math.sin(angle);
    var cubeY = 0;
    var cubeModel = mat4.create();
    mat4.translate(cubeModel, cubeModel, [cubeX, cubeY, cubeZ]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, cubeModel);
    
    var cubeNormal = mat3.create();
    mat3.normalFromMat4(cubeNormal, cubeModel);
    gl.uniformMatrix3fv(u_NormalMatrix, false, cubeNormal);
    
    drawCube(gl, program);
  }
  
  // Draw a small cube at the light position (light marker).
  setUniformLighting(true);
  var lightModel = mat4.create();
  mat4.translate(lightModel, lightModel, lightPos);
  mat4.scale(lightModel, lightModel, [0.2, 0.2, 0.2]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, lightModel);
  
  var lightNormal = mat3.create();
  mat3.normalFromMat4(lightNormal, lightModel);
  gl.uniformMatrix3fv(u_NormalMatrix, false, lightNormal);
  
  drawCube(gl, program);
}

function tick() {
  var currentTime = performance.now();
  lastTime = currentTime;
  
  // Animate the light in a circle (affecting only X and Z) at 5x speed.
  var speed = 0.25;
  var angle = speed * currentTime * 0.001;
  autoLightPos[0] = 10 * Math.cos(angle);
  autoLightPos[1] = 0;
  autoLightPos[2] = 10 * Math.sin(angle);
  
  // Combine auto movement with slider offset.
  vec3.add(lightPos, autoLightPos, lightOffset);
  
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
  
  // Update the light offset with slider values.
  document.getElementById("lightX").addEventListener("input", function() {
    lightOffset[0] = Number(this.value);
  });
  document.getElementById("lightY").addEventListener("input", function() {
    lightOffset[1] = Number(this.value);
  });
  document.getElementById("lightZ").addEventListener("input", function() {
    lightOffset[2] = Number(this.value);
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
