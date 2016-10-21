/**
 * function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray,normalArray)
 * calulates the vartex array, face array, and normal array for the
 * terrain generation by going to all the verticies of a height map
 */
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray,normalArray)
{
  var heightMap = new Array();
  createHeightMap(n, heightMap);
  var heightCurr = 0;
  var heightTopLeft = 0;
  var heightBottomRight = 0;


  var deltaX=(maxX-minX)/n;
  var deltaY=(maxY-minY)/n;

    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
           vertexArray.push(heightMap[i][j]);

           normalArray.push(0);
           normalArray.push(0);
           normalArray.push(0);

         }

    generateNormals(heightMap, normalArray, n, deltaX, deltaY);

    var numT=0;
    for(var i=0;i<n;i++)
       for(var j=0;j<n;j++)
       {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           numT+=2;
       }
    return numT;
}

/**
 * function generateLinesFromIndexedTriangles(faceArray,lineArray)
 * Adds lines to terrain
 */
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

/**
 * function createHeightMap(n, heightMap)
 * generates an empty height map and then fills it in using the diamond square method
 */
function createHeightMap(n, heightMap)
{
  for(var i = 0; i<=n; i++){
    heightMap[i] = new Array();
    for(var j = 0; j<=n; j++){
      heightMap[i][j] = 0;
    }
  }
  diamondSquare(heightMap, 0, 0, 0, n, n, n, n, 0, 10);
}

/**
 * function diamondSquare(heightMap, x1, y1, x2, y2, x3, y3, x4, y4, range)
 * helper function that sets the heights of four conrners
 */
function diamondSquare(heightMap, x1, y1, x2, y2, x3, y3, x4, y4, range)
{
  if((x3 - x1) == 1){
    return;
  }
  if(range == 10) 
  {
    heightMap[x1][y1] = range;
    heightMap[x2][y2] = range;
    heightMap[x3][y3] = range;
    heightMap[x4][y4] = range;
  }

  /* center coords */
  var centerX = (x4 - x1) /2 + x1;
  var centerY = (y2 - y1) /2 + y1;

  randomNum = Math.random() * range;

  /* center height plus a random value */
  heightMap[centerX][centerY] = ((heightMap[x1][y1] + heightMap[x2][y2] + heightMap[x3][y3] + heightMap[x4][y4]) / 4) + randomNum;

  randomNum = Math.random() * range;

  /* diamond heights plus a random value */
  heightMap[centerX][y1] = ((heightMap[x1][y1] + heightMap[x4][y4] + heightMap[centerX][centerY]) / 3) + randomNum;
  heightMap[centerX][y2] = ((heightMap[x2][y2] + heightMap[x3][y3] + heightMap[centerX][centerY]) / 3) + randomNum;
  heightMap[x1][centerY] = ((heightMap[x1][y1] + heightMap[x2][y2] + heightMap[centerX][centerY]) / 3) + randomNum;
  heightMap[x4][centerY] = ((heightMap[x3][y3] + heightMap[x4][y4] + heightMap[centerX][centerY]) / 3) + randomNum;

  /* roughness coefficient */
  range *= 0.6;

  /* recursive calls */
  diamondSquare(heightMap, x1, y1, x1, centerY, centerX, centerY, centerX, y4, range);
  diamondSquare(heightMap, x1, centerY, x2, y2, centerX, y3, centerX, centerY, range);
  diamondSquare(heightMap, centerX, centerY, centerX, y2, x3, y3, x4, centerY, range);
  diamondSquare(heightMap, centerX, y1, centerX, centerY, x3, centerY, x4, y4, range);
}

/**
 * function generateNormals(heightMap, normalArray, n, deltaX, deltaY)
 * determines the normals for the light values
 */
function generateNormals(heightMap, normalArray, n, deltaX, deltaY)
{
  var vec1 = vec3.create();
  var vec2 = vec3.create();
  var t1 = vec3.create();
  var t2 = vec3.create();
  var cross = vec3.create();

  for(var i=0;i<=n-1;i++)
   for(var j=0;j<=n-1;j++)
   {
      /* current index in a 1D array */
      var vid = i*(n+1) + j;
      /*vectors of the points in the square are used to compute two normal 
      from two faces */
      vec3.set(vec1, deltaX, 0, heightMap[i][j+1] - heightMap[i][j]);
      vec3.set(vec2, 0, deltaY, heightMap[i+1][j] - heightMap[i][j]);
      vec3.cross(cross, vec1, vec2);

      vec3.set(t1, -deltaX, 0, heightMap[i+1][j] - heightMap[i+1][j+1]);
      vec3.set(t2, 0, -deltaY, heightMap[i][j+1] - heightMap[i+1][j+1]);
      vec3.cross(t1, t1, t2);

      /* normals are summed to all points used */
      normalArray[3*vid] += cross[0];
      normalArray[(3*vid)+1] += cross[1];
      normalArray[(3*vid)+2] += cross[2];

      normalArray[3*(vid+n+1)] += cross[0] + t1[0];
      normalArray[(3*(vid+n+1))+1] += cross[1] + t1[1];
      normalArray[(3*(vid+n+1))+2] += cross[2] + t1[2];

      normalArray[3*(vid+1)] += cross[0] + t1[0];
      normalArray[(3*(vid+1))+1] += cross[1] + t1[1];
      normalArray[(3*(vid+1))+2] += cross[2] + t1[2];

      normalArray[3*(vid+n+2)] += cross[0];
      normalArray[(3*(vid+n+2))+1] += cross[1];
      normalArray[(3*(vid+n+2))+2] += cross[2];
   }
  
  /* length is computed to normalize the vectors stored in the normal array */
  var legth  = 0;
  for(var i=0;i<=n-1;i++)
   for(var j=0;j<=n-1;j++)
   {
    var vid = i*(n+1) + j;
    length = Math.sqrt(Math.pow(normalArray[3*vid],2) + Math.pow(normalArray[3*vid + 1],2) + Math.pow(normalArray[3*vid + 2],2));
    normalArray[3*vid] = normalArray[3*vid] / length;
    normalArray[3*vid + 1] = normalArray[3*vid + 1] / length;
    normalArray[3*vid + 2] = normalArray[3*vid + 2] / length;
  }

}




