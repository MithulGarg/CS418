
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;


// Create a place to store vertex colors
var vertexColorBuffer;

var mvMatrix = mat4.create();
var rotAngle = 0;
var lastTime = 0;


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


 function degToRad(degrees) {
         return degrees * Math.PI / 180;
 }


function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  
}

function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
        // Left and Right side bars
          -0.40,  0.95,  0.0,
          -0.80,  0.95,  0.0,
          -0.80, -0.25,  0.0,
          -0.40,  0.95,  0.0,
          -0.80, -0.25,  0.0,
          -0.40, -0.25,  0.0,
      
           0.40,  0.95,  0.0,
           0.80,  0.95,  0.0,
           0.80, -0.25,  0.0,
           0.40,  0.95,  0.0,
           0.80, -0.25,  0.0,
           0.40, -0.25,  0.0,
      
        // Top Bar
          -0.40,  0.95,  0.0,
           0.40,  0.95,  0.0,
          -0.40,  0.70,  0.0,
           0.40,  0.95,  0.0,
          -0.40,  0.70,  0.0,
           0.40,  0.70,  0.0,
      
        // Little edge pieces on top right and left
          -0.95,  0.95,  0.0,
          -0.80,  0.95,  0.0,
          -0.95,  0.70,  0.0,
          -0.80,  0.95,  0.0,
          -0.95,  0.70,  0.0,
          -0.80,  0.70,  0.0,
      
           0.95,  0.95,  0.0,
           0.80,  0.95,  0.0,
           0.95,  0.70,  0.0,
           0.80,  0.95,  0.0,
           0.95,  0.70,  0.0,
           0.80,  0.70,  0.0,
      
        // Middle pieces to make the I
          -0.40,  0.45,  0.0,
          -0.20,  0.45,  0.0,
          -0.40,  0.00,  0.0,
          -0.20,  0.45,  0.0,
          -0.40,  0.00,  0.0,
          -0.20,  0.00,  0.0,
      
           0.40,  0.45,  0.0,
           0.20,  0.45,  0.0,
           0.40,  0.00,  0.0,
           0.20,  0.45,  0.0,
           0.40,  0.00,  0.0,
           0.20,  0.00,  0.0,
      
        // Bottom Pieces (left to right)
          -0.80, -0.35,  0.0, 
          -0.80, -0.45,  0.0, 
          -0.70, -0.35,  0.0, 
          -0.80, -0.45,  0.0, 
          -0.70, -0.45,  0.0,
          -0.70, -0.35,  0.0, 
          -0.80, -0.45,  0.0, 
          -0.70, -0.45,  0.0,
          -0.70, -0.55,  0.0,
      
           0.80, -0.35,  0.0, 
           0.80, -0.45,  0.0, 
           0.70, -0.35,  0.0, 
           0.80, -0.45,  0.0, 
           0.70, -0.45,  0.0,
           0.70, -0.35,  0.0, 
           0.80, -0.45,  0.0, 
           0.70, -0.45,  0.0,
           0.70, -0.55,  0.0,
      
          -0.40, -0.35,  0.0, 
          -0.40, -0.65,  0.0, 
          -0.50, -0.35,  0.0, 
          -0.50, -0.35,  0.0, 
          -0.50, -0.65,  0.0,
          -0.40, -0.65,  0.0, 
          -0.40, -0.75,  0.0, 
          -0.40, -0.65,  0.0,
          -0.50, -0.65,  0.0,
      
           0.40, -0.35,  0.0, 
           0.40, -0.65,  0.0, 
           0.50, -0.35,  0.0, 
           0.50, -0.35,  0.0, 
           0.50, -0.65,  0.0,
           0.40, -0.65,  0.0, 
           0.40, -0.75,  0.0, 
           0.40, -0.65,  0.0,
           0.50, -0.65,  0.0,
      
          -0.10, -0.35,  0.0, 
          -0.10, -0.85,  0.0, 
          -0.20, -0.35,  0.0, 
          -0.20, -0.35,  0.0, 
          -0.20, -0.85,  0.0,
          -0.10, -0.85,  0.0, 
          -0.10, -0.85,  0.0, 
          -0.10, -0.95,  0.0,
          -0.20, -0.85,  0.0,
      
           0.10, -0.35,  0.0, 
           0.10, -0.85,  0.0, 
           0.20, -0.35,  0.0, 
           0.20, -0.35,  0.0, 
           0.20, -0.85,  0.0,
           0.10, -0.85,  0.0, 
           0.10, -0.85,  0.0, 
           0.10, -0.95,  0.0,
           0.20, -0.85,  0.0
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 96;
  
    
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  // Array to hold the color buffer for each triangluar piece 
  var colors = [
      // Left and Right side bars
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
     
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        
     // Top Bar
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
      
     // Little edge pieces on top right and left
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
      
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
      
      // Middle pieces to make the I
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
      
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
        0.0, 0.0, 0.4, 1.0,
      
      // Bottom Pieces (left to right)
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
      
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
      
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
      
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
      
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
      
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0,
        1.0, 0.3, 0.0, 1.0
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  // Contains all the defined coordinate points for rendering the image
  vertexColorBuffer.numItems = 96;  
}

function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  mat4.identity(mvMatrix);
  mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle));
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

