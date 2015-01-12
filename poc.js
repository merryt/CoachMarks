///  ??  http://www.kevlindev.com/gui/math/intersection/Intersection.js

function Point(x,y)
{
  return {x: x, y:y};
}

function differenceBetween(a,b)
{
  return Point(a.x - b.x,
               a.y - b.y);
}

function distanceBetween(a,b)
{
  return Math.sqrt(Math.pow(a.x - b.x,2) +
                   Math.pow(a.y - b.y,2));
}

function angleBetween(a,b)
{
  return Math.atan2(b.y-a.y,
                    b.x-a.x);
}


function doLinesIntersect(line1From,line1To, line2From, line2To) 
{
  var x1 = line1From.x, y1 = line1From.y, x2 = line1To.x, y2 = line1To.y, 
      x3 = line2From.x, y3 = line2From.y, x4 = line2To.x, y4 = line2To.y;

  var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  if (isNaN(x) || isNaN(y)) return false;
  if (x1 >= x2) { if (!(x2 <= x && x <= x1)) return false; } 
  else { if (!(x1 <= x && x <= x2)) return false; }
  if (y1 >= y2) { if (!(y2 <= y && y <= y1)) return false; } 
  else { if (!(y1 <= y && y <= y2)) return false; }   
  if (x3 >= x4) { if (!(x4 <= x && x <= x3)) return false; } 
  else { if (!(x3 <= x && x <= x4)) return false; }
  if (y3 >= y4) { if (!(y4 <= y && y <= y3)) return false;} 
  else { if (!(y3 <= y && y <= y4)) return false; }
  return true;
}

/**************************************************/

function Circle(a,b,c)
{
  if(arguments.length === 2) return { radius: b, center: a };
  else if(arguments.length === 3) return { radius: c, center: Point(a,b) };
  console.error("Bad args for Circle");
  return {};
}

function cloneCircle(c)
{
  return Circle(c.center.x,c.center.y,c.radius);
}

function doesCircleIntersectLine(circle,lineFrom,lineTo)
{
  var p = circle.center;
  var v = lineFrom;
  var w = lineTo;
  var l2 = Math.pow(distanceBetween(lineFrom,lineTo),2);
  if(l2 === 0) return true;
  var t = ((p.x-v.x)*(w.x-v.x)+(p.y-v.y)*(w.y-v.y))/l2;
  if(t<0) return distanceBetween(p,v) < circle.radius;
  if(t>1) return distanceBetween(p,w) < circle.radius;
  return distanceBetween(p,Point(v.x + t*(w.x-v.x),
                                 v.y + t*(w.y-v.y))) < circle.radius;

}

function isCircleInRect(circle,topLeft,bottomRight)
{
  var x1 = topLeft.x, y1 = topLeft.y, x2 = bottomRight.x, y2 = bottomRight.y;
  var r = circle.radius, px = circle.center.x, py = circle.center.y;
  return !(px-r < x1 ||
           py-r < y1 ||
           px+r > x2 ||
           py+r > y2);
}


function doCirclesOverlap(c1,c2)
{
  var d = distanceBetween(c1.center,c2.center);
  return d < c1.radius + c2.radius;
}

function makeCirclesNotOverlap(c1,c2)
{
  if(doCirclesOverlap(c1,c2))
  {
    var mag = c1.radius + c2.radius;
    var rot = angleBetween(c1.center,c2.center);
    c2.center.x = mag * Math.cos(rot) + c1.center.x;
    c2.center.y = mag * Math.sin(rot) + c1.center.y;
  }
}

function circleCenterToCSS(c)
{
  return { left: c.center.x,
           top: c.center.y };
}

function circleRadiusToCSS(c)
{
  return { width: c.radius * 2,
           height: c.radius * 2,
           'margin-left': -c.radius,
           'margin-right': -c.radius,
           'margin-top': -c.radius };
}

/**************************************************/
var markCount = 0;
function makeCoachmarkID()
{
  return "mark"+markCount++;
}

function Coachmark(from,to,id)
{
  if(id === undefined) id = makeCoachmarkID();
  return { id: id, 
           from: from,
           to: to };
}

function coachmarkMagnitude(m)
{
  return distanceBetween(m.from.center,m.to.center);
}

function coachmarkRotation(m)
{
  return angleBetween(m.from.center,m.to.center);
}

function cloneCoachmark(m)
{
  return Coachmark(cloneCircle(m.from),cloneCircle(m.to),m.id);
}

