"use strict";
let type = "WebGL";
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas";
}
let app = new PIXI.Application();
let tileDimension = 50;
document.body.appendChild(app.view);
let tilesWide = app.view.width / tileDimension;
let tilesHigh = app.view.height / tileDimension;

// load all images
PIXI.Loader.shared.
add(["images/placeholder.png", 
     "images/dirtPath.png", 
     "images/tower.png",
     "images/pauseButton.png",
     "images/endBuyButton.png"]).
on("progress",e=>{console.log(`progress=${e.progress}`)}).
load(init);

let levelBounds = new Bounds(new Vec2(0, 0), 
                             new Vec2(app.view.width, app.view.height));

let alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
let gameScene, 
    background,
    enemies,
    enemiesRendering,
    rect, 
    mouseRect,
    currentLevel,
    pathsRendering,
    FPSCounter,
    levels,
    levelPaths,
    tiles,
    hoveredTile,
    towers,
    pathsMap,
    pathCoords,
    paths,
    projectiles,
    currentKey = "",
    currentKeyIndex = 0,
    towersRendering,
    tilesRendering,
    healthBarsRendering,
    player,
    currentWave = 0,
    UIRendering,
    moneyText,
    waveText,
    basicTowerCost = 100,
    paused = false;
function init(){
    enemies = [];
    levels = [];
    levelPaths = [];
    towers = new Object();
    projectiles = new Object();

    gameScene = new PIXI.Container();
    background = new PIXI.Container();
    enemiesRendering = new PIXI.Container();
    pathsRendering = new PIXI.Container();
    towersRendering = new PIXI.Container();
    tilesRendering = new PIXI.Container();
    healthBarsRendering = new PIXI.Container();
    UIRendering = new PIXI.Container();

    // create UI
    {
        //create fps counter
        {
            let textStyle = new PIXI.TextStyle({
                fill: 0xFF00FF,
                fontSize: 20,
                fontFamily: "Futura",
                stroke: 0xFF00FF,
                strokeThickness: 0.5
            });
            FPSCounter = new PIXI.Text();
            FPSCounter.style = textStyle;
            FPSCounter.x = 5;
            FPSCounter.y = 5;
            //UIRendering.addChild(FPSCounter);
        }

        // Create text to show the player's score
        {
            let textStyle = new PIXI.TextStyle({
                fill: 0x000000,
                fontSize: 30,
                fontFamily: "Futura",
                stroke: 0x000000,
                strokeThickness: 0.5
            });
            moneyText = new PIXI.Text();
            moneyText.style = textStyle;
            moneyText.x = 5;
            moneyText.y = 50;
            UIRendering.addChild(moneyText);
        }

        // Create text to show the player's score
        {
            let textStyle = new PIXI.TextStyle({
                fill: 0x000000,
                fontSize: 30,
                fontFamily: "Futura",
                stroke: 0x000000,
                strokeThickness: 0.5
            });
            waveText = new PIXI.Text();
            waveText.style = textStyle;
            waveText.x = 5;
            waveText.y = 80;
            UIRendering.addChild(waveText);
        }
    }

    tiles = [];
    let tileSz = new Vec2(tileDimension, tileDimension);
    // Make paths manually,
    // and make the player at 
    // the final path's position
    pathsMap = [];
    {
        for (let i = 0; i < tilesHigh; i++){
            for (let j = 0; j < tilesWide; j++){
                pathsMap[i * (tilesWide) + j] = 0;
            }
        }
        pathCoords = [];
        // create paths
        paths = [];
        paths.push(new Path(directions.UP, 8));
        paths.push(new Path(directions.LEFT, 2));
        paths.push(new Path(directions.DOWN, 5));
        paths.push(new Path(directions.LEFT, 2));                
        paths.push(new Path(directions.UP, 5));
        paths.push(new Path(directions.LEFT, 2));
        paths.push(new Path(directions.DOWN, 5));
        paths.push(new Path(directions.LEFT, 2));                
        paths.push(new Path(directions.UP, 5));
        let finalPathDirection = paths[paths.length - 1].dir;
        let curPathCoords = new Vec2(13, 12);
        for (let i = 0; i < paths.length; i++){
            paths[i].startPosition.x = curPathCoords.x * tileDimension;
            paths[i].startPosition.y = curPathCoords.y * tileDimension;            
            curPathCoords = makePath(curPathCoords, paths[i]);
            paths[i].endPosition.x = curPathCoords.x * tileDimension;
            paths[i].endPosition.y = curPathCoords.y * tileDimension;  
        }
        let playerCoords = curPathCoords.add(finalPathDirection);
        player = new Player(new Vec2(playerCoords.x * tileDimension, // x position
                                     playerCoords.y * tileDimension),// y position
                            1000,                                    // health
                            100);                                    // money
    }

    // Make tiles and show sprites where paths are
    {
        for (let i = 0; i < tilesHigh; i++){
            for (let j = 0; j < tilesWide; j++){
                let pathHere = false;
                pathCoords.forEach(path => pathHere = pathHere || (path.x == j && path.y == i));
                if (pathHere){
                    pathsRendering.addChild(new PathRenderer(new Vec2(j * tileDimension, i * tileDimension), 
                                                             new Vec2(tileDimension, tileDimension)));
                    let pos = new Vec2(j * tileDimension, i * tileDimension);
                    let newTile = new Tile(pos, tileSz);
                    newTile.coords = new Vec2(j, i);
                    newTile.onclick = null;
                    tilesRendering.addChild(newTile);
                    tiles.push(newTile);
                    continue;
                }
                if (i == 0 && j == 0){
                    let pos = new Vec2(j * tileDimension, i * tileDimension);
                    let newTile = new Tile(pos, tileSz, togglePause, "images/pauseButton.png");
                    newTile.coords = new Vec2(j, i);
                    newTile.onclick = togglePause;
                    tilesRendering.addChild(newTile);
                    tiles.push(newTile);
                    continue;
                }
                if (i == 0 && (j == 1 || j == 2 || j == 3)){
                    if (j == 1){
                        let pos = new Vec2(j * tileDimension, i * tileDimension);
                        let newTile = new Tile(pos, tileSz.add(new Vec2(tileDimension * 2, 0)), endBuyPeriod, "images/endBuyButton.png");
                        newTile.coords = new Vec2(j, i);
                        tilesRendering.addChild(newTile);
                        tiles.push(newTile);
                    }
                    continue;
                }
                let pos = new Vec2(j * tileDimension, i * tileDimension);
                let newTile = new Tile(pos, tileSz);
                newTile.coords = new Vec2(j, i);
                newTile.onclick = spawnTower;
                tilesRendering.addChild(newTile);
                tiles.push(newTile);
            }
        }
    }

    // Create the first level
    let level1;
    {
        level1 = new Level(new Queue());
        levels.push(level1);
    }
    
    currentLevel = levels[0];
    // add containers in the order 
    // which they should appear
    gameScene.addChild(tilesRendering);
    gameScene.addChild(pathsRendering);
    gameScene.addChild(towersRendering);
    gameScene.addChild(enemiesRendering);
    gameScene.addChild(player);
    gameScene.addChild(player.healthBar);
    gameScene.addChild(healthBarsRendering);
    app.stage.addChild(background);
    app.stage.addChild(gameScene);
    app.stage.addChild(UIRendering);
    app.ticker.add(update);

    app.view.onclick = onclick;
}