var sinscalar = 0;
function animate() {
        // Calculates an angle for the rotation of the image
        rotAngle = (rotAngle + 0.8) % 360;
        sinscalar += 0.3;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        // Adjust each piece of the image using sin function to create animations
        var triangleVertices = [
          // Left and Right side bars
          -0.40+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*0.35, -0.25+Math.cos(sinscalar)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*0.35, -0.25+Math.cos(sinscalar)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.35, -0.25+Math.cos(sinscalar)*0.05,  0.0,

           0.40+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35, -0.25+Math.cos(sinscalar)*0.05,  0.0,
           0.40+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35, -0.25+Math.cos(sinscalar)*0.05,  0.0,
           0.40+Math.sin(sinscalar-0.50)*0.35, -0.25+Math.cos(sinscalar)*0.05,  0.0,
            
          // Top Bar
          -0.40+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
            
          // Little edge pieces on top right and left
          -0.95+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
          -0.95+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
          -0.95+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
            
           0.95+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
           0.95+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
           0.95+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35,  0.70+Math.cos(sinscalar)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*0.35,  0.95+Math.cos(sinscalar)*0.05,  0.0,
            
          // Middle pieces to make the I
          -0.40+Math.sin(sinscalar-0.50)*0.35,  0.45+Math.cos(sinscalar)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.35,  0.00+Math.cos(sinscalar)*0.05,  0.0,
          -0.20+Math.sin(sinscalar-0.50)*0.35,  0.45+Math.cos(sinscalar)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.35,  0.00+Math.cos(sinscalar)*0.05,  0.0,
          -0.20+Math.sin(sinscalar-0.50)*0.35,  0.00+Math.cos(sinscalar)*0.05,  0.0,
          -0.20+Math.sin(sinscalar-0.50)*0.35,  0.45+Math.cos(sinscalar)*0.05,  0.0,
            
           0.40+Math.sin(sinscalar-0.50)*0.35,  0.45+Math.cos(sinscalar)*0.05,  0.0,
           0.40+Math.sin(sinscalar-0.50)*0.35,  0.00+Math.cos(sinscalar)*0.05,  0.0,
           0.20+Math.sin(sinscalar-0.50)*0.35,  0.45+Math.cos(sinscalar)*0.05,  0.0,
           0.40+Math.sin(sinscalar-0.50)*0.35,  0.00+Math.cos(sinscalar)*0.05,  0.0,
           0.20+Math.sin(sinscalar-0.50)*0.35,  0.00+Math.cos(sinscalar)*0.05,  0.0,
           0.20+Math.sin(sinscalar-0.50)*0.35,  0.45+Math.cos(sinscalar)*0.05,  0.0,
            
          // Bottom Pieces (left to right)
          -0.80+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
          -0.70+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
          -0.70+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
          -0.70+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1)*0.05,  0.0,
          -0.80+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
          -0.70+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
          -0.70+Math.sin(sinscalar-0.50)*-0.1, -0.55+Math.cos(sinscalar-1)*0.05,  0.0,
       
           0.80+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
           0.70+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
           0.70+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
           0.70+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1)*0.05,  0.0,
           0.80+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
           0.70+Math.sin(sinscalar-0.50)*-0.1, -0.45+Math.cos(sinscalar-1)*0.05,  0.0,
           0.70+Math.sin(sinscalar-0.50)*-0.1, -0.55+Math.cos(sinscalar-1)*0.05,  0.0,
            
          -0.40+Math.sin(sinscalar-0.50)*0.1, -0.35+Math.cos(sinscalar+1.0)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
          -0.50+Math.sin(sinscalar-0.50)*0.1, -0.35+Math.cos(sinscalar+1.0)*0.05,  0.0,
          -0.50+Math.sin(sinscalar-0.50)*0.1, -0.35+Math.cos(sinscalar+1.0)*0.05,  0.0,
          -0.50+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.1, -0.75+Math.cos(sinscalar+1.0)*0.05,  0.0,
          -0.40+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
          -0.50+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
            
           0.40+Math.sin(sinscalar-0.50)*0.1, -0.35+Math.cos(sinscalar+1.0)*0.05,  0.0,
           0.40+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
           0.50+Math.sin(sinscalar-0.50)*0.1, -0.35+Math.cos(sinscalar+1.0)*0.05,  0.0,
           0.50+Math.sin(sinscalar-0.50)*0.1, -0.35+Math.cos(sinscalar+1.0)*0.05,  0.0,
           0.50+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
           0.40+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
           0.40+Math.sin(sinscalar-0.50)*0.1, -0.75+Math.cos(sinscalar+1.0)*0.05,  0.0,
           0.40+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
           0.50+Math.sin(sinscalar-0.50)*0.1, -0.65+Math.cos(sinscalar+1.0)*0.05,  0.0,
           +
          -0.10+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1.0)*0.05,  0.0,
          -0.10+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
          -0.20+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1.0)*0.05,  0.0,
          -0.20+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1.0)*0.05,  0.0,
          -0.20+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
          -0.10+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
          -0.10+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
          -0.10+Math.sin(sinscalar-0.50)*-0.1, -0.95+Math.cos(sinscalar-1.0)*0.05,  0.0,
          -0.20+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
           
           0.10+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1.0)*0.05,  0.0,
           0.10+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
           0.20+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1.0)*0.05,  0.0,
           0.20+Math.sin(sinscalar-0.50)*-0.1, -0.35+Math.cos(sinscalar-1.0)*0.05,  0.0,
           0.20+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
           0.10+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
           0.10+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
           0.10+Math.sin(sinscalar-0.50)*-0.1, -0.95+Math.cos(sinscalar-1.0)*0.05,  0.0,
           0.20+Math.sin(sinscalar-0.50)*-0.1, -0.85+Math.cos(sinscalar-1.0)*0.05,  0.0,
            
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
        vertexPositionBuffer.itemSize = 3;
        vertexPositionBuffer.numberOfItems = 96;
}

function tick() {
    requestAnimFrame(tick);
    draw();
    // call the animate function in order to activate non-affine and affine transformations
    animate();
}
