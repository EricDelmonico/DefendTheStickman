"use strict";
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
        let len = this.length();
        return new Vec2(this.x / len, this.y / len);
    }

    equals(vec2){
        return (vec2.x == this.x && vec2.y == this.y);
    }

    vecFromThisToVec(vec2){
        return vec2.subtract(this);
    }

    length(){
        let lenSqrd = (this.x * this.x) + (this.y * this.y);
        return Math.sqrt(lenSqrd);
    }
}

const directions = {
    UP: new Vec2(0, -1),
    DOWN: new Vec2(0, 1),
    LEFT: new Vec2(-1, 0),
    RIGHT: new Vec2(1, 0)
}

const enemyTypes = {
    FAST: [70, new Vec2(50-1,50-1), 120, 8],
    STRONG: [200, new Vec2(50-1,50-1), 25, 15],
    NORMAL: [100, new Vec2(50-1,50-1), 40, 10]
}

class Level{
    // pass in all paths in the level
    constructor(enemies, paths, waves, levelNumber){
        this.enemies = enemies;
        this.paths = paths;
        this.currentTime = 0;
        this.waves = waves;
        this.levelNumber = levelNumber;
        this.currentTime = 0;
        this.enemySpawnInterval = 1;
        this.buyPhaseTime = 20;
        this.timeInBuyPhase = 0;
        this.waveDry = false;
        this.buyPhase = false;
        this.buyPhaseTimer = new HealthBar(new Vec2(600, 10), this.buyPhaseTime * 20);
        this.currentWave = 0;
        waveText.text = "Wave: " + this.currentWave;
    }

    update(dt){
        this.currentTime += dt;
        if (this.currentTime > this.enemySpawnInterval){
            this.spawnNewEnemy();
            this.currentTime = 0;
        }

        if (!this.buyPhase){
            this.buyPhase = this.waveDry && enemies.length == 0;
            if (this.buyPhase) gameScene.addChild(this.buyPhaseTimer);
        }
        if (this.buyPhase){
            this.timeInBuyPhase += dt;
            this.buyPhaseTimer.update(this.buyPhaseTimer.position,
                                      this.timeInBuyPhase * 20);
            if (this.timeInBuyPhase > this.buyPhaseTime){
                this.timeInBuyPhase = 0;
                this.buyPhase = false;
                this.waveDry = false;
                gameScene.removeChild(this.buyPhaseTimer);
            }
        }
    }

    giveNextEnemy(){
        if (this.enemies.length() == 0){
            // need new wave soon
            this.waveDry = true;
            this.enemies = this.makeNewEnemyWave();
        }
        if (this.waveDry || this.buyPhase){
            return null;
        }
        return this.enemies.dequeue();
    }

    makeNewEnemyWave(){
        this.currentWave++;
        waveText.text = "Wave: " + this.currentWave;
        let newWave = new Queue();
        let enemyNumber = Math.floor(Math.random() * this.currentWave * 2) + this.currentWave;
        let rng = Math.floor(Math.random() * 3);
        let e = null;
        switch (rng){
            case 0:
                e = enemyTypes.NORMAL;
                this.enemySpawnInterval = 3;
                break;
            case 1:
                e = enemyTypes.FAST;
                this.enemySpawnInterval = 1.5;
                break;
            case 2:
                e = enemyTypes.STRONG;
                this.enemySpawnInterval = 5;
                break;
        }
        for (let i = 0; i < enemyNumber; i++){
            let newEnemy = new Enemy(e[0], e[1], e[2], e[3]);
            newEnemy.position = new Vec2(pathCoords[0].x * tileDimension, 
                                         pathCoords[0].y * tileDimension);
            newEnemy.position = newEnemy.position.add(paths[0].dir.multiply(-tileDimension));
            newEnemy.prevEnemy = newWave.peek();
            if (newEnemy.prevEnemy != null){
                newEnemy.prevEnemy.nextEnemy = newEnemy;
            }
            newWave.enqueue(newEnemy);
        }
        return newWave;
    }

    spawnNewEnemy(){
        let newEnemy = this.giveNextEnemy();
        // don't push null to the stage
        if (newEnemy != null){
            enemies.push(newEnemy);
        }
    }
}

