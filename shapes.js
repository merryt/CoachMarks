'use strict';

function makePoint(x,y)
{
  return { x:x, y:y };
}

var origin = makePoint(0,0);

function polarToPoint(a,b)
{
  if(arguments.length === 1) return translatePointPolar(origin, a.length, a.angle);
  else if(arguments.length === 2) return translatePointPolar(origin, a, b);
}

function pointToPolar(p)
{
  return { length: distanceBetweenPoints(p,origin),
           angle: angleBetweenPoints(p,origin) };
}

function addPoints(p1,p2)
{
  return makePoint(p1.x + p2.x, p1.y + p2.y);
}

function halfWayBetweenPoints(p1,p2)
{
  return makePoint((p1.x+p2.x)/2,(p1.y+p2.y)/2);
}

function distanceBetweenPoints(p1,p2)
{
  return Math.sqrt(Math.pow(p2.x-p1.x,2) +
                   Math.pow(p2.y-p1.y,2));
                   
}

function angleBetweenPoints(p1,p2)
{
  return Math.atan2(p2.y-p1.y,p2.x-p1.x);
}

function translatePointPolar(p,length,angle)
{
  return makePoint(p.x + length * Math.cos(angle),
                   p.y + length * Math.sin(angle));
}

function translatePointTowardsPoint(p1,p2,length)
{
  return translatePointPolar(p1,length,angleBetweenPoints(p1,p2));
}

function pointIsInsideRect(p,r)
{
  return (p.x >= r.x && p.x <= r.x + r.width) && (p.y >= r.y && p.y <= r.y + r.height);
}

function makeLine(fx,fy,tx,ty,length,angle)
{ 
  if(length === undefined || angle === undefined) 
  {
    var t = pointToPolar(makePoint(tx-fx,ty-fy));
    length = t.length;
    angle = t.angle;
  }
  return { fx: fx, fy: fy, tx: tx, ty: ty, length: length, angle: angle };
}

function lineStartPoint(l)
{
  return makePoint(l.fx,l.fy);
}

function lineEndPoint(l)
{
  return makePoint(l.tx,l.ty);
}

function lineMidPoint(l)
{
  return makePoint((l.fx+l.tx)/2, (l.fy+l.ty)/2);
}

/*
function lineIntersectsRect(line,r)
{
  //translate and scale so we have new line fx,fy->tx,ty
  //now we have to see if it intersects the 0,0 1x1 rect
  //start with the x
  var fx = (line.fx - r.x)/r.width;
  var tx = (line.tx - r.x)/r.width;

  // if it is completely on one side of the rect then it doesn't intersect
  if((fx < 0 && tx < 0) ||
     (fx > 1 && tx > 1)) return false;

  //do the same thing for the y
  var fy = (line.fy - r.y)/r.height;
  var ty = (line.ty - r.y)/r.height;

  if((fy < 0 && ty < 0) ||
     (fy > 1 && ty > 1)) return false;

  // if either end point is inside the rect it intersects
  if((fx >=0 && fx <= 1 && fy >= 0 && fy <= 1) ||
     (tx >=0 && tx <= 1 && ty >= 0 && ty <= 1) ||

  // if the line is horizontally or vertically contained by the rect
  // and the other is on either side it intersects (and we've already verified that)
     (fx >= 0 && fx <= 1 && tx >= 0 && tx <= 1) ||
      (fy >= 0 && fy <= 1 && ty >= 0 && ty <= 1)) return true;


  // by now the line can't be either horizontal or vertical
  // this means that if it intersects it will intersect two neighboring sides of the rect
  // so figure out the equation for the line
  // y = mx + b    x = (y-b)/m
  // solve at x=0, x=1, y = 0, y = 1
  
  var m = (ty-fy)/(tx-fx),b = fy - m*fx;
  var yAtZero = b, yAtOne = m+b,xAtZero = -b/m,xAtOne = (1-b)/m;

  return (yAtZero >= 0 && yAtZero <= 1) ||
    (yAtOne >=0 && yAtOne <=1) ||
    (xAtZero >= 0 && xAtZero <= 1) ||
    (xAtOne >=0 && xAtOne <=1);
}
*/


