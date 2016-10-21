/**
 * random variables
 */
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

/**
 * Store terrain geometry
 */
var tVertexPositionBuffer;

/**
 * Store normals for shading
 */
var tVertexNormalBuffer;

/**
 * Store terrain triangles
 */
var tIndexTriBuffer;

/**
 * Store traingle edges
 */
var tIndexEdgeBuffer;

/**
 * View parameters
 */
var eyePt = vec3.fromValues(0.0,0.0,0.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

/**
 * Normal matrix creation
 */
var nMatrix = mat3.create();

/**
 * ModelView matrix creation
 */
var mvMatrix = mat4.create();

/**
 * Projection matrix creation
 */
var pMatrix = mat4.create();

/**
 * random variables again
 */
var mvMatrixStack = [];
var rollAngle = 0.0;
var pitchAngle = 0.0;

/**
 * The Quarternions and other related vectors
 */
var overallUpRotation = quat.create();
var overallViewDirRotation = quat.create();
var conjugate = quat.create();
var rollRotation = quat.create();
var upRotated = vec3.create();
var viewDirRotated = vec3.fromValues(0.0,0.0,-1.0);
var pitchRotation = quat.create();

/**
 * function setupTerrainBuffers()
 * Function is used to setup the terrain based on the specified "n" and terrain cordinates
 * (actual terrain generation is done in HelloTerrain.js), setup of buffers is done here
 */
function setupTerrainBuffers() {
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var gridN=128;
    var numT = terrainFromIteration(gridN, -100,101,-64,151, vTerrain, fTerrain, nTerrain);
    console.log("Generated ", numT, " triangles"); 
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    /**
     * Set the normals to do lighting calculations
     */
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain), gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    /**
     * Set faces of the terrain 
     */
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain), gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
    
    /**
     * Setup the edges
     */
     generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain), gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = eTerrain.length;     
}

/**
 * function drawTerrain()
 * takes the generates verticies an draws terrain
 */
function drawTerrain(){
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
/**
 * Bind normal buffer
 */
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);   

/**
 * Do the draw
 */
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

/**
 * function drawTerrainEdges()
 * takes the generates verticies an draws terrain edges
 */
function drawTerrainEdges(){
 gl.polygonOffset(1,1);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

/**
 * Bind the normal matrix buffer
 */
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);   
/**
 * Do the draw
 */   
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
 gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

/**
 * function uploadModelViewMatrixToShader()
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/**
 * function uploadProjectionMatrixToShader()
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * function uploadNormalMatrixToShader()
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

/**
 * function mvPushMatrix()
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


/**
 * function mvPopMatrix()
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Erroneous popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

/**
 * function setMatrixUniforms()
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

/**
 * function degToRad(degrees)
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/**
 * function createGLContext(canvas)
 */
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

/**
 * function loadShaderFromDOM(id)
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
/**
 * If we don't find an element with the specified id, we do an early exit 
 */
  if (!shaderScript) {
    return null;
  }
  
/**
 * Loop through the children for the found DOM element and build up the shader source code as a string
 */
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { /* 3 corresponds to TEXT_NODE */
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

/**
 * function setupShaders()
 */
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

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}


/**
 * function uploadLightsToShader(loc,a,d,s)
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

/**
 * function setupBuffers()
 */
function setupBuffers() {
    setupTerrainBuffers();
}

/**
 * function draw()
 * Draws the perspective of player of game in simulator
 */
function draw() { 
    
    /**
     * Continuous forward movement
     */
    moveForeward();
    /**
     * rolling quarternion rotation
     */
    roll();
    /**
     * updates upRotated
     */
    upRotated = vec3.fromValues(overallUpRotation[0],overallUpRotation[1],overallUpRotation[2]);
    /**
     * pitch quarternion rotation
     */
    pitch();
    /**
     * reupdates upRoated and sets viewDirRotated
     */
    upRotated = vec3.fromValues(overallUpRotation[0],overallUpRotation[1],overallUpRotation[2]);
    viewDirRotated = vec3.fromValues(overallViewDirRotation[0],overallViewDirRotation[1],overallViewDirRotation[2]); 
    var transformVec = vec3.create();
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    /**
     * use perspective
     */
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
    
    /**
     * Create a lookat point for looking down -z direction
     */
    vec3.add(viewPt, eyePt, viewDirRotated);

    /**
     * Generate and init lookat matrix
     */
    mat4.lookAt(mvMatrix,eyePt,viewPt,upRotated);    
 
    /**
     * draw terrain
     */
    mvPushMatrix();
    vec3.set(transformVec, 0.0, -45.0, -80.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-90));    
    setMatrixUniforms();
    uploadLightsToShader([0,10,50],[0.4,52.0/255.0,45.0/255.0],[1.0,0.5,0.0],[0.0,0.0,0.0]);
    drawTerrain();
    mvPopMatrix();
  
}

