var startTime;
var lastMarkSetGeneration;
var oldStart = start;
var oldStepGenerations = stepGenerations;
var oldRun = run;
var currentDisplayIndex = 0;

var step = function(count)
{
  stop();
  startTime = new Date();
  lastMarkSetGeneration = stepGenerations(lastMarkSetGeneration,count,-1);
  renderMarkSet(lastMarkSetGeneration[currentDisplayIndex]); 
};

var start = function(msg)
{
  startTime = new Date();
  oldStart(msg);
};

var run = function(msg)
{
  oldRun(msg);
  renderMarkSet(lastMarkSetGeneration[currentDisplayIndex]);
};

var stepGenerations = function(msg,a,b)
{
  msg = oldStepGenerations(msg,a,b);
  lastMarkSetGeneration = msg;
  var time = new Date() - startTime;
  var info = {};
  displayInfo({ score: msg[currentDisplayIndex].score, 
                gen: msg.generation, 
                totalTime: time,
                '\ndispTime': ((time/(msg.generation || 1))*settings.generationsBeforeDisplayUpdate).toFixed(2)+"ms",
                timePerGen: (time/(msg.generation || 1)).toFixed(2)+"ms",
                '\nscores': msg.map(function(v,index) { return ((index === currentDisplayIndex)?"*":"") + v.score; }).join(",") });
  return msg;
};



$(".coachmarks").append($("<div/>",{ 'class': "info" }));

$(".coachmarks").on("dblclick",".coachmark",
                    function()
                    {
                      $(this).toggleClass("selected");
                    });


$(".coachmarks").on("mousedown",".coachmark.selected .lineObj .handleObj",
                    function(e)
                    {
                      var lineObj = $(this).parent();
                      lineObj.addClass("selected");

                      var dispMark = lineObj.closest(".coachmark");
                      var mark = createMarkFromDisplayMark(dispMark);
                      var markShapes = markToMarkShapes(mark);
                      var index = lineObj.parents(".lineObj").length;

                      var selectedPathSegment = mark.path[index];
                      var selectedLine = markShapes.lines[index];
                      var parentAngle = (index === 0) ? 0 : markShapes.lines[index-1].angle;
                      var angleOrigin = (index === 0) ? rectCenter(mark.fromRect) : lineStartPoint(selectedLine);
                      var lengthOrigin = lineStartPoint(selectedLine);
                      function move(e)
                      {
                        if(index === 0) lengthOrigin = lineStartPoint(markToMarkShapes(mark).lines[0]);
                        var mousePoint = makePoint(e.pageX,e.pageY);                        
                        selectedPathSegment.length = distanceBetweenPoints(lengthOrigin,mousePoint);
                        selectedPathSegment.angle = angleBetweenPoints(angleOrigin,mousePoint) - parentAngle;
                        renderMark(mark,true);   
                        //mark.shapes = undefined;
                        //mark.score = undefined;
                        //mark.pairScore = [];
                        displayInfo({ score: scoreMarkSet(markSetFromDOM()),
                                      path: humanizePath(mark.path)});
                      }

                      function end(e)
                      {
                        lineObj.removeClass("selected");
                        $(document)
                          .off("mousemove",move)
                          .off("mouseup",end);
                        lastMarkSetGeneration = initializeFirstGenerationFromMarkSet(markSetFromDOM(),false);
                        step(0);
                        return false;
                      }

                      $(document)
                        .on("mousemove",move)
                        .on("mouseup",end);
                      return false;
                    });



function displayInfo(info)
{
  var txt = "";
  for(var prop in info)
  {
    txt += prop+": "+info[prop] + "\t ";
  }
  $(".coachmarks .info").text(txt);
}

$("[data-coachmark]").each(function() { $(this).attr("data-xcoachmark",$(this).attr("data-coachmark")); }); 

