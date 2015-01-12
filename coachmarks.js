'use strict';


function renderMark(mark,dontAnimate)
{
  mark.dispMark.data("lastSyncMark",mark);
  renderDisplayMarkPath(mark.dispMark,mark,dontAnimate);
}

function renderMarkSet(markSet)
{
  markSet.forEach(function(mark) { renderMark(mark); });
}

function markSetFromDOM()
{
  return syncDisplayMarksToDOM()
    .map(function(dispMark)
         {
           return createMarkFromDisplayMark(dispMark);
         });
}

var markID = 0;
function createMarkFromDisplayMark(dispMark)
{
  return { dispMark: dispMark,
           markID: ++markID,
           pairScore: {},
           fromRect: dispMark.data("fromRect"), 
           toRectSize: dispMark.data("toRectSize"),
           path: dispMark.data("path") };
}

function changeMarkPath(mark,path)
{
  return { dispMark: mark.dispMark,
           markID: ++markID,
           pairScore: {},
           fromRect: mark.fromRect,
           toRectSize: mark.toRectSize,
           path: path };
}

function randBetween(min,max,floor)
{
  var n = Math.random()*(max-min)+min;
  return floor?Math.floor(n):n;
}

function initializeMarkSetTowardsCenter(markSet,length)
{
  return markSet.map(function(mark)
                     {
                       var angle = angleBetweenPoints(rectCenter(mark.fromRect),
                                                      rectCenter(screenSizeRect));
                       
                       var path = [];
                       for(var i = 0; i< settings.minSegmentCount; ++i)
                       {
                         path.push({ length: length/settings.minSegmentCount,
                                     angle: 0 });
                       }
                       path[0].angle = angle;
                       return changeMarkPath(mark,path);
                     });
}


function initializeMarkSetInDirection(markSet,length,angle)
{
  return markSet.map(function(mark)
                     {                       
                       var path = [];
                       for(var i = 0; i< settings.minSegmentCount; ++i)
                       {
                         path.push({ length: length/settings.minSegmentCount,
                                     angle: 0 });
                       }
                       path[0].angle = angle;
                       return changeMarkPath(mark,path);
                     });
}


function initializeMarkSetInRandomDirection(markSet,length)
{
  return markSet.map(function(mark)
                     {                       
                       var path = [];
                       for(var i = 0; i< settings.minSegmentCount; ++i)
                       {
                         path.push({ length: length/settings.minSegmentCount,
                                     angle: 0 });
                       }
                       path[0].angle = randBetween(-Math.PI,Math.PI);
                       return changeMarkPath(mark,path);
                     });
}


function initializeFirstGenerationFromMarkSet(markSet,pullTowardsCenter)
{
  var markSetGeneration;
  if(pullTowardsCenter)
  {
    markSetGeneration = [];
    for(var i = 0; i< 5; ++i)
    {
      for(var j = 0; j<8; ++j)
      {
        markSetGeneration.push(initializeMarkSetInDirection(markSet,200+i*150,j*Math.PI/4));
      }
      markSetGeneration.push(initializeMarkSetTowardsCenter(markSet,200+i*150));
      markSetGeneration.push(initializeMarkSetInRandomDirection(markSet,200+i*150));
    }
    //markSetGeneration =  [600,650,700,750,800,850,900,950,1000]
    //  .map(function(len) { return  initializeMarkSetTowardsCenter(markSet, len); });

  }
  else
  {
    markSetGeneration =  [markSet,markSet,markSet,markSet];
  }
  markSetGeneration.generation = 0;
  return markSetGeneration;
}


function markToMarkShapes(mark)
{
  var lines = [];
  var path = mark.path;
  
  var minX = mark.fromRect.x;
  var minY = mark.fromRect.y;
  var maxX = mark.fromRect.x + mark.fromRect.width;
  var maxY = mark.fromRect.y + mark.fromRect.height;
  

  var f = rectCenter(mark.fromRect);
  f = pointFromRectPerimeterBetweenPoints(mark.fromRect,
                                          f,translatePointPolar(f,1000,path[0].angle));
  var ca = 0;
  for(var i = 0, len = path.length; i<len; ++i)
  {
    var seg = path[i];
    ca += seg.angle;
    var t = translatePointPolar(f,seg.length, ca);
    var line = makeLine(f.x,f.y,t.x,t.y,seg.length,ca);
    lines.push(line);
    f = t;

    minX = Math.min(minX, f.x, t.x);
    minY = Math.min(minY, f.y, t.y);
    maxX = Math.max(maxX, f.x, t.x);
    maxY = Math.max(maxY, f.y, t.y);
  }
  var w = mark.toRectSize.width;
  var h = mark.toRectSize.height;
  var pPoint = pointFromRectPerimeterBetweenPoints(makeRectWithCenter(0,0,w,h),
                                                   origin, 
                                                   polarToPoint(1000,ca+Math.PI));
  var extraLen = distanceBetweenPoints(pPoint,origin);

  var toCenter = translatePointPolar(t,extraLen,ca);

  var toRect = makeRectWithCenter(toCenter.x,toCenter.y,w,h);
  var toRectWithPadding = padRect(toRect,settings.toRectPadding);

  minX = Math.min(minX, toRectWithPadding.x);
  minY = Math.min(minY, toRectWithPadding.y);
  maxX = Math.max(maxX, toRectWithPadding.x+toRectWithPadding.width);
  maxY = Math.max(maxY, toRectWithPadding.y+toRectWithPadding.height);

  return { fromRect: mark.fromRect,
           lines: lines,
           toRect: toRect,
           toRectWithPadding: toRectWithPadding,
           boundsRect: makeRect(minX,minY,maxX-minX, maxY-minY),
           //markFromRect: cloneObj(mark.fromRect),
           //markPathCopy: mark.path.map(cloneObj),
           //markPathArrayCopy: mark.path.map(function(v) { return v; }),
           //markPath: mark.path,
           //markToRectSize: cloneObj(mark.toRectSize)
         };  
}