class Enemy{
    constructor(hp = 0, size = null, speed = 40, damage = 10, spriteURL = "images/placeholder.png"){
        this.renderer = new PIXI.Sprite(getTexture(spriteURL));
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
        this.moving = true;
        this.reachedEnd = false;
        this.prevEnemy = null;
        this.nextEnemy = null;
        this.damage = damage;
        this.healthBar = new HealthBar(this.position.add(new Vec2(this.bounds.size.x / 2, 0)), this.hp);
    }

    update(dt){
        if (!this.alive)
            return;
        
        this.moving = this.pathIndex < paths.length;
        this.reachedEnd = !this.moving;
        if (this.prevEnemy != null){
            if (!this.prevEnemy.alive){
                this.prevEnemy = null;
            }
            else{
                this.moving = this.moving && !this.prevEnemy.bounds.intersects(this.bounds);
            }
        }

        // code to move the enemies
        if(this.moving){
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
        if(this.reachedEnd){
            // damage the player
            player.doDamage(this.damage * dt);
        }

        this.renderer.position = this.position;
        this.bounds.position = this.position;
        this.bounds.update();
        this.healthBar.update(this.position.add(new Vec2(this.bounds.size.x / 2, 0)), this.hp);
    }

    doDamage(damage){
        if (!(damage > 0))
            return;

        this.hp -= damage;

        if (this.hp <= 0){
            this.alive = false;
            this.hp = 0;
            if (this.nextEnemy != null && this.prevEnemy != null){
                this.nextEnemy.prevEnemy = this.prevEnemy;
            }
            player.changeMoneyBy(50);
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

    intersects(b2)
    {
        if (b2 == null)
            return false;

        let b1 = this;

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
}

class HealthBar extends PIXI.Graphics{
    constructor(position, initialHealth){
        super();
        this.initialHealth = initialHealth;
        this.currentHealth = initialHealth;
        // Rendering the rect
        this.size = new Vec2(initialHealth * 0.5, 10);
        this.createRect(position);
    }

    createRect(position){
		this.beginFill(0xFF0000);
		this.lineStyle(1, 0x000000, 1);
		this.drawRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
        this.endFill();
        this.beginFill(0x00FF00);
		this.lineStyle(1, 0x000000, 1);
        this.drawRect(-this.size.x / 2, -this.size.y / 2, 
                      this.size.x * this.currentHealth / this.initialHealth, this.size.y * this.currentHealth / this.initialHealth);
		this.endFill();
		this.x = position.x;
        this.y = position.y;
    }

    update(position, hp){
        this.currentHealth = hp;
        this.clear();
        this.beginFill(0xFF0000);
		this.lineStyle(1, 0x000000, 1);
		this.drawRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
        this.endFill();
        this.beginFill(0x00FF00);
		this.lineStyle(1, 0x000000, 1);
        this.drawRect(-this.size.x / 2, -this.size.y / 2, 
                      this.size.x * this.currentHealth / this.initialHealth, this.size.y);
		this.endFill();
        this.x = position.x;
        this.y = position.y;
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

    length(){
        return this.array.length;
    }
}

class Tile extends PIXI.Sprite{
    constructor(position = new Vec2(), size = new Vec2(40, 40), onclick = null, spriteName = "images/placeholder.png"){
        super(getTexture(spriteName));
        this.bounds = new Bounds(position, size);
        this.anchor.set(0, 0);// making sure pivot is consistent
        this.width = size.x;
        this.height = size.y;
        this.x = position.x;
        this.y = position.y;
        this.coords = null;
        this.onclick = onclick;
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
        if (towers[stringFromCoords(this.coords)] != null && 
            towers[stringFromCoords(this.coords)] != undefined){
            this.tint = 0x0000FF; 
            return;
        }
        this.tint = 0x00FF00;
    }
    
    untintTile(){
        this.tint = 0xEEEEEE;
    }
}

class PathRenderer extends PIXI.Sprite{
    constructor(position = new Vec2(), size = new Vec2(tileDimension, tileDimension)){
        super(getTexture("images/dirtPath.png"));
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

class Tower extends PIXI.Sprite{
    constructor(damage, range, rateOfFire, coords){
        super(getTexture("images/tower.png"));
        this.anchor.set(0.5, 0.5);// tower will rotate, pivot will be in center
        this.width = tileDimension;
        this.height = tileDimension;
        this.x = tileDimension * coords.x + this.width / 2;
        this.y = tileDimension * coords.y + this.height / 2;
        this.centerPosition = new Vec2(this.x, this.y);
        this.damage = damage;
        this.rateOfFire = rateOfFire;
        this.coords = coords;
        this.range = range;
        this.line = null;
        this.target = null;
        this.timeSinceLastShot = 0;
        this.timeBetweenShots = 1 / rateOfFire;
    }

    update(dt){
        this.target = null;
        let enemySz = new Vec2(tileDimension, tileDimension);
        
        this.timeSinceLastShot += dt;
        if (this.timeSinceLastShot >= this.timeBetweenShots){
            this.timeSinceLastShot = 0;
            // for each enemy, get the closest
            let vecToEnemy = new Vec2();
            for (let e of enemies){
                let tempVec = this.centerPosition.vecFromThisToVec(e.position.add(enemySz.multiply(0.5)));
                let tempDist = tempVec.length();
                if (tempDist < this.range * tileDimension){
                    vecToEnemy = tempVec;
                    this.target = e;
                    break;
                }
            }
            if (this.target == null){
                return;
            }

            // cast a debug line to the target
            if (this.line != null){
                app.stage.removeChild(this.line);
            }
            let endLine = this.centerPosition.add(vecToEnemy);
            this.line = new Line(this.centerPosition, endLine);
            app.stage.addChild(this.line);
            
            let unitVecToEnemy = vecToEnemy.normalize();
            // point tower at enemy
            this.rotation = Math.atan2(unitVecToEnemy.y, unitVecToEnemy.x);
            if (this.target != null && this.target != undefined){
                let proj = new Projectile(new Vec2(this.x, this.y), 
                                          new Vec2(5, 5), 
                                          500, 
                                          Math.atan2(unitVecToEnemy.y, unitVecToEnemy.x),
                                          this.damage,
                                          getKey());
                projectiles[proj.key] = proj;
                gameScene.addChild(proj);
            }
        }

        
    }
}

class Projectile extends PIXI.Sprite{
    constructor(position, size, speed, rotation, damage, key){
        super(getTexture());
        this.anchor.set(0.5, 0.5);// making sure pivot is consistent
        this.width = size.x;
        this.height = size.y;
        this.x = position.x;
        this.y = position.y;
        this.position1 = position;
        this.bounds = new Bounds(this.position1, size);
        this.rotation = rotation;
        let dir = new Vec2(Math.cos(rotation), Math.sin(rotation));
        this.velocity = dir.multiply(speed);
        this.key = key;
        this.tint = 0x444444;
        this.damage = damage;
    }

    update(dt){
        if (levelBounds.intersects(this.bounds)){
            this.position1 = this.position1.add(this.velocity.multiply(dt));  
        }
        else{
            this.deleteProj();
        }

        this.position = this.position1;
        this.bounds.position = this.position1;
        this.bounds.update();
    }

    deleteProj(){
        gameScene.removeChild(this);
        delete projectiles[this.key];
        currentKey = "";
        currentKeyIndex = 0;
        // does this work?
        delete this;
    }
}

class Line extends PIXI.Graphics{
    constructor(startPos, endPos){
        super();
        this.lineStyle(1, 0x00FFFF, 0.9);
        this.moveTo(startPos.x, startPos.y);
        this.lineTo(endPos.x, endPos.y);
    }
}

class Player extends PIXI.Sprite{
    constructor (position, hp, money){
        super(getTexture());
        this.anchor.set(0, 0);// tower will rotate, pivot will be in center
        this.width = tileDimension;
        this.height = tileDimension;
        this.x = position.x;
        this.y = position.y;
        this.tint = 0x00FFFF;
        this.position = position;
        this.hp = hp;
        this.money = money;
        this.healthBar = new HealthBar(position.add(new Vec2(this.width / 2, -20)), this.hp / 2);
        this.healthBar.size = this.healthBar.size.add(new Vec2(0, 10));
        this.alive = true;
        moneyText.text = "Money: " + this.money;
    }

    update(){
        if (!this.alive){
            // game over
        }
        let position = new Vec2(this.x, this.y);
        this.healthBar.update(position.add(new Vec2(this.width / 2, -20)), this.hp / 2);
    }

    doDamage(dmg){
        if (!(dmg > 0))
            return;

        this.hp -= dmg;
        if (this.hp <= 0){
            this.alive = false;
            this.hp = 0;
        }
    }

    changeMoneyBy(amnt){
        this.money += amnt;
        moneyText.text = "Money: " + this.money;
    }
}

function getTexture(spriteURL = "images/placeholder.png"){
    return PIXI.loader.resources[spriteURL].texture;
}