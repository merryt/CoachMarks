'use strict';

function xscoreMarkSet(markSet)
{
  var score = 0;
  var markShapesSet = markSet.map(markToMarkShapes);
  var len = markShapesSet.length;
  for(var i = 0; i<len; ++i)
  {
    var markShapes1 = markShapesSet[i];
    score += scoreMarkShapes(markShapes1);
    for(var j = i+1; j<len; ++j)
    {
      var markShapes2 = markShapesSet[j];
      if(rectsIntersect(markShapes1.boundsRect, markShapes2.boundsRect))
      {
        score += scoreMarkShapesPair(markShapes1,markShapes2);
      }
    }
  }
  return score;
}

function scoreMarkSet(markSet)
{
  var score = 0;
  var len = markSet.length;
  for(var i = 0; i<len; ++i)
  {
    var mark = markSet[i];
    var shapes = mark.shapes;
    if(shapes === undefined) 
    {
      shapes =  markToMarkShapes(mark);
      mark.shapes = shapes;
    }
    var markScore = mark.score;
    if(markScore === undefined) 
    {
      markScore = scoreMarkShapes(shapes);
      mark.score = markScore;
    } 
    score += markScore;
    for(var j = i+1; j<len; ++j)
    {
      var mark2 = markSet[j];
      var shapes2 = mark2.shapes;
      if(shapes2 === undefined) 
      {
        shapes2 = markToMarkShapes(mark2);
        mark2.shapes = shapes2;
      }
      if(rectsIntersect(shapes.boundsRect, shapes2.boundsRect))
      {
        var pairScore = mark.pairScore[mark2.markID];
        if(pairScore === undefined)
        {        
          pairScore = scoreMarkShapesPair(shapes,shapes2);
          mark.pairScore[mark2.markID] = mark2.pairScore[mark.markID] = pairScore;
        } 
        score += pairScore;
      } 
    }
  }
  return score;
}

function scoreMarkShapes(markShapes)
{
  var score = 0;
  score += scores.fromOverlapsTo * rectsIntersect(markShapes.fromRect,markShapes.toRectWithPadding);
  score += scores.toRectOffScreen * !rectContainsRect(screenSizeRect,markShapes.toRectWithPadding);

  var msLines = markShapes.lines;
  var msLen = msLines.length;

  var totalLength = 0;
  for(var i = 0; i<msLen; ++i)
  {
    var msLine1 = msLines[i];

    if(i > 0) score += scores.lineOverlapsFrom * lineIntersectsRect(msLine1,markShapes.fromRect);
    if(i < msLen-1)  
    {
      score += scores.lineSegmentOffScreen * !pointIsInsideRect(makePoint(msLine1.tx,msLine1.ty),
                                                                screenSizeRect);
      score += scores.lineOverlapsTo * lineIntersectsRect(msLine1,markShapes.toRectWithPadding);
    }
    for(var j = i+2; j<msLen; ++j) // i+2 since i+1 would be the next segment which can't overlap
    {
      var msLine2 = msLines[j];
      score += scores.lineCrossesSelf * linesIntersect(msLine1,msLine2);
    }
  }

  return score;
}

function scoreMarkShapesPair(markShapes1, markShapes2)
{
  var score = 0;
  score += scores.fromOverlapsOtherTo * rectsIntersect(markShapes1.fromRect,markShapes2.toRectWithPadding);
  score += scores.fromOverlapsOtherTo * rectsIntersect(markShapes2.fromRect,markShapes1.toRectWithPadding);
  score += scores.toOverlapsOtherTo * rectsIntersect(markShapes1.toRectWithPadding,markShapes2.toRectWithPadding);

  var ms1Lines = markShapes1.lines;
  var ms2Lines = markShapes2.lines;
  var ms1Len = ms1Lines.length;
  var ms2Len = ms2Lines.length;
  
  for(var i = 0; i<ms1Len; ++i)
  {
    var ms1Line = ms1Lines[i];

    score += scores.lineOverlapsOtherFrom*lineIntersectsRect(ms1Line,markShapes2.fromRect);
    score += scores.lineOverlapsOtherTo*lineIntersectsRect(ms1Line,markShapes2.toRectWithPadding);
    for(var j = 0; j<ms2Len; ++j)
    {
      var ms2Line = ms2Lines[j];
      score += scores.lineOverlapsOtherLine*linesIntersect(ms1Line,ms2Line);

      if(i === 0)
      {
        score += scores.lineOverlapsOtherFrom*lineIntersectsRect(ms2Line,markShapes1.fromRect);
        score += scores.lineOverlapsOtherTo*lineIntersectsRect(ms2Line,markShapes1.toRectWithPadding);
      }
    }
  }

  return score;
}

