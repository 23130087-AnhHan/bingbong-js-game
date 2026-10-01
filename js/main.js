const canvas = document.getElementById('gameCanvas');
const ctx= canvas.getContext('2d');

const INITIAL_LIVES = 3;
const POINTS_PER_HIT = 10;

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

const GAME_STATES = Object.freeze({
    PLAYING: "playing",
    LEVEL_COMPLETE: "levelComplete",
    GAME_OVER: "gameOver"
});

const LEVELS = Object.freeze([
    Object.freeze({
        id: 1,
        name: "First Bounce",
        targetScore: 50
    }),

    Object.freeze({
        id: 2,
        name: "Speed Rush"
    }),

    Object.freeze({
        id: 3,
        name: "Moving Walls"
    }),

    Object.freeze({
        id: 4,
        name: "Brick Storm"
    }),

    Object.freeze({
        id: 5,
        name: "Survival "
    }),

    Object.freeze({
        id: 6,
        name: "Multiball Chaos"
    }),

    Object.freeze({
        id: 7,
        name: "Portal Maze"
    }),

    Object.freeze({
        id: 8,
        name: "Power Battle"
    }),

    Object.freeze({
        id: 9,
        name: "Gravity Zone"
    }),

    Object.freeze({
        id: 10,
        name: "Final Boss"
    })
]);


let lastTime=0;
let lives=INITIAL_LIVES;
let score=0;
let gameState = GAME_STATES.PLAYING;
let currentLevelIndex = 0;


window.addEventListener("keydown", (event) => {
    if (
        event.key === "Enter" &&
        gameState === GAME_STATES.LEVEL_COMPLETE
    ) {
        advanceToNextLevel();
        return;
    }

    if(event.key.toLowerCase() === "r" &&
        gameState=== GAME_STATES.GAME_OVER
    ) {
        restartGame();
    }

    if (
         event.key === "ArrowLeft" ||
         event.key === "ArrowRight"
     ) {
         event.preventDefault();
     }

    if(event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        paddle.moveLeft= true;
    }

    if(event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        paddle.moveRight= true;
    }

});

window.addEventListener("keyup", (event) => {
    if(event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        paddle.moveLeft= false;
    }

    if(event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
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
        score += POINTS_PER_HIT;

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
            ball.velocityY
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

function resetPaddle(){
    paddle.x = (canvas.width - paddle.width) / 2;

    paddle.moveLeft = false;
    paddle.moveRight = false;
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

function resetLevelState(){
    lives= INITIAL_LIVES;
    score = 0;

    resetPaddle();
    resetBall();
}

function restartGame(){
    resetLevelState();
    gameState= GAME_STATES.PLAYING;
}

function handleBallMiss(){
    lives --;

    if (lives <= 0) {
        lives = 0;
        gameState = GAME_STATES.GAME_OVER;
        return;
    }
    resetBall();
}

function getCurrentLevel(){
    return LEVELS[currentLevelIndex];
}

function checkLevelCompletion(){
    if(gameState !== GAME_STATES.PLAYING){
        return;
    }

    const currentLevel = getCurrentLevel();

    if(typeof currentLevel.targetScore !== "number"){
        return;
    }

    if(score >= currentLevel.targetScore){
        gameState = GAME_STATES.LEVEL_COMPLETE;
    }
}

function advanceToNextLevel(){
    if(gameState !== GAME_STATES.LEVEL_COMPLETE){
        return;
    }

    if(currentLevelIndex >= LEVELS.length - 1){
        return;
    }
    currentLevelIndex++;

    resetLevelState();

    gameState = GAME_STATES.PLAYING;
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
        handleBallMiss();
    }
}

function update(deltaTime) {
    if(gameState !== GAME_STATES.PLAYING){
        return;
    }
    updatePaddle(deltaTime);
    updateBall(deltaTime);

    checkLevelCompletion();
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

function drawHud(){
    const currentLevel = getCurrentLevel();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.textAlign = "left";
    ctx.fillText(`Lives: ${lives}`, 20, 30 );

    ctx.textAlign = "right";
    ctx.fillText(`Scores: ${score}`, canvas.width - 20, 30 );

    ctx.textAlign = "center";
    ctx.fillText(
        `Level ${currentLevel.id}/${LEVELS.length}: ${currentLevel.name}`,
        canvas.width / 2,
        30
    );

    ctx.textAlign = "left";
    ctx.font = "16px Arial";
    ctx.fillText(
        "Move: A / D or <- / ->", 20, 55
    );

    if (typeof currentLevel.targetScore === "number") {
        ctx.textAlign = "center";
        ctx.fillText(
            `Target: ${currentLevel.targetScore} points`,
            canvas.width / 2,
            55
        );
    }
    ctx.textAlign = "left";
}

function drawLevelComplete() {
    if (gameState !== GAME_STATES.LEVEL_COMPLETE) {
        return;
    }

    const currentLevel = getCurrentLevel();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "42px Arial";
    ctx.fillText(
        "LEVEL COMPLETE!",
        centerX,
        centerY - 35
    );

    ctx.font = "24px Arial";
    ctx.fillText(
        currentLevel.name,
        centerX,
        centerY + 10
    );

    ctx.font = "18px Arial";
    ctx.fillText(
        `Score: ${score}`,
        centerX,
        centerY + 50
    );

    ctx.font = "18px Arial";
    ctx.fillText(
        "Press Enter to Continue",
        centerX,
        centerY + 90
    );

    ctx.textAlign = "left";
}

function drawGameOver(){
    if(gameState !== GAME_STATES.GAME_OVER){
        return;
    }
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(
        0, 0, canvas.width, canvas.height
    );

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "48px Arial";
    ctx.fillText("Game Over!", centerX, centerY - 30);

    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, centerX, centerY + 20);

    ctx.font = "18px Arial";
    ctx.fillText("Press R to Restart", centerX, centerY + 60);

    ctx.textAlign = "left";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === GAME_STATES.PLAYING) {
        drawPaddle();
        drawBall();
    }
    drawHud();
    drawLevelComplete();
    drawGameOver();
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