function cloneObj(obj)
{
  var newObj = {};
  for(var prop in obj) newObj[prop] = obj[prop];
  return newObj;
}

var runningTimeout;
var running = false;
function stop()
{
  clearTimeout(runningTimeout);
  runningTimeout = undefined;
  running = false;
}
var firstTime = true;
function start(markSetGeneration)
{
  stop();
  if(!markSetGeneration) markSetGeneration = initializeFirstGenerationFromMarkSet(markSetFromDOM(),firstTime);
  firstTime = false;
  run(markSetGeneration);
}

function run(markSetGeneration)
{
  running = true;
  markSetGeneration = stepGenerations(markSetGeneration,
                                           settings.generationsBeforeDisplayUpdate,
                                           settings.maxStopScore);

  renderMarkSet(markSetGeneration[0]);
  if(markSetGeneration[0].score <= settings.maxStopScore) stop(); 
  else
  {
    runningTimeout = setTimeout(function()
                                {
                                  run(markSetGeneration);
                                },settings.afterDisplayTimeout);
  }
}
function isRunning()
{
  return running;
}


var resizeTimeout;
function resize()
{
  screenSizeRect.width = $(window).width();
  screenSizeRect.height = $(window).height();
  
  syncDisplayMarksToDOM();
  if(!resizeTimeout)
  {
    if(!settings.restartOnResize) 
    {// stepGernerations is where the debugger hooks in, 
      //this allows us to update the score on resize
      stepGenerations([markSetFromDOM()],0);
    }
    else
    {
      resizeTimeout = setTimeout(function()
                                 {
                                   resizeTimeout = undefined;
                                   start();
                                 },20);
    }
  }
}

var screenSizeRect = makeRect(0,0,2000,2000);

var settings = 
      {
        mutationRate: .0075,
        toRectPadding: 0,
        maxLineLength: 300,
        minLineLength: 100,
        maxSegmentRatio: 1.5,
        maxSegmentCount: 3, // letting this value get too big will freeze the browser
        minSegmentCount: 3,
        maxSegmentAngle: Math.PI/2,
        minSegmentAngle: -Math.PI/2,
        generationSize: 50,
        topPercentToBreed: .7,
        maxStopScore: 0,
        generationsBeforeDisplayUpdate: 300,
        afterDisplayTimeout: 300,
        restartOnResize: true
      };

var scores = 
      {
        fromOverlapsTo: 50,
        toRectOffScreen: 200,
        
        lineOverlapsFrom: 90,
        lineOverlapsTo: 82,
        lineCrossesSelf: 70,
        lineSegmentOffScreen: 195,

        lineTooLong: 7,
        lineTooShort: 120,

        fromOverlapsOtherTo: 20,
        toOverlapsOtherTo: 24,
        lineOverlapsOtherLine: 150,
        lineOverlapsOtherFrom: 75,
        lineOverlapsOtherTo: 76
      };


/* TODO
 when selecting a pair to breed, make it so that they prefer more diversity

 it seems like segments (especially the first one) can be super small, which makes me thing the seg ratio is not working.


 change muttaion rate test to be generic for any settings property
 need to wait until font loads to do measurements

 better starting sets
 separate coachmarks from genetic algorithm so that you can use it separately
 ability to pre render starting points
 ability for caching of results on client

 THOUGHTS
 once we have found a valid solution we can put together a non mutated generation by breeding the starting set and the ending set, if we have a result in there that has 0 as the score then we can use it and there will be less change
 maybe we should be passing the screen size around
 if you are scoring and you get to the score of the parent (assuming you are including parents), you should just be able to quit scoring the set
 if something goes off screen, we should save it's path
 set a max size for the point at elements, if it is bigger, make it smaller and center it, or let it be part of the evolving
 */


$(window).resize(resize);

setTimeout(function()
           {
             $(window).trigger("resize");
           },300);



