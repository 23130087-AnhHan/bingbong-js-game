const canvas = document.getElementById('gameCanvas');
const ctx= canvas.getContext('2d');

const INITIAL_LIVES = 3;
const POINTS_PER_BRICK_HIT = 10;

const BRICK_STYLES = Object.freeze({
    1: "#ffffff",
    2: "#bdbdbd",
    3: "#8a8a8a"
});

const BRICK_CONFIG = Object.freeze({
    rows: 5,
    columns: 7,

    width: 72,
    height: 24,

    gapX: 14,
    gapY: 10,

    topOffset: 100
});

const paddle= {
    width: 120,
    height: 18,
    x: 0,
    y: canvas.height -40,
    speed: 420,
    moveLeft: false,
    moveRight: false
};

const MIN_BOUNCE_ANGLE = Math.PI / 12;
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
        name: "Classic Breakout",
        brickHpByRow: [1, 1, 1, 1, 1]
    }),

    Object.freeze({
        id: 2,
        name: "Hard Shell",
        brickHpByRow: [2, 2, 2, 1, 1]
    }),

    Object.freeze({
        id: 3,
        name: "Moving Formation",
        brickHpByRow: [3, 2, 2, 1, 1]
    }),

    Object.freeze({
        id: 4,
        name: "Brick Storm"
    }),

    Object.freeze({
        id: 5,
        name: "Survival"
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
let bricks = [];

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
        return;
    }

    if (gameState !== GAME_STATES.PLAYING) {
        return;
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

function getPaddleBounceSpeed() {
    const currentSpeed = Math.hypot(
        ball.velocityX,
        ball.velocityY
    );

    const currentLevel = getCurrentLevel();

    if (
        typeof currentLevel.speedMultiplierPerHit !== "number"
    ) {
        return currentSpeed;
    }

    const increasedSpeed =
        currentSpeed * currentLevel.speedMultiplierPerHit;

    if (typeof currentLevel.maxBallSpeed !== "number") {
        return increasedSpeed;
    }

    return Math.min(
        increasedSpeed,
        currentLevel.maxBallSpeed
    );
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

        let bounceAngle =
            clampedHitPosition * MAX_BOUNCE_ANGLE;

        if (Math.abs(bounceAngle) < MIN_BOUNCE_ANGLE) {
            let direction = Math.sign(clampedHitPosition);

            if (direction === 0) {
                direction = Math.sign(ball.velocityX);
            }

            if (direction === 0) {
                direction =
                    Math.random() < 0.5 ? -1 : 1;
            }

            bounceAngle =
                direction * MIN_BOUNCE_ANGLE;
        }

        const speed = getPaddleBounceSpeed();

        ball.velocityX =
            speed * Math.sin(bounceAngle);

        ball.velocityY =
            -speed * Math.cos(bounceAngle);
    }
}


function hasBallMissed(){
    return ball.y - ball.radius > canvas.height;
}

function createClassicBrickLayout() {
    const bricks = [];

    const totalWidth =
        BRICK_CONFIG.columns * BRICK_CONFIG.width +
        (BRICK_CONFIG.columns - 1) * BRICK_CONFIG.gapX;

    const startX =
        (canvas.width - totalWidth) / 2;

    for (let row = 0; row < BRICK_CONFIG.rows; row++) {
        for (
            let column = 0;
            column < BRICK_CONFIG.columns;
            column++
        ) {
            const x =
                startX +
                column *
                (BRICK_CONFIG.width + BRICK_CONFIG.gapX);

            const y =
                BRICK_CONFIG.topOffset +
                row *
                (BRICK_CONFIG.height + BRICK_CONFIG.gapY);

            const hp = getBrickHpForRow(row);
            bricks.push({
                x: x,
                y: y,

                width: BRICK_CONFIG.width,
                height: BRICK_CONFIG.height,

                hp: hp,
                maxHp: hp,

                destroyed: false
            });
        }
    }

    return bricks;
}

function getRemainingBrickCount() {
    return bricks.filter(
        brick => !brick.destroyed
    ).length;
}

function areAllBricksDestroyed() {
    if (bricks.length === 0) {
        return false;
    }

    return bricks.every(
        brick => brick.destroyed
    );
}

function getBrickHpForRow(row) {
    const currentLevel = getCurrentLevel();

    if (!Array.isArray(currentLevel.brickHpByRow)) {
        return 1;
    }

    const configuredHp =
        currentLevel.brickHpByRow[row];

    if (
        typeof configuredHp !== "number" ||
        configuredHp < 1
    ) {
        return 1;
    }

    return configuredHp;
}


function resetBricks() {
    bricks = createClassicBrickLayout();
}


function resetPaddle(){
    paddle.x = (canvas.width - paddle.width) / 2;

    paddle.moveLeft = false;
    paddle.moveRight = false;
}

function resetBall() {
    ball.x =
        paddle.x + paddle.width / 2;

    ball.y =
        paddle.y - ball.radius - 2;

    const horizontalDirection =
        Math.random() < 0.5 ? -1 : 1;

    ball.velocityX =
        BALL_INITIAL_VELOCITY_X *
        horizontalDirection;

    ball.velocityY =
        BALL_INITIAL_VELOCITY_Y;
}

function resetLevelState(){
    lives= INITIAL_LIVES;
    score = 0;

    resetPaddle();
    resetBall();
    resetBricks();
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

function isBallCollidingWithBrick(brick) {
    const closestX = Math.max(
        brick.x,
        Math.min(ball.x, brick.x + brick.width)
    );

    const closestY = Math.max(
        brick.y,
        Math.min(ball.y, brick.y + brick.height)
    );

    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;

    const distanceSquared =
        distanceX * distanceX +
        distanceY * distanceY;

    return distanceSquared <=
        ball.radius * ball.radius;
}

function resolveBrickCollision(
    brick,
    previousX,
    previousY
) {
    const wasAbove =
        previousY + ball.radius <= brick.y;

    const wasBelow =
        previousY - ball.radius >=
        brick.y + brick.height;

    const wasLeft =
        previousX + ball.radius <= brick.x;

    const wasRight =
        previousX - ball.radius >=
        brick.x + brick.width;

    if (wasAbove) {
        ball.y = brick.y - ball.radius;
        ball.velocityY =
            -Math.abs(ball.velocityY);
        return;
    }

    if (wasBelow) {
        ball.y =
            brick.y +
            brick.height +
            ball.radius;

        ball.velocityY =
            Math.abs(ball.velocityY);
        return;
    }

    if (wasLeft) {
        ball.x = brick.x - ball.radius;
        ball.velocityX =
            -Math.abs(ball.velocityX);
        return;
    }

    if (wasRight) {
        ball.x =
            brick.x +
            brick.width +
            ball.radius;

        ball.velocityX =
            Math.abs(ball.velocityX);
        return;
    }

    ball.velocityY *= -1;
}

function damageBrick(brick) {
    if (brick.destroyed) {
        return false;
    }

    brick.hp--;

    score += POINTS_PER_BRICK_HIT;

    if (brick.hp <= 0) {
        brick.hp = 0;
        brick.destroyed = true;

        return true;
    }

    return false;
}

function getBrickColor(brick) {
    return (
        BRICK_STYLES[brick.maxHp] ||
        "#6f6f6f"
    );
}

function getBrickDamageAlpha(brick) {
    if (brick.maxHp <= 1) {
        return 1;
    }

    const healthRatio =
        brick.hp / brick.maxHp;

    return 0.55 + healthRatio * 0.45;
}



function handleBrickCollisions(
    previousX,
    previousY
) {
    for (const brick of bricks) {
        if (brick.destroyed) {
            continue;
        }

        if (!isBallCollidingWithBrick(brick)) {
            continue;
        }

        damageBrick(brick);

        resolveBrickCollision(
            brick,
            previousX,
            previousY
        );

        break;
    }
}
function getCurrentLevel(){
    return LEVELS[currentLevelIndex];
}

function checkLevelCompletion() {
    if (gameState !== GAME_STATES.PLAYING) {
        return;
    }

    if (areAllBricksDestroyed()) {
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
    const previousX = ball.x;
    const previousY = ball.y;

    ball.x +=
        ball.velocityX * deltaTime;

    ball.y +=
        ball.velocityY * deltaTime;

    handleWallCollision();
    handlePaddleCollision();

    handleBrickCollisions(
        previousX,
        previousY
    );

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

function drawHud() {
    const currentLevel = getCurrentLevel();
    const remainingBricks =
        getRemainingBrickCount();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.textAlign = "left";
    ctx.fillText(
        `Lives: ${lives}`,
        20,
        30
    );

    ctx.textAlign = "right";
    ctx.fillText(
        `Score: ${score}`,
        canvas.width - 20,
        30
    );

    ctx.textAlign = "center";
    ctx.fillText(
        `Level ${currentLevel.id}/${LEVELS.length}: ${currentLevel.name}`,
        canvas.width / 2,
        30
    );

    ctx.font = "16px Arial";

    ctx.textAlign = "left";
    ctx.fillText(
        "Move: A / D or <- / ->",
        20,
        55
    );

    ctx.textAlign = "center";
    ctx.fillText(
        `Bricks: ${remainingBricks}/${bricks.length}`,
        canvas.width / 2,
        55
    );

    ctx.textAlign = "left";
}

function drawBricks() {
    for (const brick of bricks) {
        if (brick.destroyed) {
            continue;
        }

        ctx.fillStyle =
            getBrickColor(brick);

        ctx.globalAlpha =
            getBrickDamageAlpha(brick);

        ctx.fillRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );
    }

    ctx.globalAlpha = 1;
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
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawBricks();

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

resetPaddle();
resetBall();
resetBricks();

requestAnimationFrame(gameLoop);