function fixCoachmark(m)
{
  makeCirclesNotOverlap(m.from,m.to);
}

/********************************************************************************/

function scoreCirclesOverlap(c1,c2)
{
  var d = distanceBetween(c1.center,c2.center);
  if(d < c1.radius + c2.radius) return c1.radius + c2.radius - d;
  else return 0;
}

function scoreLinesIntersect(line1From,line1To,line2From,line2To)
{
  if(doLinesIntersect(line1From,line1To,line2From,line2To)) return 20;
  else return 0;
}

function scoreCircleIntersectLine(circle,lineFrom,lineTo)
{
  var p = circle.center;
  var v = lineFrom;
  var w = lineTo;
  var l2 = Math.pow(distanceBetween(lineFrom,lineTo),2);
  if(l2 === 0) return 100;
  var t = ((p.x-v.x)*(w.x-v.x)+(p.y-v.y)*(w.y-v.y))/l2;
  if(t<0) 
  {
    var d = distanceBetween(p,v);
    if(d < circle.radius) return circle.radius - d;
    else return 0;
  }
  if(t>1) 
  {
    var d = distanceBetween(p,w);
    if(d < circle.radius) return circle.radius - d;
    else return 0;
  }
  var d = distanceBetween(p,Point(v.x + t*(w.x-v.x),
                                 v.y + t*(w.y-v.y)));
  if(d < circle.radius) return circle.radius - d;
  else return 0;
}

function scoreCircleInRect(circle,topLeft,bottomRight)
{
  var x1 = topLeft.x, y1 = topLeft.y, x2 = bottomRight.x, y2 = bottomRight.y;
  var r = circle.radius, px = circle.center.x, py = circle.center.y;
  if(px-r < x1) return x1-(px-r);
  else if(py-r < y1) return y1-(py-r);
  else if(px+r > x2) return (px+r)-x2;
  else if(py+r > y2) return (py+r)-y2;
  return 0;
}

function scoreForMark(mark)
{
  var s =  scoreCirclesOverlap(mark.from,mark.to);
  s+= scoreCircleInRect(mark.to,origin,screenSize);
  var len = coachmarkMagnitude(mark);
  if(len < minLength) return s + (minLength - len)/20;
  else if(len > maxLength) return s + (len - maxLength)/20;
  else return s;
}

function scoreForMarkPair(mark1,mark2)
{
  var scores =  
        [scoreCirclesOverlap(mark1.from,mark2.to),
         scoreCirclesOverlap(mark1.to,mark2.from),
         scoreCirclesOverlap(mark1.to,mark2.to),
         scoreLinesIntersect(mark1.from.center,mark1.to.center,
                             mark2.from.center,mark2.to.center),
         scoreCircleIntersectLine(mark1.from,mark2.from.center,mark2.to.center),
         scoreCircleIntersectLine(mark1.to,mark2.from.center,mark2.to.center),
         scoreCircleIntersectLine(mark2.from,mark1.from.center,mark1.to.center),
         scoreCircleIntersectLine(mark2.to,mark1.from.center,mark1.to.center)
        ];
  return scores.reduce(function(a,b) { return a+b; },0);
}

function scoreMarkSet(markSet)
{
  var score = 0;
  var len = markSet.length;
  for(var i = 0; i<len; ++i)
  {
    score += scoreForMark(markSet[i]);
    for(var j = i+1; j<len; ++j)
    {
      score += scoreForMarkPair(markSet[i],markSet[j]);
    }    
  }
  return score;
}

function mutateMark(mark)
{
  var fromPoint = mark.from.center;
  var toPoint = mark.to.center;
  var newToPoint = Point(toPoint.x,toPoint.y);
  var newToCircle = Circle(newToPoint,mark.to.radius);
  var dist;
  var angle;
  var safetyCount = 2000;
  do
  {
    if(--safetyCount < 0) { console.warn("safetyCount in mutateMark"); break; }
    dist = Math.random() * mutationDistance;
    angle = Math.random() * Math.PI * 2;
    newToPoint.x = toPoint.x + dist * Math.cos(angle);
    newToPoint.y = toPoint.y + dist * Math.sin(angle);
  }
  while(!isCircleInRect(newToCircle,origin,screenSize));

  return Coachmark(mark.from,newToCircle,mark.id);  
}