function makePath(lastPathCoords, path){
    let newLastPathCoords = lastPathCoords;
    if (path.len <= 0){
        return newLastPathCoords;
    }
    for (let i = 0; i < path.len; i++){
        newLastPathCoords = newLastPathCoords.add(path.dir);
        pathCoords.push(newLastPathCoords);
    }
    return newLastPathCoords;
}

let frame = 0;
function update(){
    // update tiles
    for (let tile of tiles){
        tile.update(getMousePosition());
    }
    let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt = 1/12;
    if(paused) dt = 0;

    // update the player
    player.update();

    // update enemies
    {
        for (let i = 0; i < enemies.length; i++){
            enemies[i].update(dt);
        }
    }

    // update current level
    currentLevel.update(dt);

    //update towers
    {
        for (let key in towers){
            towers[key].update(dt);
        }
    }

    // update projectiles
    {
        for (let key in projectiles){
            projectiles[key].update(dt);
        }
    }
    doProjectileEnemyCollisions();

    FPSCounter.text = app.ticker.FPS;
    runMiscUpdateFunctions();
    resetOnscreenEnemies();
}

function runMiscUpdateFunctions(){
    for (let e of enemies){
        e.update();
    }
}

function resetOnscreenEnemies(){
    enemiesRendering.removeChildren();
    healthBarsRendering.removeChildren();
    if (enemies.length == 0)
        return;

    enemies = enemies.filter(enemy => enemy.alive);
    for (let enemy of enemies){
        enemiesRendering.addChild(enemy.renderer);
        healthBarsRendering.addChild(enemy.healthBar);
    }
}

