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

const errorSound = PIXI.sound.Sound.from("sounds/errorSound.mp3");
const towerUpgradeSound = PIXI.sound.Sound.from("sounds/towerUpgradeSound.mp3");
const shootSound = PIXI.sound.Sound.from("sounds/shootSound.mp3");
const playerDamageSound = PIXI.sound.Sound.from("sounds/playerDamageSound.mp3");

// load all images
PIXI.Loader.shared.
add(["images/placeholder.png", 
     "images/dirtPath.png", 
     "images/tower.png",
     "images/pauseButton.png",
     "images/endBuyButton.png",
     "images/upDamage.png",
     "images/upRange.png",
     "images/upRateOfFire.png"]).
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
    paused = false,
    selectedTower,
    rangeUpButton,
    dmgUpButton,
    rateOfFireUpButton,
    selectedTowerRange,
    selectedTowerRoF,
    selectedTowerDamage,
    upgradeCostText,
    towerCostText,
    gameOver = false,
    gameOverText,
    highScoreText,
    highScore,
    yourScoreText,
    yourScore,
    gameOverScene;
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
    gameOverScene = new PIXI.Container();

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

        // Create text to show the player's money
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

        // Create text to show the wave
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

        // create the tower stats text
        {
            let textStyle = new PIXI.TextStyle({
                fill: 0x000000,
                fontSize: 20,
                fontFamily: "Futura",
                stroke: 0x000000,
                strokeThickness: 0.5
            });
            selectedTowerRange = new PIXI.Text();
            selectedTowerRange.style = textStyle;
            selectedTowerRange.x = 5;
            selectedTowerRange.y = 150;
            UIRendering.addChild(selectedTowerRange);
            selectedTowerRoF = new PIXI.Text();
            selectedTowerRoF.style = textStyle;
            selectedTowerRoF.x = 5;
            selectedTowerRoF.y = 175;
            UIRendering.addChild(selectedTowerRoF);
            selectedTowerDamage = new PIXI.Text();
            selectedTowerDamage.style = textStyle;
            selectedTowerDamage.x = 5;
            selectedTowerDamage.y = 200;
            UIRendering.addChild(selectedTowerDamage);
            upgradeCostText = new PIXI.Text();
            upgradeCostText.style = textStyle;
            upgradeCostText.x = 5;
            upgradeCostText.y = 525;
            UIRendering.addChild(upgradeCostText);
            towerCostText = new PIXI.Text();
            towerCostText.style = textStyle;
            towerCostText.x = 5;
            towerCostText.y = 225;
            towerCostText.text = "Tower Cost: " + basicTowerCost;;
            UIRendering.addChild(towerCostText);
        }

        // Create game over text
        {
            let textStyle = new PIXI.TextStyle({
                fill: 0x000000,
                fontSize: 100,
                fontFamily: "Futura",
                stroke: 0xFFFFFF,
                strokeThickness: 1
            });
            gameOverText = new PIXI.Text();
            gameOverText.style = textStyle;
            gameOverText.anchor.set(0.5, 0.5);
            gameOverText.x = app.view.width / 2;
            gameOverText.y = app.view.height / 2;
            gameOverText.text = "GAME OVER";
            UIRendering.addChild(gameOverText);
        }
        // create high score text
        {
            let textStyle = new PIXI.TextStyle({
                fill: 0x000000,
                fontSize: 50,
                fontFamily: "Futura",
                stroke: 0xFFFFFF,
                strokeThickness: 1
            });
            highScoreText = new PIXI.Text();
            highScoreText.style = textStyle;
            highScoreText.anchor.set(0.5, 0.5);
            highScoreText.x = app.view.width / 2;
            highScoreText.y = app.view.height / 2 + 75;
            highScoreText.text = "High Score: " + highScore;
            UIRendering.addChild(highScoreText);
            yourScoreText = new PIXI.Text();
            yourScoreText.style = textStyle;
            yourScoreText.anchor.set(0.5, 0.5);
            yourScoreText.x = app.view.width / 2;
            yourScoreText.y = app.view.height / 2 + 125;
            yourScoreText.text = "Your Score: " + yourScore;
            UIRendering.addChild(yourScoreText);
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
                if (i == tilesHigh - 1 && j == 0){
                    let pos = new Vec2(j * tileDimension, i * tileDimension);
                    let newTile = new Tile(pos, tileSz, togglePause, "images/upDamage.png");
                    newTile.coords = new Vec2(j, i);
                    newTile.onclick = UpDamage;
                    tilesRendering.addChild(newTile);
                    tiles.push(newTile);
                    continue;
                }
                if (i == tilesHigh - 1 && j == 1){
                    let pos = new Vec2(j * tileDimension, i * tileDimension);
                    let newTile = new Tile(pos, tileSz, togglePause, "images/upRange.png");
                    newTile.coords = new Vec2(j, i);
                    newTile.onclick = UpRange;
                    tilesRendering.addChild(newTile);
                    tiles.push(newTile);
                    continue;
                }
                if (i == tilesHigh - 1 && j == 2){
                    let pos = new Vec2(j * tileDimension, i * tileDimension);
                    let newTile = new Tile(pos, tileSz, togglePause, "images/upRateOfFire.png");
                    newTile.coords = new Vec2(j, i);
                    newTile.onclick = UpRateOfFire;
                    tilesRendering.addChild(newTile);
                    tiles.push(newTile);
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
    // check if the player is dead
    gameOver = !player.alive;

    if (gameOver){
        app.stage.removeChild(gameScene);
        app.stage.addChild(gameOverScene);
    }

    // update tiles
    for (let tile of tiles){
        tile.update(getMousePosition());
    }
    let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt = 1/12;
    if(paused || gameOver) dt = 0;

    // update the player
    player.update();

    if (selectedTower != null){
        selectedTowerDamage.text = "Damage: " + selectedTower.damage + " hp";
        selectedTowerRoF.text = "RoF: " + selectedTower.rateOfFire + " shots per second";
        selectedTowerRange.text = "Range: " + selectedTower.range + " blocks";
        let price = 100;
        price += selectedTower.upgradesSoFar * 2 * 25;
        upgradeCostText.text = "Cost Per Upgrade: " + price;
    }
    else{
        selectedTowerDamage.text = "";
        selectedTowerRoF.text = "";
        selectedTowerRange.text = "";
        upgradeCostText.text = "";
    }

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
    let hoveredCoords = null;
    if (hoveredTile != undefined && hoveredTile.onclick != null){
        hoveredTile.onclick();
        hoveredCoords = hoveredTile.coords;
    }

    if (hoveredCoords != null && towers[stringFromCoords(hoveredCoords)]){
        towers[stringFromCoords(hoveredCoords)].onclick();
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
        let newTower = new Tower(10, 3.5, 1, hoveredTile.coords);
        towers[stringFromCoords(newTower.coords)] = newTower;
        towersRendering.addChild(newTower);
        player.changeMoneyBy(-basicTowerCost);
        towerUpgradeSound.play();
        basicTowerCost += 100;
        towerCostText.text = "Tower Cost: " + basicTowerCost;
    }
    else if (!towerHere){
        errorSound.play();
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

function UpDamage(){
    if (selectedTower == null){
        errorSound.play();
        return;
    }

    let price = 100;
    price += selectedTower.upgradesSoFar * 2 * 25;
    if (player.money >= price){
        player.changeMoneyBy(-price);
        selectedTower.upgradesSoFar++;
        selectedTower.damage += 7;
        towerUpgradeSound.play();
    }
    else{
        errorSound.play();
    }
}

function UpRange(){
    if (selectedTower == null){
        errorSound.play();
        return;
    }

    let price = 100;
    price += selectedTower.upgradesSoFar * 2 * 25;
    if (player.money >= price){
        player.changeMoneyBy(-price);
        selectedTower.upgradesSoFar++;
        selectedTower.range += 0.5;
        towerUpgradeSound.play();
    }
    else{
        errorSound.play();
    }
}

function UpRateOfFire(){
    if (selectedTower == null){
        errorSound.play();
        return;
    }

    let price = 100;
    price += selectedTower.upgradesSoFar * 2 * 25;
    if (player.money >= price){
        player.changeMoneyBy(-price);
        selectedTower.upgradesSoFar++;
        selectedTower.rateOfFire += 0.5;
        towerUpgradeSound.play();
    }
    else{
        errorSound.play();
    }
}