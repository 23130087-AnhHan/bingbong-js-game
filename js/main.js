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

const BALL_INITIAL_VELOCITY_X = 220;
const BALL_INITIAL_VELOCITY_Y = -260;
const ball ={
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 10,
    velocityX: BALL_INITIAL_VELOCITY_X,
    velocityY: BALL_INITIAL_VELOCITY_Y
};

paddle.x = (canvas.width - paddle.width) / 2;
const MAX_BOUNCE_ANGLE = Math.PI / 3;

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
});

function handleWallCollision(){
    if(ball.x -ball.radius <=0){
        ball.x = ball.radius;
        ball.velocityX = Math.abs(ball.velocityX);
    }

    if(ball.x + ball.radius >= canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.velocityX = -Math.abs(ball.velocityX);
    }

    if (ball.y - ball.radius <=0){
        ball.y = ball.radius;
        ball.velocityY = Math.abs(ball.velocityY);
    }
}

function handlePaddleCollision(){
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;

    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;

    const overlapsHorizontally =
        ballRight >= paddleLeft &&
        ballLeft <= paddleRight;

    const overlapsVertically =
        ballBottom >= paddleTop &&
        ballTop <= paddleBottom;

    if (
        overlapsHorizontally &&
        overlapsVertically &&
        ball.velocityY>0
    ){
        ball.y =paddle.y - ball.radius;

        const paddleCenter=
            paddle.x + paddle.width/2;

        const hitPosition=
            (ball.x - paddleCenter)/
            (paddle.width / 2);
        const clampedHitPosition =
            Math.max(-1, Math.min(1, hitPosition));

        const bounceAngle = clampedHitPosition * MAX_BOUNCE_ANGLE;

        const speed = Math.hypot(
            ball.velocityX,
            ball.velocityY,
        );

        ball.velocityX=
            speed * Math.sin(bounceAngle);

        ball.velocityY=
            -speed * Math.cos(bounceAngle);
    }
}

function hasBallMissed(){
    return ball.y - ball.radius > canvas.height;
}

function resetBall(){
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;

    const horizontalDirection =
        Math.random() < 0.5 ? -1 : 1;

    ball.velocityX =
        BALL_INITIAL_VELOCITY_X * horizontalDirection;

    ball.velocityY =
        BALL_INITIAL_VELOCITY_Y ;
}


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

    handleWallCollision();
    handlePaddleCollision();

    if (hasBallMissed()) {
        resetBall();
    }
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