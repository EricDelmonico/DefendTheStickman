"use strict";
let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}
let app = new PIXI.Application(600, 400);
let tileDimension = 40;
document.body.appendChild(app.view);

// load all images
PIXI.Loader.shared.
add(["images/placeholder.png"]).
on("progress",e=>{console.log(`progress=${e.progress}`)}).
load(init);

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
    tiles;
function init(){
    enemies = [];
    levels = [];
    levelPaths = [];

    gameScene = new PIXI.Container();
    background = new PIXI.Container();
    enemiesRendering = new PIXI.Container();
    pathsRendering = new PIXI.Container();
    
    tiles = [];
    let tileSz = new Vec2(tileDimension, tileDimension);
    for (let i = 0; i < app.view.width / tileDimension; i++){
        for (let j = 0; j < app.view.height / tileDimension; j++){
            let pos = new Vec2(i * tileDimension, j * tileDimension);
            let newTile = new Tile(pos, tileSz);
            gameScene.addChild(newTile);
            tiles.push(newTile);
        }
    }
    
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
    }

    // Create the first level
    let level1Enemies = new Queue();
    for (let i = 0; i < 10; i++){
        let enemy = new Enemy(100);
        enemy.position = new Vec2(i * 10, i * 10);
        level1Enemies.enqueue(enemy);
    }
    let level1 = new Level(level1Enemies);
    enemies.push(level1.giveNextEnemy());
    levels.push(level1);
    
    currentLevel = levels[0];
    // add containers in the order 
    // which they should appear
    gameScene.addChild(pathsRendering);
    gameScene.addChild(enemiesRendering);
    app.stage.addChild(background);
    app.stage.addChild(gameScene);
    gameScene.addChild(FPSCounter);
    app.ticker.add(update);
}

function update(){
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
    if (enemies.length == 0)
        return;

    enemies = enemies.filter(enemy => enemy.alive);
    for (let enemy of enemies){
        enemiesRendering.addChild(enemy.renderer);
    }
}

function getNewEnemy(){
    let newEnemy = currentLevel.giveNextEnemy();
    // don't push null to the stage
    if (newEnemy != null)
        enemies.push(newEnemy);
}

function getMousePosition(){
    let pos = app.renderer.plugins.interaction.mouse.global;
    return new Vec2(pos.x, pos.y);
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