function breedMarkSet(markSet1,markSet2)
{
  var newMarkSet = [];
  var len = markSet1.length;
  for(var i = 0; i<len; ++i)
  {
    var markSet = (Math.random()<.5) ? markSet1 : markSet2;
    var newMark = markSet[i];
    if(Math.random()<mutationRate) newMark = mutateMark(newMark);
    else newMark = cloneCoachmark(newMark);
    newMarkSet[i] = newMark;
  }
  return newMarkSet;
}

function sortMarkSetGeneration(markSetGeneration)
{
  markSetGeneration.forEach(function(markSet)
                            {
                              markSet.score = scoreMarkSet(markSet);
                            });
  markSetGeneration.sort(function(a,b) { return a.score - b.score; });
}

function newMarkSetGeneration(markSetGeneration)
{
  var newGen = [];
  for(var i = 0; i<numberOfChildren; ++i)
  {
    newGen.push(breedMarkSet(markSetGeneration[0],
                             markSetGeneration[1]));
  }
  if(includeParents) newGen.push(markSetGeneration[0],markSetGeneration[1]);
  sortMarkSetGeneration(newGen);
  return newGen;
}

var display = $(".coachmarks");
var origin = Point(0,0);
var screenSize = Point(2000,2000);

var mutationRate = .1;
var mutationDistance = 1000;
var numberOfChildren = 20;
var includeParents = true;
var maxLength = 250;
var minLength = 50;
var gensPerStep = 400;
var startOnResize = true;

var markSetGeneration;


var resizeTimeout;
function resize()
{
  stop();
  screenSize.x = $(".coachmarks").width();
  screenSize.y = $(".coachmarks").height();

  createOrRefreshCoachmarks();
  clearTimeout(resizeTimeout);
  if(startOnResize) resizeTimeout = setTimeout(start,10);
}


resize();
$(window).resize(resize);


var runningTimeout;
function stop()
{
  clearTimeout(runningTimeout);
}
var lastScore;
function initStart()
{
  lastScore = 100;
  var markSet = createOrRefreshCoachmarks();
  markSetGeneration = [markSet,markSet];
  step(0,false);
}
function start()
{
  clearTimeout(runningTimeout);
  initStart();
  (function go()
  {
    runningTimeout = 
      setTimeout(function()
                 {
                   step(gensPerStep,true);
                   go();
                 },0);
  }());
}

var alreadyZero = false;

function step(times,onlyDisplayWhenBigChange)
{
  sortMarkSetGeneration(markSetGeneration);

  if(markSetGeneration[0].score === 0) 
  {
    updateCoachmarks(markSetGeneration[0]);
    return stop();
  }
  if(times === undefined) times = 1;
  for(var i = 0; i<times; ++i)
  {
    markSetGeneration = newMarkSetGeneration(markSetGeneration);
    if(markSetGeneration[0].score === 0) break;
  }
  var tmpMarkSet = markSetGeneration[0];
  if(!onlyDisplayWhenBigChange || 
     tmpMarkSet.score === 0 || 
     (lastScore - tmpMarkSet.score) > 20)

  {
    updateCoachmarks(tmpMarkSet);
    lastScore = tmpMarkSet.score;
  }
  clearInfo();
  displayInfo({ score: Math.ceil(tmpMarkSet.score) });
}

$(document).on("keyup",
               function(e)
               {
                 var key = String.fromCharCode(e.keyCode).toLowerCase();
                 if(key === "s") { stop(); step(1); }
                 else if(key === "1") { stop(); step(50); }
                 else if(key === "2") { stop(); step(100); }
                 else if(key === "3") { stop(); step(150); }
                 else if(key === "4") { stop(); step(200); }
                 else if(key === "5") { stop(); step(250); }
                 else if(key === "6") { stop(); step(300); }
                 else if(key === "7") { stop(); step(350); }
                 else if(key === "8") { stop(); step(400); }
                 else if(key === "9") { stop(); step(450); }
                 else if(key === "t") { startOnResize = !startOnResize; }
                 else if(key === "r") { stop(); resetCoachmarks(); initStart();};
               });



/**************************************************/
function clearInfo()
{
  $(".info").empty();
}

function displayInfo(o)
{
  var info = $(".info");
  for(var prop in o)
  {
    if(o.hasOwnProperty(prop))
    {
      info.append($("<div/>",{ text: prop + ": "+o[prop] }));
    }
  }
  info.append("<br/>");
}


