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
    LEVEL_SELECT: "levelSelect",
    PLAYING: "playing",
    LEVEL_COMPLETE: "levelComplete",
    GAME_OVER: "gameOver"
});

const LEVEL_MENU_CONFIG = Object.freeze({
    columns: 5,

    cardWidth: 130,
    cardHeight: 70,

    gapX: 15,
    gapY: 20,

    startY: 180
});

const DEFAULT_BRICK_LAYOUT = Object.freeze([
    Object.freeze([1, 1, 1, 1, 1, 1, 1]),
    Object.freeze([1, 1, 1, 1, 1, 1, 1]),
    Object.freeze([1, 1, 1, 1, 1, 1, 1]),
    Object.freeze([1, 1, 1, 1, 1, 1, 1]),
    Object.freeze([1, 1, 1, 1, 1, 1, 1])
]);

const LEVELS = Object.freeze([
    Object.freeze({
        id: 1,
        name: "Classic Breakout",
        brickLayout: DEFAULT_BRICK_LAYOUT
    }),

    Object.freeze({
        id: 2,
        name: "Hard Shell",

        brickLayout: Object.freeze([
            Object.freeze([2, 2, 2, 2, 2, 2, 2]),
            Object.freeze([2, 2, 2, 2, 2, 2, 2]),
            Object.freeze([0, 2, 2, 2, 2, 2, 0]),
            Object.freeze([0, 1, 1, 1, 1, 1, 0]),
            Object.freeze([0, 0, 1, 1, 1, 0, 0])
        ])
    }),

    Object.freeze({
        id: 3,
        name: "Moving Formation",

        brickLayout: Object.freeze([
            Object.freeze([0, 0, 3, 3, 3, 0, 0]),
            Object.freeze([0, 2, 2, 2, 2, 2, 0]),
            Object.freeze([1, 1, 1, 1, 1, 1, 1]),
            Object.freeze([0, 2, 2, 2, 2, 2, 0]),
            Object.freeze([0, 0, 1, 1, 1, 0, 0])
        ]),

        formationMovement: Object.freeze({
            speed: 70,
            maxOffsetX: 70
        })
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
let gameState = GAME_STATES.LEVEL_SELECT;
let currentLevelIndex = 0;
let bricks = [];
let brickFormationOffsetX = 0;
let brickFormationDirection = 1;

window.addEventListener("keydown", (event) => {
    if (
        event.key.toLowerCase() === "m" &&
        gameState !== GAME_STATES.LEVEL_SELECT
    ) {
        openLevelSelectMenu();
        return;
    }

    if (gameState === GAME_STATES.LEVEL_SELECT) {
        handleLevelSelectKey(event.key);
        return;
    }
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

function getLevelMenuCards() {
    const totalWidth =
        LEVEL_MENU_CONFIG.columns *
        LEVEL_MENU_CONFIG.cardWidth +
        (LEVEL_MENU_CONFIG.columns - 1) *
        LEVEL_MENU_CONFIG.gapX;

    const startX =
        (canvas.width - totalWidth) / 2;

    return LEVELS.map((level, index) => {
        const row =
            Math.floor(
                index / LEVEL_MENU_CONFIG.columns
            );

        const column =
            index % LEVEL_MENU_CONFIG.columns;

        const x =
            startX +
            column *
            (
                LEVEL_MENU_CONFIG.cardWidth +
                LEVEL_MENU_CONFIG.gapX
            );

        const y =
            LEVEL_MENU_CONFIG.startY +
            row *
            (
                LEVEL_MENU_CONFIG.cardHeight +
                LEVEL_MENU_CONFIG.gapY
            );

        return {
            levelIndex: index,
            level,
            x,
            y,

            width: LEVEL_MENU_CONFIG.cardWidth,
            height: LEVEL_MENU_CONFIG.cardHeight
        };
    });
}

function handleLevelSelectKey(key) {
    if (key >= "1" && key <= "9") {
        startLevel(Number(key) - 1);
        return;
    }

    if (key === "0" && LEVELS.length >= 10) {
        startLevel(9);
    }
}

function startLevel(levelIndex) {
    if (
        levelIndex < 0 ||
        levelIndex >= LEVELS.length
    ) {
        return;
    }

    currentLevelIndex = levelIndex;

    resetLevelState();

    gameState = GAME_STATES.PLAYING;
}

function openLevelSelectMenu() {
    paddle.moveLeft = false;
    paddle.moveRight = false;

    gameState = GAME_STATES.LEVEL_SELECT;
}

canvas.addEventListener("click", (event) => {
    if (
        gameState !== GAME_STATES.LEVEL_SELECT
    ) {
        return;
    }

    const rect =
        canvas.getBoundingClientRect();

    const scaleX =
        canvas.width / rect.width;

    const scaleY =
        canvas.height / rect.height;

    const mouseX =
        (event.clientX - rect.left) * scaleX;

    const mouseY =
        (event.clientY - rect.top) * scaleY;

    const cards = getLevelMenuCards();

    const clickedCard = cards.find((card) => {
        return (
            mouseX >= card.x &&
            mouseX <= card.x + card.width &&
            mouseY >= card.y &&
            mouseY <= card.y + card.height
        );
    });

    if (!clickedCard) {
        return;
    }

    startLevel(clickedCard.levelIndex);
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

        const speed = Math.hypot(
            ball.velocityX,
            ball.velocityY
        );

        ball.velocityX =
            speed * Math.sin(bounceAngle);

        ball.velocityY =
            -speed * Math.cos(bounceAngle);
    }
}


function hasBallMissed(){
    return ball.y - ball.radius > canvas.height;
}

function createBrickLayout() {
    const createdBricks = [];

    const layout = getCurrentBrickLayout();

    const rowCount = layout.length;

    const columnCount = Math.max(
        ...layout.map(row => row.length)
    );

    const totalWidth =
        columnCount * BRICK_CONFIG.width +
        (columnCount - 1) * BRICK_CONFIG.gapX;

    const startX =
        (canvas.width - totalWidth) / 2;

    for (let row = 0; row < rowCount; row++) {
        for (
            let column = 0;
            column < layout[row].length;
            column++
        ) {
            const hp = layout[row][column];

            if (
                typeof hp !== "number" ||
                hp <= 0
            ) {
                continue;
            }

            const x =
                startX +
                column *
                (
                    BRICK_CONFIG.width +
                    BRICK_CONFIG.gapX
                );

            const y =
                BRICK_CONFIG.topOffset +
                row *
                (
                    BRICK_CONFIG.height +
                    BRICK_CONFIG.gapY
                );

            createdBricks.push({
                x,
                y,
                baseX: x,

                width: BRICK_CONFIG.width,
                height: BRICK_CONFIG.height,

                hp,
                maxHp: hp,

                destroyed: false
            });
        }
    }

    return createdBricks;
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


function getCurrentBrickLayout() {
    const currentLevel = getCurrentLevel();

    if (
        !Array.isArray(currentLevel.brickLayout) ||
        currentLevel.brickLayout.length === 0
    ) {
        return DEFAULT_BRICK_LAYOUT;
    }

    return currentLevel.brickLayout;
}
function resetBricks() {
    resetBrickFormationMovement();
    bricks = createBrickLayout();
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

function getCurrentFormationMovement() {
    const currentLevel = getCurrentLevel();

    if (
        !currentLevel.formationMovement ||
        typeof currentLevel.formationMovement.speed !== "number" ||
        typeof currentLevel.formationMovement.maxOffsetX !== "number"
    ) {
        return null;
    }

    return currentLevel.formationMovement;
}

function resetBrickFormationMovement() {
    brickFormationOffsetX = 0;
    brickFormationDirection = 1;
}

function getCurrentLevel(){
    return LEVELS[currentLevelIndex];
}

function updateBrickFormation(deltaTime) {
    const movement =
        getCurrentFormationMovement();

    if (!movement) {
        return;
    }

    brickFormationOffsetX +=
        movement.speed *
        brickFormationDirection *
        deltaTime;

    if (
        brickFormationOffsetX >=
        movement.maxOffsetX
    ) {
        brickFormationOffsetX =
            movement.maxOffsetX;

        brickFormationDirection = -1;
    }

    if (
        brickFormationOffsetX <=
        -movement.maxOffsetX
    ) {
        brickFormationOffsetX =
            -movement.maxOffsetX;

        brickFormationDirection = 1;
    }

    for (const brick of bricks) {
        brick.x =
            brick.baseX +
            brickFormationOffsetX;
    }
}

function checkLevelCompletion() {
    if (gameState !== GAME_STATES.PLAYING) {
        return;
    }

    if (areAllBricksDestroyed()) {
        gameState = GAME_STATES.LEVEL_COMPLETE;
    }
}

function advanceToNextLevel() {
    if (
        gameState !== GAME_STATES.LEVEL_COMPLETE
    ) {
        return;
    }

    const nextLevelIndex =
        currentLevelIndex + 1;

    if (nextLevelIndex >= LEVELS.length) {
        return;
    }

    startLevel(nextLevelIndex);
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
    if (gameState !== GAME_STATES.PLAYING) {
        return;
    }

    updatePaddle(deltaTime);
    updateBrickFormation(deltaTime);
    updateBall(deltaTime);

    checkLevelCompletion();
}

function drawLevelSelectMenu() {
    const cards = getLevelMenuCards();

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    ctx.font = "40px Arial";
    ctx.fillText(
        "SELECT LEVEL",
        canvas.width / 2,
        100
    );

    ctx.font = "16px Arial";
    ctx.fillText(
        "Choose any level to start",
        canvas.width / 2,
        135
    );

    for (const card of cards) {
        ctx.fillStyle = "#1a1a1a";

        ctx.fillRect(
            card.x,
            card.y,
            card.width,
            card.height
        );

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            card.x,
            card.y,
            card.width,
            card.height
        );

        ctx.fillStyle = "white";

        ctx.font = "18px Arial";
        ctx.fillText(
            `Level ${card.level.id}`,
            card.x + card.width / 2,
            card.y + 28
        );

        ctx.font = "13px Arial";
        ctx.fillText(
            card.level.name,
            card.x + card.width / 2,
            card.y + 52
        );
    }

    ctx.font = "15px Arial";
    ctx.fillStyle = "white";

    ctx.fillText(
        "Click a level or press 1-9 / 0 for Level 10",
        canvas.width / 2,
        405
    );

    ctx.fillText(
        "Press M during gameplay to return here",
        canvas.width / 2,
        435
    );

    ctx.textAlign = "left";
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

    if (
        gameState === GAME_STATES.LEVEL_SELECT
    ) {
        drawLevelSelectMenu();
        return;
    }

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