function lineIntersectsRect(line,r)
{
  var fx = line.fx, tx = line.tx, fy = line.fy, ty = line.ty;

  var left = r.x, top = r.y, right = r.x+r.width, bottom = r.y+r.height;

  // if it is completely on one side of the rect then it doesn't intersect
  if((fx < left && tx < left) ||
     (fx > right && tx > right) ||
     (fy < top && ty < top) ||
     (fy > bottom && ty > bottom)) return false;

  // if either end point is inside the rect it intersects
  if((fx >=left && fx <= right && fy >= top && fy <= bottom) ||
     (tx >=left && tx <= right && ty >= top && ty <= bottom) ||

  // if the line is horizontally or vertically contained by the rect
  // and the other is on either side it intersects (and we've already verified that)
    // (fx >= 0 && fx <= 1 && tx >= 0 && tx <= 1) ||
    //  (fy >= 0 && fy <= 1 && ty >= 0 && ty <= 1)) return true;
     (fx >= left && fx <= right && tx >= left && tx <= right) ||
      (fy >= top && fy <= bottom && ty >= top && ty <= bottom)) return true;


  // by now the line can't be either horizontal or vertical
  // this means that if it intersects it will intersect two neighboring sides of the rect
  // so figure out the equation for the line
  // y = mx + b    x = (y-b)/m
  // solve at x=0, x=1, y = 0, y = 1
  
  var m = (ty-fy)/(tx-fx),b = fy - m*fx;
  var yAtLeft = m*left+b, yAtRight = m*right+b,xAtTop = (top-b)/m,xAtBottom = (bottom-b)/m;
  return (yAtLeft >= top && yAtLeft <= bottom) ||
    (yAtRight >=top && yAtRight <=bottom) ||
    (xAtTop >= left && xAtTop <= right) ||
    (xAtBottom >=left && xAtBottom <=right);
}




function pointFromRectPerimeterBetweenPoints(rect,p1,p2) 
{ // this assumes one  point is inside the rect and the other is out
  // it returns the point on the perimeter between the two

  //find internal point
  var fromInside = pointIsInsideRect(p1,rect);
  var ipx = fromInside ? p1.x : p2.x;
  var ipy = fromInside ? p1.y : p2.y;

  var opx = fromInside ? p2.x : p1.x;
  var opy = fromInside ? p2.y : p1.y;
  

  // translated outside point
  var x = opx - ipx;
  var y = opy - ipy;

  //translated rect
  var trect = translateRect(rect, -ipx, -ipy);
  //corner
  var sx = 1;
  var sy = 1;
  var cx = trect.x + trect.width;
  var cy = trect.y + trect.height;
  if(x < 0) { cx = -trect.x; sx = -1; }
  if(y < 0) { cy = -trect.y; sy = -1; }

  sx *= cx;
  sy *= cy;
  x /= sx;
  y /= sy;

  // inside point is now 0,0  corner is 1,1  
  // x,y is now the outside point scaled and translated accordingly
  // sx and sy are what we will multiply later to untransform

  if(x === y) return makePoint(sx + ipx, sy + ipy);
  else if(x > y) return makePoint(sx + ipx, sy*y/x + ipy);
  else if(x < y) return makePoint(sx*x/y + ipx, sy + ipy);
}


function linesIntersect(line1,line2)
{

  var x1 = line1.fx, y1 = line1.fy, x2 = line1.tx, y2 = line1.ty, 
      x3 = line2.fx, y3 = line2.fy, x4 = line2.tx, y4 = line2.ty;

  return Math.max(x3,x4) > Math.min(x1,x2) &&
    Math.max(x1,x2) > Math.min(x3,x4) &&
    Math.max(y1,y2) > Math.min(y3,y4) &&
    Math.max(y3,y4) > Math.min(y1,y2) &&  
    (((y4-y1) * (x3-x1) > (y3-y1) * (x4-x1)) !== ((y4-y2) * (x3-x2) > (y3-y2) * (x4-x2))) &&
    (((y3-y1) * (x2-x1) > (y2-y1) * (x3-x1)) !== ((y4-y1) * (x2-x1) > (y2-y1) * (x4-x1)));
}

function makeRect(x,y,w,h)
{
  return { x:x, y:y, width:w, height: h };
}

function makeRectWithCenter(x,y,w,h)
{
  return makeRect(x-w/2, y-h/2,w,h);
}

function padRect(r,pad)
{
  return makeRect(r.x - pad, r.y - pad, r.width + 2*pad, r.height + 2*pad);
}

function translateRect(r,x,y)
{
  return makeRect(r.x+x,r.y+y,r.width,r.height);
}

function translateRectPolar(r,length,angle)
{
  return makeRect(r.x + length*Math.cos(angle),
                  r.y + length*Math.sin(angle),
                  r.width, r.height);
}

function translateRectTowardsPoint(r,length,p)
{
  return translateRectPolar(r,length,angleBetweenPoints(p,rectCenter(r)));
}

function rectCenter(r)
{
  return makePoint(r.x+r.width/2,r.y+r.height/2);
}

function rectsIntersect(r1,r2)
{
  return !(r1.x+r1.width < r2.x ||
           r2.x+r2.width < r1.x ||
           r1.y+r1.height < r2.y ||
           r2.y+r2.height < r1.y);         
}

function rectContainsRect(r1,r2)
{
  return (r1.x <= r2.x) &&
    (r1.y <= r2.y) &&
    (r1.x + r1.width >= r2.x + r2.width) &&
    (r1.y + r1.height >= r2.y + r2.height);
}
function pointToCSS(p)
{
  return { left: p.x, top: p.y };
}


function rectToCSS(r)
{
  return { left: r.x, top: r.y, 
           width: r.width, height: r.height };
}

