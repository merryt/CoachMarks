'use strict';

var display = $(".coachmarks");

var useSVG = true;
var useHTML = true;
/****** SVG **************/


var svgElem;
function setupSVG()
{
  svgElem = d3.select(display[0]).append("svg");


  var chalkFilter = svgElem.append("filter").attr({ id: "chalk1", height: 2, width: 1.6, x: -.3, y: -.5,
                                  'color-interpolation-filters':"sRGB" });
  chalkFilter.append("feTurbulence")
    .attr({ baseFrequency: 2.32065, seed: 115, result: "result1",numOctaves: 1, type: "turbulence" });
  chalkFilter.append("feOffset")
    .attr({ result: "result2", dx: -5, dy: -5 });
  chalkFilter.append("feDisplacementMap")
    .attr({ scale: 5, in:"SourceGraphic", in2: "result1", xChannelSelector: "R", yChannelSelector: "G" });
  chalkFilter.append("feGaussianBlur")
    .attr({ stdDeviation: .7169 });  
}

function svgPositionPath(path,pos)
{
  path.attr("transform","translate("+pos.left+","+pos.top+")");
}
function svgRenderPath(path,pointSet,dontAnimate)
{
  if(pointSet !== path.attr("d"))  
  {
    if(!dontAnimate) path = path.transition().duration(300);
    path.attr("d",pointSet);
  }
}

if(useSVG) setupSVG();

/********************/


function elementToRect(el)
{
  var pos = el.offset();
  return makeRect(pos.left, pos.top, 
                  el.outerWidth(),el.outerHeight());
}

function elOfClass(c) { return $("<div/>", { 'class': c }); }

function createDisplayMark(el)
{
  var dispMark =  elOfClass("coachmark").appendTo(display);
  dispMark.data("path",[{ length: 100, angle: 0}]);
  var from = elOfClass("fromObj").appendTo(dispMark);
  var to = elOfClass("toObj").appendTo(dispMark);
  var text = elOfClass("text").appendTo(to);
  if(useSVG) 
  {
    dispMark.data("svgPath",svgElem.append("path").attr("class","line").attr("fill","none"));
    dispMark.data("svgHead",svgElem.append("path").attr("class","head").attr("fill","none"));
  }
  el.data("dispMark",dispMark);
  dispMark.data("pointAtElement",el);
  return dispMark;
}

function removeDisplayMark(dispMark)
{
  if(useSVG) 
  {
    dispMark.data("svgHead").remove();
    dispMark.data("svgPath").remove();
  }
  dispMark.data("pointAtElement").removeData("dispMark");
  dispMark.removeData("pointAtElement");
  dispMark.remove();
}

function renderDisplayMarkFrom(dispMark,rect)
{
  dispMark.data("fromRect",rect);
  var center = { left: rect.x + rect.width/2,
                 top: rect.y + rect.height/2 };
  dispMark.css(center);
  dispMark.children(".fromObj")
    .css({ width: rect.width,
           height: rect.height,
           'margin-left': -rect.width/2,
           'margin-top': -rect.height/2});
  
  if(useSVG) 
  {
    dispMark.data("svgPath").attr("transform","translate("+center.left+","+center.top+")");
    dispMark.data("svgHead").attr("transform","translate("+center.left+","+center.top+")");
  }
}

function renderDisplayMarkText(dispMark,text)
{
  var textObj = dispMark.find(".toObj .text");  
  textObj.text(text); 
  var rect = elementToRect(dispMark.find(".toObj .text"));
  rect.x = 0;
  rect.y = 0;
  dispMark.data("toRectSize",rect);
}

function renderDisplayMarkPath(dispMark,mark,dontAnimate)
{
  if(useSVG) renderDisplayMarkPathSVG(dispMark,mark,dontAnimate);
  if(useHTML) renderDisplayMarkPathHTML(dispMark,mark);
}


function renderDisplayMarkPathSVG(dispMark,mark,dontAnimate)
{
  var rc = rectCenter(mark.fromRect);
  var path = mark.path;
  dispMark.data("path",path);

  var shapes = markToMarkShapes(mark);
  var lines = shapes.lines;


  var headArr = [];
  // arrow head
  function r() { return Math.PI/5 * (Math.random()-.5); }
  var headAngle = Math.PI/4; // <
  var headLength = 15;
  var a = lines[0].angle;
  var p0 = lineStartPoint(lines[0]);
  
  var d3Smooth = d3.svg.line().interpolate("basis")
        .x(function(v) { return v.x - rc.x; })
        .y(function(v) { return v.y - rc.y; });

  svgRenderPath(dispMark.data("svgHead"),
                d3Smooth([p0,
                          translatePointPolar(p0,headLength/2, a + headAngle/2 + r()),
                          translatePointPolar(p0,headLength, a + headAngle/2)])
                +" "+ 
                d3Smooth([p0,
                          translatePointPolar(p0,headLength/2, a - headAngle/2 + r()),
                          translatePointPolar(p0,headLength, a - headAngle/2)]),dontAnimate);

 

  var pathArr = lines.map(function(line) { return lineEndPoint(line); });
  pathArr.unshift(p0);

  svgRenderPath(dispMark.data("svgPath"), d3Smooth(pathArr),dontAnimate);


  var toCenter = rectCenter(shapes.toRect);

  var toObj = d3.select(dispMark.find(".toObj")[0]);
  if(!dontAnimate) toObj = toObj.transition().duration(300);
  toObj.style({ left: toCenter.x - rc.x, top: toCenter.y - rc.y });
}

function renderDisplayMarkPathHTML(dispMark,mark)
{
  var lines = markToMarkShapes(mark).lines;
  var ptr = dispMark;
  var totalAngle = 0;
  for(var i = 0, len = lines.length; i<len; ++i)
  {
    var seg = lines[i];
    var lineObj = ptr.children(".lineObj");
    if(lineObj.length === 0) lineObj = elOfClass("lineObj").appendTo(ptr).append(elOfClass("handleObj"));
    lineObj.css({ 'left':'','top': '',
                  'width': seg.length,
                  '-webkit-transform': 'rotate(' + (seg.angle-totalAngle) + 'rad)' });
    ptr = lineObj;
    totalAngle = seg.angle;
  }
  var sp = lineStartPoint(lines[0]);
  var rc = rectCenter(mark.fromRect);
  dispMark.children(".lineObj").css({ left: sp.x - rc.x, top: sp.y - rc.y });
  ptr.children(".lineObj").remove();
  dispMark.data("path",mark.path);
}

function isVisibleAndOnScreen(el)
{
  if(!el.is(":visible")) return false;
  return rectsIntersect(elementToRect(el),screenSizeRect);
}

function syncDisplayMarkToElement(el)
{
  var dispMark = el.data("dispMark");
  var rect = elementToRect(el);
  if(isVisibleAndOnScreen(el))
  {
    if(!dispMark) dispMark = createDisplayMark(el);
    renderDisplayMarkFrom(dispMark,rect);
    renderDisplayMarkText(dispMark,el.attr("data-coachmark"));
    return dispMark;
  }
  else
  {
    if(dispMark) removeDisplayMark(dispMark);
    return undefined;
  }
}

function syncDisplayMarksToDOM(el)
{
  return (el || $("body")).find("[data-coachmark]")
    .map(function()
          { 
            return syncDisplayMarkToElement($(this)); 
          }).get();          
}













