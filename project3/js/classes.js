class Path{
    constructor(startPos = 0, endPos = 0){
        this.startPos = pos1;
        this.endPos = pos2;
    }

    createPath(){

    }
}

class Rectangle{
    constructor(position = new Vec2(0, 0), size = new Vec2(10, 10), color = 0xFFFFFF){
        const square = new PIXI.Graphics();
		square.beginFill(color);
		square.lineStyle(3, color, 1);
		square.drawRect(-20, -20, size.x, size.y);
		square.endFill();
		square.x = position.x;
		square.y = position.y;
    }
}

class Vec2{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}