'use strict';

function breedMarkSet(markSet1,markSet2)
{
  var crossover = randBetween(0,markSet1.length-1);
  var ms = [markSet1,markSet2];
  if(Math.random() < .5) ms.reverse();
  var newMarkSet = [];
  for(var i = 0, len=markSet1.length; i<len; ++i)
  {
    newMarkSet.push(mutateMark(ms[(i<crossover)?0:1][i]));
  }
  return newMarkSet;
}

function scoreMarkSetGeneration(markSetGeneration)
{
  markSetGeneration
    .forEach(function(markSet)
             {
               markSet.score = scoreMarkSet(markSet);
             });
  markSetGeneration.scored = true;
}

function sortMarkSetGeneration(markSetGeneration)
{
  markSetGeneration.sort(function(a,b) { return a.score-b.score; });
  markSetGeneration.sorted = true;
}

function createNewMarkSetGeneration(msg)
{
  var totalScore = 0;
  var maxScore = 0;
  msg = msg.slice(0,Math.floor(msg.length * settings.topPercentToBreed));
  for(var i = 0, len = msg.length; i<len; ++i)
  {
    totalScore += msg[i].score;
    maxScore = Math.max(maxScore,msg[i].score);
  }
  totalScore = maxScore*len-totalScore;

  var percentages = [];
  var totalPercent = 0;
  for(i = 0; i<len; ++i)
  {
    var percent = (maxScore - msg[i].score)/totalScore;
    totalPercent += percent;
    percentages.push(totalPercent);
  }

  function select()
  {
    var rand = Math.random();
    for(var i = 0,len=percentages.length-1; i<len; ++i)
    {
      if(rand < percentages[i]) break;
    }
    return msg[i];
  }

  var newMSG = [];
  for(i = 0; i<settings.generationSize; ++i)
  {
    var a = select();
    var b;
    var safetyCount = 2000;
    do { b = select(); } while(a===b && safetyCount-->0);
    newMSG.push(breedMarkSet(a,b));
  }
  return newMSG;
}

function stepGenerations(markSetGeneration,num,maxStopScore)
{
  if(num === undefined) num = 1;

  if(!markSetGeneration.scored) scoreMarkSetGeneration(markSetGeneration);
  if(!markSetGeneration.sorted) sortMarkSetGeneration(markSetGeneration);

  for(var i = 0; i< num; ++i)
  {
    if(maxStopScore !== undefined && markSetGeneration[0].score <= maxStopScore) break;
    var gen = markSetGeneration.generation;
    markSetGeneration = createNewMarkSetGeneration(markSetGeneration);
    markSetGeneration.generation = gen + 1;
    scoreMarkSetGeneration(markSetGeneration);
    sortMarkSetGeneration(markSetGeneration);
  }
  return markSetGeneration;
}

function stepGenerationsAsync(markSetGeneration,num,maxStopScore,maxTime,callback)
{
  if(num === undefined) num = 1;

  if(!markSetGeneration.scored) scoreMarkSetGeneration(markSetGeneration);
  if(!markSetGeneration.sorted) sortMarkSetGeneration(markSetGeneration);

  (function go(num)
  {
    var t = new Date();
    for(var i = 0; i< num; ++i)
    {
      if(maxStopScore !== undefined && markSetGeneration[0].score <= maxStopScore) break;
      var gen = markSetGeneration.generation;
      markSetGeneration = createNewMarkSetGeneration(markSetGeneration);
      markSetGeneration.generation = gen + 1;
      scoreMarkSetGeneration(markSetGeneration);
      sortMarkSetGeneration(markSetGeneration);
      if(new Date() - t > maxTime) { ++i; break; }
    }
    num -= i;
    if(markSetGeneration[0].score <= maxStopScore || num <= 0) { if(callback) callback(markSetGeneration); }
    else setTimeout(function() { go(num); },0);
  }(num));
}