function updateCoachmark(mark)
{
  var el = $("[data-mark-id="+mark.id+"]");
  el.css(circleCenterToCSS(mark.from));
  el.data("mark",mark);
  var currentR = el.data("rotation");
  el.find(".fromObj").css(circleRadiusToCSS(mark.from));

  var r = coachmarkRotation(mark);
  while(r-currentR > Math.PI) r-= 2* Math.PI;
  while(currentR-r > Math.PI) r+= 2* Math.PI;

  el.data("rotation",r);
  el.find(".toObj").css(circleRadiusToCSS(mark.to))
    .css({ '-webkit-transform': "rotate(" + (-r) + "rad)" }); 
  el.find(".lineObj")
    .css({
      width: coachmarkMagnitude(mark),
      '-webkit-transform': "rotate(" + r + "rad)"
  });
}


function updateCoachmarks(markSet)
{
  markSet.forEach(updateCoachmark);
}

function createInitialCoachmark(circle)
{
  var p = circle.center;
  
  var startPoint = Point(0,0);
  var mark = Coachmark(circle,Circle(startPoint,0));
  startPoint.x = screenSize.x/2;
  startPoint.y = screenSize.y/2;
  var angle = coachmarkRotation(mark);
  //angle = Math.round(angle / (Math.PI/6)) * (Math.PI/6);
  startPoint.x = p.x + maxLength * Math.cos(angle);
  startPoint.y = p.y + maxLength * Math.sin(angle);

  return mark;
}


function createCoachmark(el)
{
  var markText = el.attr("data-coachmark");
  var w = el.outerWidth(), h = el.outerHeight();
  var offset = el.offset();
  var x = offset.left, y= offset.top;
  var mark = createInitialCoachmark(Circle(x+w/2,y+h/2,Math.max(w,h)/2));
  el.data("mark",mark);
  var text = $("<div/>", { 'class': "text", 'text': markText });
  
  $("<div/>", { 'class': "coachmark"})
    .attr("data-mark-id",mark.id)
    .data("mark",mark)
    .appendTo(display)
    .append($("<div/>", { 'class': "fromObj"}))    
    .append($("<div/>", { 'class': "lineObj"})
            .append($("<div/>", { 'class': "toObj"})
                    .append(text)));
  
  mark.to.radius = text.outerWidth()/2;

  return mark;
}

function createOrRefreshCoachmark(el)
{
  var mark = el.data("mark");
  if(!mark) return createCoachmark(el);
  mark = $("[data-mark-id="+mark.id+"]").data("mark");

  var w = el.outerWidth(), h = el.outerHeight();
  var offset = el.offset();
  var x = offset.left, y= offset.top;
  
  var circle = mark.from;
  var point = circle.center;
  var newX = x+w/2;
  var newY = y+h/2;
  var dX = newX - point.x;
  var dY = newY - point.y;
  point.x = newX;
  point.y = newY;
  mark.to.center.x += dX;
  mark.to.center.y += dY;
  circle.radius = Math.max(w,h)/2;
  updateCoachmark(mark);
  return mark;
}

function resetCoachmarks()
{
  $("[data-coachmark]").each(function() { $(this).removeData("mark"); });
  $(".coachmark").remove();
}

function createOrRefreshCoachmarks()
{
  var markSet = [];
  $("[data-coachmark]")
    .each(function()
          {
            markSet.push(createOrRefreshCoachmark($(this)));
          });
  return markSet;
}


/********************************************************************************/

function setupCircleDrag(selector, prop)
{
  // this broke when we started updating the point at whenever we restart
  $(document).on("mousedown",selector,
                 function(e)
                 {

                   var el = $(this);
                   var mark = el.parent().data("mark");
                   $(document).on("mousemove",move).on("mouseup",end);
                   stop();
                   updateCoachmarks(markSetGeneration[0]);
                   function move(e)
                   {
                     mark[prop].center.x = e.clientX;
                     mark[prop].center.y = e.clientY;
                     updateCoachmark(mark);
                   }
                   function end(e) { 
                     //var ms = markSetGeneration[0];
                     //markSetGeneration = [ms,ms];
                     //sortMarkSetGeneration(markSetGeneration);
                     //updateCoachmarks(markSetGeneration[0]);
                     start();
                     $(document).off("mousemove",move).off("mouseup",end); }
                 });
}

//setupCircleDrag(".fromObj","from");
//setupCircleDrag(".toObj","to");


