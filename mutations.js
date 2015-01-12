

function createRandomByteArrayGenerator(byteCount,bitProbability,returnFalseWhenAllZero)
{
  function possibleVariations(numberOfElements, numberOfOnElements)
  {
    // calculating numberOfElements! / (numberOfElements-numberOfOnElements)! / numberOfOnElements!
    // so we are figuring out how many different ways you can have exactly a certain number of 1s in an array
    var p = 1;
    for(var i = numberOfElements, end = numberOfElements - numberOfOnElements; i>end; --i) p*= i;
    var perm = 1;
    for(var n = numberOfOnElements; n>=2;--n) perm*=n;
    return p/perm;
  }

  //we want to generate an array of bytes, where each bit in each byte has a certain probability of being 1
  //the naive approach for this winds up wasting a lot of time, especially if the probability is low
  //so what we do is we calculate the odds that the array will be all 0s, which will happen a lot of the time
  //then when it comes time to generate the array we get a random number, and if it is less than the odds for all 0s
  //we just skip the rest and return an array of all 0s, saving 8 x byteCount calls to Math.random()

  //the odds array has the odds for the likely hood of each scenario, so oddsArray[0] contains the odds that
  //the array has no on bits, oddsArray[1] contains the odds that the array has exactly 1 on bit,
  //oddsArray[2] contains the odds that the array will have 2 or less on bits, etc
  
  var bitCount = 8 * byteCount;
  var cumm = 0;
  var oddsArray = [];
  for(var i = 0; i<bitCount; ++i)
  {
    //calculate the probability that the array has exactly i on bits
    var odds = Math.pow(bitProbability,i) // odds of i being on bits
          * Math.pow(1-bitProbability,bitCount-i) //odds of bitCount-i being off bits
          * possibleVariations(bitCount,i); // number of different ways i bits can be on in the array
    // add the odds of all the ones before it
    cumm += odds;
    oddsArray.push(cumm);
  }

  function generator()
  {
    generatorUses++;
    var byteArray = [];
    for(var i = 0; i<byteCount; ++i) byteArray.push(0);
    var v = Math.random();
    if(v <= oddsArray[0]) 
    {
      if(returnFalseWhenAllZero) return false;
      else return byteArray;
    }

    for(var count = 1; v>oddsArray[count]; ++count) {} //figure out how many bits are going to be on
    var safetyCount = 2000;
    while(safetyCount-->0 && count > 0)
    {
      //picking a random byte and a random bit in that byte to be flipped to a one
      var byteIndex = Math.random() * byteCount >>> 0;
      var bitIndex = Math.random() * 8 >>> 0;
      var byteDec = 1 << bitIndex;
      if(byteArray[byteIndex] !== byteDec) //make sure that we don't flip the same bit
      {
        --count;
        byteArray[byteIndex] |= 1 << bitIndex; //flip that bit
      }
    }
    return byteArray;
  }
  return generator;
}
var generatorUses = 0;


var randomByteArrayGenerator;
setTimeout(function()
           {
             var bytesPerMark = 2 + 2*settings.maxSegmentCount;
             randomByteArrayGenerator = createRandomByteArrayGenerator(bytesPerMark,settings.mutationRate,true);           

           },0);


function mutateValue(num,randomByte,min,max,round)
{
  var diff = max-min;
  var b = (255*(num - min)/diff) >>> 0;
  b = Math.min(255,Math.max(0,b));
  b = b^randomByte;
  var n = (b*diff/255) + min;
  if(round) n = Math.round(n);
  return n;
}






function mutateMark(mark)
{
  var mutationBytes = randomByteArrayGenerator();
  if(!mutationBytes) return mark;

  var path = mark.path.slice();
  var segCount = path.length;
  var segCountChangeByte = mutationBytes[0];
  var newSegCount = segCount;
  if(segCountChangeByte !== 0)
  {
    newSegCount = mutateValue(segCount,segCountChangeByte,
                              settings.minSegmentCount,settings.maxSegmentCount,true);
  }
  
  var minSegLength = Infinity;
  var totalLengthChangeByte = mutationBytes[1];
  var totalLength = 0;
  for(var i = 0; i<segCount; ++i)
  {
    totalLength += path[i].length;
    minSegLength = Math.min(path[i].length,minSegLength);
  }

  var newTotalLength = mutateValue(totalLength,totalLengthChangeByte,
                                   settings.minLineLength,settings.maxLineLength,true);

  if(newSegCount !== segCount) 
  {
    var segCountChange = newSegCount - segCount;
    if(segCountChange < 0) path.length = newSegCount;
    else while(segCountChange-->0) path.push(path[path.length-1]);
  }

  
  var segmentChanges = (totalLengthChangeByte !== 0);
  if(!segmentChanges)
  {
    var len;
    for(i = 2, len= mutationBytes.length; i<len; ++i) 
    {
      if(mutationBytes[i] !== 0) 
      {
        segmentChanges = true;
        break;
      }
    }
  }


  if(segmentChanges)
  {
    var totalSegProportions = 0;
    var segProportions = [];
    for(i = 0; i<newSegCount; ++i)
    {
      var angleChangeByte = mutationBytes[2+i*2];
      var lengthProportionChangeByte =  mutationBytes[3+i*2];
      var currentSeg = path[i];
      var segProportion = currentSeg.length/minSegLength;
      var newSegProportion = segProportion;
      if(angleChangeByte !== 0 || lengthProportionChangeByte !== 0 || totalLengthChangeByte !== 0) 
      {    
        var newSeg = { angle: currentSeg.angle, length: currentSeg.length };
        path[i] = newSeg;
        if(angleChangeByte !== 0) 
        {
          var minAngle = i === 0 ? -Math.PI:settings.minSegmentAngle;
          var maxAngle = i === 0 ?  Math.PI:settings.maxSegmentAngle;
          newSeg.angle = mutateValue(currentSeg.angle,
                                     angleChangeByte,
                                     minAngle,maxAngle,false);
        }
        
        if(lengthProportionChangeByte !== 0) 
        {
          newSegProportion = mutateValue(segProportion,
                                         lengthProportionChangeByte,
                                         1,settings.maxSegmentRatio,false);
        }
      }
      segProportions[i] = newSegProportion;
      totalSegProportions += newSegProportion;
    }
    for(i = 0;i<newSegCount; ++i) 
    {
      var newLength = newTotalLength * segProportions[i]/totalSegProportions;
      if(newLength !== path[i].length) path[i] = { angle: path[i].angle, length: newLength };
    }
  }

  return changeMarkPath(mark,path);
}
