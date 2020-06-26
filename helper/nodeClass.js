

class Node {
   constructor(x,y,walkable){
      this.x=x;
      this.y=y;
      if(walkable===undefined){
         this.walkable=true;
      }
      else {
         this.walkable=walkable;
      }
   }

}