function getMousePosition(){
    let pos = app.renderer.plugins.interaction.mouse.global;
    return new Vec2(pos.x, pos.y);
}

function onclick(){
    if (hoveredTile != undefined && hoveredTile.onclick != null){
        hoveredTile.onclick();
    }
}

function getRandomDirection(){
    let rng = Math.floor(Math.random() * 4);
    let newDirection;
    switch (rng){
        case 0:
            newDirection = directions.UP;
            break;
        case 1:
            newDirection = directions.DOWN;
            break;
        case 2:
            newDirection = directions.LEFT;
            break;
        case 3:
            newDirection = directions.RIGHT;
            break;
        default:
            console.log("how??");
            break
    }
    return newDirection;
}

function spawnTower(){
    // make sure there's no tower here
    let towerHere = towers[stringFromCoords(hoveredTile.coords)] != null && 
                    towers[stringFromCoords(hoveredTile.coords)] != undefined;

    if (!towerHere && player.money >= basicTowerCost){
        let newTower = new Tower(10, 5, 1, hoveredTile.coords);
        towers[stringFromCoords(newTower.coords)] = newTower;
        towersRendering.addChild(newTower);
        player.changeMoneyBy(-basicTowerCost);
    }
}

function stringFromCoords(vec){
    return `${vec.x},${vec.y}`;
}

function getKey(){
    let projAmnt = 0;
    for (let key in projectiles){
        projAmnt++;
    }
    if (projAmnt == 0){
        currentKey = "";
        currentKeyIndex = 0;
    }

    let skipProcess = false;
    if (currentKey.length < 100){
        currentKey += alphabet[currentKeyIndex];
        skipProcess = true;
    }

    if (!skipProcess){
        let currentLetterToIndex = -1;
        for (let i = 0; i < currentKey.length; i++){
            if (currentKey[i] == alphabet[currentKeyIndex]){
                currentLetterToIndex++;
            }
        }
        if (currentLetterToIndex == -1){
            if (currentKeyIndex < 24){
                currentKeyIndex++;
            }
            else{
                throw "Too many projectiles on screen. Current Amount: " + projAmnt;
            }
        }
        else{
            currentKey = replaceLetterInStr(currentKey, currentLetterToIndex, alphabet[currentKeyIndex + 1]);
        }
    }
    
    // if there's a projectile here, try again
    if (projectiles[currentKey] != null &&
        projectiles[currentKey] != undefined){       
            return getKey();
    }
    return currentKey;
}

function replaceLetterInStr(string, index, letter){
    let finalString = "";
    finalString += string.slice(0, index);
    finalString += letter;
    finalString += string.slice(index + 1);
    return finalString;
}

function doProjectileEnemyCollisions(){
    for (let key in projectiles){
        for (let enemy of enemies){
            let proj = projectiles[key];
            if (proj.bounds.intersects(enemy.bounds)){
                enemy.doDamage(proj.damage);
                proj.deleteProj();
                // this projectile is now
                // deleted, must exit enemy loop
                break;
            }
        }
    }
}

function togglePause(){
    paused = !paused;
}

function endBuyPeriod(){
    if (!currentLevel.buyPhase)
        return;
    
    currentLevel.timeInBuyPhase = currentLevel.buyPhaseTime - 0.1;
}