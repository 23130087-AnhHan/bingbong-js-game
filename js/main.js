const canvas = document.getElementById('gameCanvas');
const ctx= canvas.getContext('2d');

let lastTime=0;

const paddle= {
    width: 120,
    height: 18,
    x: 0,
    y: canvas.height -40,
    speed: 420,
    moveLeft: false,
    moveRight: false
};

const ball ={
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 10,
    velocityX: 220,
    velocityY: -260
};



paddle.x = (canvas.width - paddle.width) / 2;

window.addEventListener("keydown", (event) => {
     if (
         event.key === "ArrowLeft" ||
         event.key === "ArrowRight"
     ) {
         event.preventDefault();
     }

    if(event.key === "ArrowLeft" || event.key. toLowerCase() === "a") {
        paddle.moveLeft= true;
    }

    if(event.key === "ArrowRight" || event.key. toLowerCase() === "d") {
        paddle.moveRight= true;
    }
});

window.addEventListener("keyup", (event) => {
    if(event.key === "ArrowLeft" || event.key. toLowerCase() === "a") {
        paddle.moveLeft= false;
    }

    if(event.key === "ArrowRight" || event.key. toLowerCase() === "d") {
        paddle.moveRight= false;
    }
})

function updatePaddle(deltaTime){
    if(paddle.moveLeft){
        paddle.x -= paddle.speed*deltaTime;
    }
    if(paddle.moveRight){
        paddle.x += paddle.speed*deltaTime;
    }
    if(paddle.x < 0){
        paddle.x =0;
    }
    if(paddle.x + paddle.width > canvas.width){
        paddle.x= canvas.width - paddle.width;
    }
}

function updateBall(deltaTime) {
    ball.x += ball.velocityX * deltaTime;
    ball.y += ball.velocityY * deltaTime;
}

function update(deltaTime) {
    updatePaddle(deltaTime);
    updateBall(deltaTime);
}

function drawPaddle() {
    ctx.fillStyle = "white";

    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );
}

function drawBall() {
    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "white";
    ctx.fill();

    ctx.closePath();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPaddle();
    drawBall();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Move: A / D or <- / ->", 20, 30);

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