/**
 * function moveForeward()
 * moves the eyePt in the direction of the rotated viewDir
 */
function moveForeward() {
  eyePt[0] += viewDirRotated[0]*0.1;
  eyePt[1] += viewDirRotated[1]*0.1;
  eyePt[2] += viewDirRotated[2]*0.1;
}

/**
 * function roll()
 * rotates up vector around the viewDir vector using quarternions
 */
function roll() {
/**
 * q*p*q^-1 is the overall formula
 * q
 */
  rollRotation[0] = viewDir[0]*Math.sin(rollAngle/2);
  rollRotation[1] = viewDir[1]*Math.sin(rollAngle/2);
  rollRotation[2] = viewDir[2]*Math.sin(rollAngle/2);
  rollRotation[3] = Math.cos(rollAngle/2);
/**
 * p
 */
  var upQuat = quat.fromValues(up[0],up[1],up[2],0);
  overallUpRotation = quat.multiply(overallUpRotation, rollRotation, upQuat);
/**
 * q^-1
 */
  conjugate = quat.conjugate(conjugate, rollRotation);
  overallUpRotation = quat.multiply(overallUpRotation, overallUpRotation, conjugate);
}

/**
 * rotates upRotated and viewDir around a vector orthogonal to both
 */
function pitch() {
/**
 * the orthogonal vector will be like a y-axis to rotate around
 */
  var orthog = vec3.cross(vec3.create(), viewDir, upRotated);
/**
 * q
 */
  pitchRotation[0] = orthog[0]*Math.sin(pitchAngle/2);
  pitchRotation[1] = orthog[1]*Math.sin(pitchAngle/2);
  pitchRotation[2] = orthog[2]*Math.sin(pitchAngle/2);
  pitchRotation[3] = Math.cos(pitchAngle/2);
/**
 * p
 */
  var upQuat = quat.fromValues(upRotated[0],upRotated[1],upRotated[2],0);
  var viewDirQuat = quat.fromValues(viewDir[0],viewDir[1],viewDir[2],0);
  newUpQuat = quat.multiply(overallUpRotation, pitchRotation, upQuat);
  overallViewDirRotation = quat.multiply(overallViewDirRotation, pitchRotation, viewDirQuat);
/**
 * q^-1
 */
  conjugate = quat.conjugate(conjugate, pitchRotation);
/**
 * new up vector is created from quarternion multiplication
 */
  overallUpRotation = quat.multiply(overallUpRotation, newUpQuat, conjugate);
  overallViewDirRotation = quat.multiply(overallViewDirRotation, overallViewDirRotation, conjugate);
}

/**
 * Handle user keyboard input
 */
var currentlyPressedKeys = {};

/**
 * function handleKeyDown(event)
 */
function handleKeyDown(event) {
        currentlyPressedKeys[event.keyCode] = true;
}

/**
 * function handleKeyUp(event)
 */
function handleKeyUp(event) {
        currentlyPressedKeys[event.keyCode] = false;
}

/**
 * function handleKeys()
 * sets key controls and outputs data to console
 */
function handleKeys() {
        if (currentlyPressedKeys[37]) {
            /**
             * left arrow
             */
            rollAngle-= 0.005;
            console.log("rollAngle = ", rollAngle);
        } else if (currentlyPressedKeys[39]) {
            /**
             * right arrow
             */
            rollAngle+= 0.005;
            console.log("rollAngle = ", rollAngle);
        } 

        if (currentlyPressedKeys[38]) {
            /**
             * up arrow
             */
            pitchAngle+= 0.005;
            console.log("pitchAngle = ", pitchAngle);
        } else if (currentlyPressedKeys[40]) {
            /**
             * down arrow
             */
            pitchAngle-= 0.005;
            console.log("pitchAngle = ", pitchAngle);
        }
}

/**
 * function startup()
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(20.0/255.0, 80.0/255.0, 200.0/255.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  tick();
}

/**
 * function tick()
 * timer function to keep game going infinitely
 */
function tick() {
    requestAnimFrame(tick);
    handleKeys();
    draw();
}

