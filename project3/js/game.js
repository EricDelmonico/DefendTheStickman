let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}
let app = new PIXI.Application(600, 400);
document.body.appendChild(app.view);

let gameScene = new PIXI.Container();
let background = new PIXI.Container();

let path = new Path();
console.log(path);