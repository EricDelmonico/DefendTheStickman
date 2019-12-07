

class Vec2{
    constructor(x = 0, y = 0){
        this.x = x;
        this.y = y;
    }

    add(vec2){
        return new Vec2(this.x + vec2.x, this.y + vec2.y);
    }

    subtract(vec2){
        return new Vec2(this.x - vec2.x, this.y - vec2.y);
    }

    multiply(num){
        let returnVal = new Vec2(this.x * num, this.y * num);
        if (returnVal.x == 0 || returnVal.x == -0){
            returnVal.x = 0;
        }
        if (returnVal.y == 0 || returnVal.y == -0){
            returnVal.y = 0;
        }
        return returnVal;
    }

    floor(){
        return new Vec2(Math.floor(this.x), Math.floor(this.y))
    }

    normalize(){
        let len = Math.sqrt((this.x * this.x) + (this.y * this.y));
    }
}

const directions = {
    UP: new Vec2(0, -1),
    DOWN: new Vec2(0, 1),
    LEFT: new Vec2(-1, 0),
    RIGHT: new Vec2(1, 0)
}

class Level{
    // pass in all paths in the level
    constructor(enemies, paths){
        this.enemies = enemies;
        this.paths = paths;
        this.currentTime = 0;
    }

    giveNextEnemy(){
        return this.enemies.dequeue();
    }
}

// enemy does not extend PIXI.Sprite
// to maintain naming consistency
class Enemy{
    constructor(hp = 0, size = null, speed = 30, spriteURL = "images/placeholder.png"){
        this.renderer = new PIXI.Sprite(PIXI.loader.resources[spriteURL].texture);
        this.renderer.anchor.set(0, 0);// making sure pivot is consistent
        if (size == null){
            this.renderer.scale.set(1);
        }
        else{
            this.renderer.width = size.x;
            this.renderer.height = size.y;
        }
        this.position = new Vec2();
        this.bounds = new Bounds(this.position, new Vec2(this.renderer.width, this.renderer.height));
        this.alive = true;
        this.hp = hp;
        this.pathIndex = 0;
        this.speed = speed;
    }

    update(dt){
        if (!this.alive)
            return;

        let moving = this.pathIndex < paths.length;
        // code to move the enemies
        if(moving){
            let path = paths[this.pathIndex];
        let nextPath = false;
        switch(path.dir){
            case directions.UP:
                if (this.position.y <= path.endPosition.y){
                    nextPath = true;
                }
                break;
            case directions.DOWN:
                if (this.position.y >= path.endPosition.y){
                    nextPath = true;
                }
                break;
            case directions.LEFT:
                if (this.position.x <= path.endPosition.x){
                    nextPath = true;
                }                
                break;
            case directions.RIGHT:
                if (this.position.x >= path.endPosition.x){
                    nextPath = true;
                }
                break;
        }
        if (nextPath){
            this.pathIndex++;
        }

        if (dt != undefined && this.pathIndex < paths.length)
            this.position = this.position.add(paths[this.pathIndex].dir.multiply(this.speed).multiply(dt));
        }
        else{
            // damage the player
        }

        this.renderer.position = this.position;
        this.bounds.position = this.position;
        this.bounds.update();
    }

    doDamage(damage){
        this.hp -= damage;

        if (this.hp <= 0){
            this.alive = false;
            this.hp = 0;
        }
    }
}

class Bounds{
    constructor(position = new Vec2(0, 0), size = new Vec2(10, 10)){
        this.size = size;
        this.position = position;
        this.max = position.add(size);
        this.min = position;
    }

    update(){
        this.min = this.position;
        this.max = this.position.add(this.size);
    }

    contains(pos){
        if (pos == null)
            return false;

        if (pos.x > this.max.x)
            return false;
        if (pos.x < this.min.x)
            return false;
        if (pos.y < this.min.y)
            return false;
        if (pos.y > this.max.y)
            return false;

        return true;
    }
}

// rectangle does not
// extend PIXI.Graphics
// so I can use my own
// Vec2 functionality
class Rectangle {
    constructor(position = new Vec2(0, 0), size = new Vec2(10, 10), 
                color = 0xFFFFFF, lineColor = color,
                anchor = new Vec2(0, 0)){
        this.renderer = new PIXI.Graphics();
        // fields
        this.bounds = new Bounds(position, size);
        this.position = position;
        // Rendering the rect
        this.createRect(position, size, color, lineColor, anchor);
    }

    createRect(position, size, color, lineColor, anchor){
		this.renderer.beginFill(color);
		this.renderer.lineStyle(3, lineColor, 1);
		this.renderer.drawRect(anchor.x, anchor.y, size.x, size.y);
		this.renderer.endFill();
		this.renderer.x = position.x;
        this.renderer.y = position.y;
    }

    update(){
        this.renderer.position = this.position;
        this.bounds.position = this.position;
        this.bounds.update();
    }

    intersects(rect)
    {
        if (rect == null)
            return false;

        let b1 = this.bounds;
        let b2 = rect.bounds;

        // is object 2 to the left of object 1?
        if (b1.min.x > b2.max.x)
            return false;
        // Right?
        if (b1.max.x < b2.min.x)
            return false;
        // Below?
        if (b1.max.y < b2.min.y)
            return false;
        // Above?
        if (b1.min.y > b2.max.y)
            return false;

        // inside?
        return true;
    }

    contains(pos){
        return this.bounds.contains(pos);
    }
}

class Queue{
    constructor(){
        this.array = [];
    }

    enqueue(data){
        this.array.push(data)
    }

    dequeue(){
        return this.array.shift();
    }

    peek(){
        return this.array[this.array.length - 1];
    }
}

// tile inherits from PIXI.Graphics for speed,
// unlike Enemy and Rectangle
class Tile extends PIXI.Graphics{
    constructor(position = new Vec2(), size = new Vec2(40, 40), onclick = null){
        super();
        this.createRect(position, size, 0x999999);
        this.bounds = new Bounds(position, size);
        if (onclick != null){
            this.onclick = onclick;
        }
    }

    createRect(position, size, color){
        let lineColor = color - 0x222222;
		this.beginFill(color);
		this.lineStyle(1, lineColor, 1);
		this.drawRect(0, 0, size.x, size.y);
		this.endFill();
		this.x = position.x;
        this.y = position.y;
    }

    update(mousePos){
        if (this.bounds.contains(mousePos)){
            this.tintTile();
            hoveredTile = this;
        }
        else{
            this.untintTile()
        }
    }

    tintTile(){
        this.tint = 0xAAAAAA;
    }
    
    untintTile(){
        this.tint = 0xFFFFFF;
    }
}

class PathRenderer extends PIXI.Sprite{
    constructor(position = new Vec2(), size = new Vec2(tileDimension, tileDimension)){
        super(PIXI.loader.resources["images/dirtPath.png"].texture);
        this.anchor.set(0, 0);// making sure pivot is consistent
        this.width = size.x;
        this.height = size.y;
        this.x = position.x;
        this.y = position.y;
    }
}

class Path {
    constructor(direction, length){
        this.dir = direction;
        this.len = length;
        this.startPosition = new Vec2();
        this.endPosition = new Vec2();
    }
}