$(document).on("keydown",
               function(e)              
               { 
                 var code = e.keyCode;
                 var key = String.fromCharCode(code).toLowerCase();
                 var num = parseInt(key,10);
                 if(key === "r") settings.restartOnResize = !settings.restartOnResize;
                 else if(key === "s") { if(runningTimeout) stop(); else start();  }
                 else if(key === "a") $(".coachmarks .coachmark").toggleClass("selected");
                 else if(key === "g") step(1);
                 else if(1 <= num && num <= 9) step(num * 100);
                 else if(key === "c") { $(".coachmarks").toggleClass("chalk");  }
                 else if(key === "m") { $(".coachmarks").toggleClass("marquee");  }
                 else if(key === "h") { $(".coachmarks").toggleClass("noHead");  }
                 else if(key === "0")
                 {
                   lastMarkSetGeneration = initializeFirstGenerationFromMarkSet(markSetFromDOM(),true);
                   step(0);
                 }
                 else if(code === 219 /* [ */) 
                 {
                   var el = $("[data-coachmark]").last();
                   if(el.length === 0 && el.data("dispMark")) return;
                   var wasRunning = isRunning();
                   stop();
                   removeCoachmark(el);
                   if(wasRunning) run(lastMarkSetGeneration); else step(0);
                 }
                 else if(code === 221 /* ] */)
                 {
                   var el = $("[data-xcoachmark]:not([data-coachmark])").first();
                   if(el.length === 0) return;
                   var wasRunning = isRunning;
                   stop();
                   reAddCoachmark(el);
                   if(wasRunning) run(lastMarkSetGeneration); else step(0);
                 }
                 else if(code === 37) //left
                 {
                   if(--currentDisplayIndex < 0) currentDisplayIndex = 0;
                   if(!isRunning()) step(0);
                 }
                 else if(code === 39) //right
                 {                   
                   if(++currentDisplayIndex >= lastMarkSetGeneration.length) currentDisplayIndex = lastMarkSetGeneration.length-1;
                   if(!isRunning()) step(0);
                 }
                 else if(code === 38) //up
                 {
                 }
                 else if(code === 40) //down
                 {
                 }
               });


function issues()
{
  var arr = [];
  var markSet = markSetFromDOM();
  for(var i = 0,len=markSet.length; i<len; ++i)
  {
    var m1 = markSet[i];
    var s1 = markToMarkShapes(m1);
    var ss = scoreMarkShapes(s1);
    if(ss > 0) arr.push(m1);
    for(var j = i+1; j<len; ++j)
    {
      var m2 = markSet[j];
      var s2 = markToMarkShapes(m2);
      var sp = scoreMarkShapesPair(s1,s2);
      if(sp > 0) arr.push([m1,m2]);      
    }
  }
  return arr;
}



function rectToString(r)
{
  return "[ rect " + r.x + "," + r.y + " "+r.width+"x"+r.height+" ]";
}

function lineToString(l)
{
  return "[ line " + l.fx + "," + l.fy + " -> " + l.tx + "," + l.ty +" ]";
}

function pathToString(p)
{
  return "[ path " + p.map(segmentToString).join(" ") + " ]";
}

function segmentToString(s)
{
  return "(" + s.length + " @ " + s.angle + " )";
}
function markToString(mark)
{
  return rectToString(mark.fromRect)
    + "\t" + 
    + "\t" + rectToString(mark.toRectSize);
}

function logMarkSet(markSet)
{
  console.table(markSet
                .map(function(mark)
                     {
                       return { from: rectToString(mark.fromRect),
                                path: mark.path.map(pathToString).join(" "),
                                to: rectToString(mark.toRectSize) };
                     }));
}


function logMarkSetShapes(markSet)
{
  console.table(markSet
                .map(function(mark)
                     {
                       var ms = markToMarkShapes(mark);
                       return { from: rectToString(ms.fromRect),
                                lines: ms.lines.map(lineToString).join(" "),
                                to: rectToString(ms.toRect) };
                     }));
}


function logSelected()
{
  logMarkSet(selectedMarks());
}

function logSelectedShapes()
{
  logMarkSetShapes(selectedMarks());
}


function selectedMarks()
{
  return $(".coachmark.selected")
    .map(function()
         {
           return $(this).data("lastSyncMark");
         }).get();
}


function selectedMarkShapes()
{
  return $(".coachmark.selected")
    .map(function()
         {
           return markToMarkShapes(createMarkFromDisplayMark($(this)));
         }).get();
}

function humanizePath(p)
{
  return p.map(function(s)
               {
                 return Math.round(s.length) + "<" + Math.round((3600 + 180*s.angle/Math.PI) % 360);
               }).join(" ");
}

function reAddCoachmark(el)
{
  el.attr("data-coachmark",el.attr("data-xcoachmark"));
  var m = createMarkFromDisplayMark(syncDisplayMarkToElement(el));
  lastMarkSetGeneration.forEach(function(markSet)
                                {
                                  markSet.push(m);
                                });
}

