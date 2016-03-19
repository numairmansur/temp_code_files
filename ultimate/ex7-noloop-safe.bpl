//#Safe ex7-noloop-safe.bpl
//author: nutz@informatik.uni-freiburg.de
procedure foo()
{
  var y: int;
  var x: int;
  var z: int;
  x := 2;
  z := 4;
  y := 0;

  if(y==0) 
  {
    x := 1;
  }
  else 
  {
    y := 2;
    y := 3;
    y := 4;
  }
  assert(x == 0);	
}
