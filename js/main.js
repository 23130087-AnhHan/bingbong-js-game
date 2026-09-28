const canvas = document.getElementById('gameCanvas');
const ctx= canvas.getContext('2d');

let lastTime=0;
let testX=0;
const testSpeed=120;

function update(deltaTime){
    testX += testSpeed*deltaTime;

    if (testX > canvas.width){
        testX = -50;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(testX, 280, 50, 50 );

    ctx.font = "20px Arial";
    ctx.fillText("Game Loop Running", 20, 30);

}

function gameLoop(timestamp){
    if(lastTime === 0){
        lastTime = timestamp;
    }

    const deltaTime = (timestamp - lastTime)/1000;

    lastTime=timestamp;
    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);