function removeCoachmark(el)
{
  var dispMark = el.data("dispMark");
  lastMarkSetGeneration
    .forEach(function(markSet)
             {
               var index = markSet.map(function(mark) { return mark.dispMark === dispMark; }).indexOf(true);
               markSet.splice(index,1);
             });
  el.removeAttr("data-coachmark");
  removeDisplayMark(dispMark); 
}


var testInitialMarkSet = 
      [{"fromRect":{"x":30,"y":19,"width":108,"height":52},
        "toRectSize":{"x":0,"y":0,"width":99,"height":30},
        "path":[]},
       {"fromRect":{"x":622,"y":30,"width":30,"height":30},
        "toRectSize":{"x":0,"y":0,"width":109,"height":30},
        "path":[]},
       {"fromRect":{"x":662,"y":30,"width":30,"height":30},
        "toRectSize":{"x":0,"y":0,"width":118,"height":30},
        "path":[]},
       {"fromRect":{"x":702,"y":30,"width":30,"height":30},
        "toRectSize":{"x":0,"y":0,"width":113,"height":30},
        "path":[]},
       {"fromRect":{"x":742,"y":30,"width":30,"height":30},
        "toRectSize":{"x":0,"y":0,"width":114,"height":30},
        "path":[]},
       {"fromRect":{"x":782,"y":30,"width":30,"height":30},
        "toRectSize":{"x":0,"y":0,"width":114,"height":30},
        "path":[]},
       {"fromRect":{"x":15,"y":144,"width":175,"height":24},
        "toRectSize":{"x":0,"y":0,"width":150,"height":46},
        "path":[]},
       {"fromRect":{"x":215,"y":105,"width":151,"height":151},
        "toRectSize":{"x":0,"y":0,"width":119,"height":30},
        "path":[]},
       {"fromRect":{"x":481,"y":370.5,"width":20,"height":20},
        "toRectSize":{"x":0,"y":0,"width":109,"height":30},
        "path":[]},
       {"fromRect":{"x":631.5,"y":370.5,"width":20,"height":20},
        "toRectSize":{"x":0,"y":0,"width":111,"height":30},
        "path":[]}];

function testCurrentSettings(callback)
{
  screenSizeRect.width = 832;
  screenSizeRect.height = 646;
  stepGenerationsAsync(initializeFirstGenerationFromMarkSet(testInitialMarkSet,true),
                       1000,0,1000,callback);
}

function test(callback)
{
  var runs = 0;
  var totalGens = 0;
  var t = new Date();
  var startTime = t;
  (function go()
   {
     t = new Date();
     testCurrentSettings(function(msg)
                         {
                           if(msg[0].score !== 0) console.log("FAIL!!!");
                           //renderMarkSet(msg[0]);
                           runs++;
                           totalGens += msg.generation;
                           console.log(runs,"gens:",msg.generation, " time:",new Date() - t);
                           if(runs < 100) go();
                           else 
                           {
                             console.log("averageGens:",runs,(totalGens/runs), " avgTime:",(new Date() - startTime)/runs);
                             if(callback) callback();
                           }
                         });
   }());

}

function superTest()
{
  var rateArr = [.00375, .004, .00425, .0045, .00475, .005, .00525, .0055, .00575];
  
  (function go()
   {
     var rate = rateArr.shift();
     if(rate)
     {
       settings.mutationRate = rate;
       console.log("TESTS FOR",rate);
       test(function()
            {
              go();
            });
     }
   }());
}

function timeTest() //NOTE: this is a terrible way to judge
{
  screenSizeRect.width = 832;
  screenSizeRect.height = 646;

  var firstGen = initializeFirstGenerationFromMarkSet(testInitialMarkSet,true);
  firstGen = stepGenerations(firstGen,0,0);
  var startScore = firstGen[0].score;

  var times = 10;
  var timeAllotted = 100;
  var totalDiff = 0;
  for(var i = 0; i<times; ++i)
  {
    var startTime = new Date();
    var gen = firstGen;
    while(new Date() - startTime < timeAllotted) gen = stepGenerations(gen,1,0);
    var actualTime = new Date() - startTime;
    totalDiff += startScore - gen[0].score;
  }
  return totalDiff/times;
}

function testMutationRates(rates)
{
  return rates.map(function(r)
                   {
                     settings.mutationRate = r;
                     return { rate: r, amount: timeTest() };
                   });
}


function numbersFrom(start,end,count)
{
  var num = start;
  var by = (end - start)/(count -1);
  var arr = [];
  while(count --> 0) 
  {
    arr.push(num);
    num += by;
  }
  return arr;
}







