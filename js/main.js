const canvas = document.getElementById('gameCanvas');
const ctx= canvas.getContext('2d');
const gameContainer = document.querySelector(".game-container");

const levelMenu = {
    container: document.getElementById("levelMenu"),
    grid: document.getElementById("levelGrid"),
    title: document.getElementById("levelDetailsTitle"),
    description: document.getElementById("levelDescription")
};

const hud = {
    container: document.getElementById("gameHud"),
    lives: document.getElementById("hudLives"),
    score: document.getElementById("hudScore"),
    levelNumber: document.getElementById("hudLevelNumber"),
    levelName: document.getElementById("hudLevelName"),
    bricks: document.getElementById("hudBricks"),
    balls: document.getElementById("hudBalls"),
    controls: document.getElementById("gameControls")
};


const INITIAL_LIVES = 3;
const POINTS_PER_BRICK_HIT = 10;

const MAX_LIVES = 5;

const PADDLE_BASE_WIDTH = 120;
const PADDLE_EXPAND_AMOUNT = 40;
const PADDLE_MAX_WIDTH = 200;

const SLOW_BALL_MULTIPLIER = 0.75;
const MIN_BALL_SPEED = 220;

const BRICK_STYLES = Object.freeze({
    1: "#ffffff",
    2: "#bdbdbd",
    3: "#8a8a8a"
});

const BRICK_TYPES = Object.freeze({
    NORMAL: "normal",
    EXPLOSIVE: "explosive",
    STEEL: "steel"
});

const EXPLOSION_RADIUS = 95;
const EXPLOSIVE_BRICK_COLOR = "#ff8c42";
const STEEL_BRICK_COLOR = "#5f6f7a";

const BRICK_CONFIG = Object.freeze({
    width: 72,
    height: 24,

    gapX: 14,
    gapY: 10,

    topOffset: 100
});

const paddle = {
    width: PADDLE_BASE_WIDTH,
    height: 18,

    x: 0,
    y: canvas.height - 40,

    speed: 420,

    moveLeft: false,
    moveRight: false,
    mouseTargetX: null
};

const MIN_BOUNCE_ANGLE = Math.PI / 12;
const BALL_INITIAL_VELOCITY_X = 220;
const BALL_INITIAL_VELOCITY_Y = -260;
const BALL_RADIUS = 10;

paddle.x = (canvas.width - paddle.width) / 2;
const MAX_BOUNCE_ANGLE = Math.PI / 3;

const GAME_STATES = Object.freeze({
    LEVEL_SELECT: "levelSelect",
    PLAYING: "playing",
    LEVEL_COMPLETE: "levelComplete",
    GAME_OVER: "gameOver"
});

const ITEM_TYPES = Object.freeze({
    EXTRA_LIFE: "extraLife",
    EXPAND_PADDLE: "expandPaddle",
    SLOW_BALL: "slowBall"
});

const ITEM_LABELS = Object.freeze({
    [ITEM_TYPES.EXTRA_LIFE]: "+1",
    [ITEM_TYPES.EXPAND_PADDLE]: "W",
    [ITEM_TYPES.SLOW_BALL]: "S"
});

const ITEM_CONFIG = Object.freeze({
    width: 30,
    height: 22,
    fallSpeed: 140
});

const MULTIBALL_SPREAD_ANGLE =
    Math.PI / 4;


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
        description: "Learn the basics: keep the ball in play and break every brick.",
        brickLayout: DEFAULT_BRICK_LAYOUT
    }),

    Object.freeze({
        id: 2,
        name: "Hard Shell",
        description: "Tougher bricks need multiple hits. Keep going until every brick is destroyed.",

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
        description: "The brick formation moves from side to side. Follow the gaps and aim your shots.",

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
        name: "Item Rain",
        description: "Catch falling items to gain a life, widen your paddle or slow down the ball.",

        brickLayout: DEFAULT_BRICK_LAYOUT,

        itemDropRate: 0.35,

        itemTypes: Object.freeze([
            ITEM_TYPES.EXTRA_LIFE,
            ITEM_TYPES.EXPAND_PADDLE,
            ITEM_TYPES.SLOW_BALL
        ])
    }),

    Object.freeze({
        id: 5,
        name: "Explosive Chain",
        description: "Break orange bricks to damage nearby bricks and trigger chain reactions.",

        brickLayout: Object.freeze([
            Object.freeze([1, 1, 1, 1, 1, 1, 1]),
            Object.freeze([1, 1, 2, 2, 2, 1, 1]),
            Object.freeze([1, 2, 1, 1, 1, 2, 1]),
            Object.freeze([1, 1, 2, 2, 2, 1, 1]),
            Object.freeze([1, 1, 1, 1, 1, 1, 1])
        ]),

        explosiveCells: Object.freeze([
            Object.freeze([1, 1]),
            Object.freeze([1, 5]),
            Object.freeze([2, 3]),
            Object.freeze([3, 1]),
            Object.freeze([3, 5])
        ])
    }),

    Object.freeze({
        id: 6,
        name: "Multiball Chaos",
        description: "Keep three balls in play. You only lose a life when all balls fall off the screen.",

        brickLayout: Object.freeze([
            Object.freeze([0, 1, 1, 2, 1, 1, 0]),
            Object.freeze([1, 1, 2, 2, 2, 1, 1]),
            Object.freeze([1, 2, 1, 3, 1, 2, 1]),
            Object.freeze([1, 1, 2, 2, 2, 1, 1]),
            Object.freeze([0, 1, 1, 2, 1, 1, 0])
        ]),

        initialBallCount: 3
    }),

    Object.freeze({
        id: 7,
        name: "Steel Fortress",
        description: "Steel bricks cannot be destroyed. Clear all breakable bricks to win.",

        brickLayout: Object.freeze([
            Object.freeze([1, 1, 2, 2, 2, 1, 1]),
            Object.freeze([1, 2, 1, 2, 1, 2, 1]),
            Object.freeze([1, 1, 2, 3, 2, 1, 1]),
            Object.freeze([1, 2, 1, 2, 1, 2, 1]),
            Object.freeze([1, 1, 2, 2, 2, 1, 1])
        ]),

        steelCells: Object.freeze([
            Object.freeze([0, 0]),
            Object.freeze([0, 6]),

            Object.freeze([1, 0]),
            Object.freeze([1, 2]),
            Object.freeze([1, 4]),
            Object.freeze([1, 6]),

            Object.freeze([2, 0]),
            Object.freeze([2, 6]),

            Object.freeze([3, 0]),
            Object.freeze([3, 2]),
            Object.freeze([3, 4]),
            Object.freeze([3, 6]),

            Object.freeze([4, 0]),
            Object.freeze([4, 6])
        ])
    }),

    Object.freeze({
        id: 8,
        name: "Power Battle",
        description: "Preview only: the power battle mechanic is still in development. This level currently uses classic bricks.",
        inDevelopment: true
    }),

    Object.freeze({
        id: 9,
        name: "Gravity Zone",
        description: "Preview only: the gravity mechanic is still in development. This level currently uses classic bricks.",
        inDevelopment: true
    }),

    Object.freeze({
        id: 10,
        name: "Final Boss",
        description: "Preview only: the boss battle is still in development. This level currently uses classic bricks.",
        inDevelopment: true
    })
]);


let lastTime=0;
let lives=INITIAL_LIVES;
let score=0;
let gameState = GAME_STATES.LEVEL_SELECT;
let currentLevelIndex = 0;
let selectedLevelIndex = 0;
let bricks = [];
let balls = [];
let brickFormationOffsetX = 0;
let brickFormationDirection = 1;
let items = [];

window.addEventListener("keydown", (event) => {
    if (
        event.key.toLowerCase() === "m" &&
        gameState !== GAME_STATES.LEVEL_SELECT
    ) {
        openLevelSelectMenu();
        return;
    }

    if (gameState === GAME_STATES.LEVEL_SELECT) {
        handleLevelSelectKey(event);
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
        paddle.mouseTargetX = null;
    }

    if(event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        paddle.moveRight= true;
        paddle.mouseTargetX = null;
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

canvas.addEventListener("mousemove", (event) => {
    if (
        gameState !== GAME_STATES.PLAYING ||
        paddle.moveLeft ||
        paddle.moveRight
    ) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvas.clientWidth;

    // Convert the pointer position inside the border to game coordinates.
    paddle.mouseTargetX =
        (event.clientX - rect.left - canvas.clientLeft) * scaleX;
});

canvas.addEventListener("mouseleave", () => {
    paddle.mouseTargetX = null;
});

window.addEventListener("blur", resetPaddleInput);

function createBall(
    x,
    y,
    velocityX,
    velocityY
) {
    return {
        x,
        y,

        radius: BALL_RADIUS,

        velocityX,
        velocityY
    };
}

function createLevelMenu() {
    for (const [index, level] of LEVELS.entries()) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "level-card";

        const number = document.createElement("span");
        number.className = "level-card-number";
        number.textContent = `Level ${level.id}`;

        const name = document.createElement("strong");
        name.className = "level-card-name";
        name.textContent = level.name;

        button.append(number, name);

        if (level.inDevelopment) {
            button.classList.add("level-card-in-development");

            const status = document.createElement("span");
            status.className = "level-card-status";
            status.textContent = "In development";
            button.append(status);
        }

        button.addEventListener("pointermove", () => button.focus({ preventScroll: true }));
        button.addEventListener("focus", () => selectMenuLevel(index));
        button.addEventListener("click", () => startLevel(index));

        levelMenu.grid.append(button);
    }

    selectMenuLevel(selectedLevelIndex);
}

function selectMenuLevel(levelIndex) {
    selectedLevelIndex = levelIndex;
    const level = LEVELS[levelIndex];

    for (const [index, button] of [...levelMenu.grid.children].entries()) {
        button.classList.toggle("is-selected", index === levelIndex);
    }

    levelMenu.title.textContent = `Level ${level.id}: ${level.name}`;
    levelMenu.description.textContent = level.description;
}

function handleLevelSelectKey(event) {
    const key = event.key;

    if (key >= "1" && key <= "9") {
        event.preventDefault();
        startLevel(Number(key) - 1);
        return;
    }

    if (key === "0" && LEVELS.length >= 10) {
        event.preventDefault();
        startLevel(9);
        return;
    }

    // Let focused buttons handle Enter and Space through their native click event.
    if (key === "Enter" && !levelMenu.grid.contains(document.activeElement)) {
        event.preventDefault();
        startLevel(selectedLevelIndex);
        return;
    }

    const columns = getComputedStyle(levelMenu.grid).gridTemplateColumns.split(" ").length;
    let nextIndex = selectedLevelIndex;

    switch (key) {
        case "ArrowLeft":
            nextIndex--;
            break;
        case "ArrowRight":
            nextIndex++;
            break;
        case "ArrowUp":
            nextIndex -= columns;
            break;
        case "ArrowDown":
            nextIndex += columns;
            break;
        case "Home":
            nextIndex = 0;
            break;
        case "End":
            nextIndex = LEVELS.length - 1;
            break;
        default:
            return;
    }

    event.preventDefault();
    nextIndex = Math.max(0, Math.min(LEVELS.length - 1, nextIndex));
    selectMenuLevel(nextIndex);
    levelMenu.grid.children[nextIndex].focus();
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
    updateHud();
    canvas.focus({ preventScroll: true });
}

function openLevelSelectMenu() {
    resetPaddleInput();

    gameState = GAME_STATES.LEVEL_SELECT;
    updateHud();
    selectMenuLevel(currentLevelIndex);
    levelMenu.grid.children[currentLevelIndex].focus({ preventScroll: true });
}

function isItemCollidingWithPaddle(item) {
    const itemLeft = item.x;
    const itemRight =
        item.x + item.width;

    const itemTop = item.y;
    const itemBottom =
        item.y + item.height;

    const paddleLeft = paddle.x;
    const paddleRight =
        paddle.x + paddle.width;

    const paddleTop = paddle.y;
    const paddleBottom =
        paddle.y + paddle.height;

    return (
        itemRight >= paddleLeft &&
        itemLeft <= paddleRight &&
        itemBottom >= paddleTop &&
        itemTop <= paddleBottom
    );
}

function applyExtraLifeEffect() {
    lives = Math.min(
        lives + 1,
        MAX_LIVES
    );
}

function applyExpandPaddleEffect() {
    const paddleCenter =
        paddle.x + paddle.width / 2;

    paddle.width =
        Math.min(
            paddle.width +
            PADDLE_EXPAND_AMOUNT,
            PADDLE_MAX_WIDTH
        );

    paddle.x =
        paddleCenter -
        paddle.width / 2;

    clampPaddleToCanvas();
}

function setBallSpeed(ball, targetSpeed) {
    const currentSpeed =
        Math.hypot(
            ball.velocityX,
            ball.velocityY
        );

    if (currentSpeed === 0) {
        return;
    }

    const scale =
        targetSpeed / currentSpeed;

    ball.velocityX *= scale;
    ball.velocityY *= scale;
}

function applySlowBallEffect() {
    for (const ball of balls) {
        const currentSpeed =
            Math.hypot(
                ball.velocityX,
                ball.velocityY
            );

        const slowedSpeed =
            Math.max(
                MIN_BALL_SPEED,
                currentSpeed *
                SLOW_BALL_MULTIPLIER
            );

        setBallSpeed(
            ball,
            slowedSpeed
        );
    }
}

function applyItemEffect(type) {
    switch (type) {
        case ITEM_TYPES.EXTRA_LIFE:
            applyExtraLifeEffect();
            break;

        case ITEM_TYPES.EXPAND_PADDLE:
            applyExpandPaddleEffect();
            break;

        case ITEM_TYPES.SLOW_BALL:
            applySlowBallEffect();
            break;

        default:
            break;
    }
}

function getInitialBallCount() {
    const currentLevel =
        getCurrentLevel();

    const configuredCount =
        currentLevel.initialBallCount;

    if (
        !Number.isInteger(configuredCount) ||
        configuredCount < 1
    ) {
        return 1;
    }

    return configuredCount;
}

function createSingleInitialBall() {
    const horizontalDirection =
        Math.random() < 0.5 ? -1 : 1;

    return createBall(
        paddle.x + paddle.width / 2,
        paddle.y - BALL_RADIUS - 2,

        BALL_INITIAL_VELOCITY_X *
        horizontalDirection,

        BALL_INITIAL_VELOCITY_Y
    );
}

function createMultiballSet(ballCount) {
    const createdBalls = [];

    const spawnX =
        paddle.x + paddle.width / 2;

    const spawnY =
        paddle.y - BALL_RADIUS - 2;

    const initialSpeed =
        Math.hypot(
            BALL_INITIAL_VELOCITY_X,
            BALL_INITIAL_VELOCITY_Y
        );

    for (
        let index = 0;
        index < ballCount;
        index++
    ) {
        const progress =
            ballCount === 1
                ? 0.5
                : index / (ballCount - 1);

        let angle =
            -MULTIBALL_SPREAD_ANGLE +
            progress *
            (
                MULTIBALL_SPREAD_ANGLE * 2
            );

        if (
            Math.abs(angle) <
            MIN_BOUNCE_ANGLE
        ) {
            angle = MIN_BOUNCE_ANGLE;
        }

        const velocityX =
            initialSpeed *
            Math.sin(angle);

        const velocityY =
            -initialSpeed *
            Math.cos(angle);

        createdBalls.push(
            createBall(
                spawnX,
                spawnY,
                velocityX,
                velocityY
            )
        );
    }

    return createdBalls;
}


function handleWallCollision(ball) {
    if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.velocityX =
            Math.abs(ball.velocityX);
    }

    if (
        ball.x + ball.radius >=
        canvas.width
    ) {
        ball.x =
            canvas.width - ball.radius;

        ball.velocityX =
            -Math.abs(ball.velocityX);
    }

    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;

        ball.velocityY =
            Math.abs(ball.velocityY);
    }
}

function handlePaddleCollision(ball){
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


function hasBallMissed(ball) {
    return (
        ball.y - ball.radius >
        canvas.height
    );
}

function isConfiguredBrickCell(
    cells,
    row,
    column
) {
    if (!Array.isArray(cells)) {
        return false;
    }

    return cells.some(
        ([configuredRow, configuredColumn]) =>
            configuredRow === row &&
            configuredColumn === column
    );
}

function isBreakableBrick(brick) {
    return (
        brick.type !==
        BRICK_TYPES.STEEL
    );
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

            const type =
                getBrickTypeForCell(
                    row,
                    column
                );

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

                type,

                hp,
                maxHp: hp,

                destroyed: false
            });
        }
    }
    return createdBricks;
}

function getRemainingBreakableBrickCount() {
    return bricks.filter(
        brick =>
            isBreakableBrick(brick) &&
            !brick.destroyed
    ).length;
}

function areAllBreakableBricksDestroyed() {
    const breakableBricks =
        bricks.filter(
            isBreakableBrick
        );

    if (breakableBricks.length === 0) {
        return false;
    }

    return breakableBricks.every(
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

function getBrickTypeForCell(
    row,
    column
) {
    const currentLevel =
        getCurrentLevel();

    if (
        isConfiguredBrickCell(
            currentLevel.steelCells,
            row,
            column
        )
    ) {
        return BRICK_TYPES.STEEL;
    }

    if (
        isConfiguredBrickCell(
            currentLevel.explosiveCells,
            row,
            column
        )
    ) {
        return BRICK_TYPES.EXPLOSIVE;
    }

    return BRICK_TYPES.NORMAL;
}

function getRandomItemType(itemTypes) {
    const randomIndex =
        Math.floor(
            Math.random() * itemTypes.length
        );

    return itemTypes[randomIndex];
}

function tryDropItem(brick) {
    const currentLevel = getCurrentLevel();

    const dropRate =
        currentLevel.itemDropRate;

    if (
        typeof dropRate !== "number" ||
        dropRate <= 0
    ) {
        return;
    }

    const itemTypes =
        currentLevel.itemTypes;

    if (
        !Array.isArray(itemTypes) ||
        itemTypes.length === 0
    ) {
        return;
    }

    const clampedDropRate =
        Math.max(
            0,
            Math.min(1, dropRate)
        );

    if (Math.random() >= clampedDropRate) {
        return;
    }

    const type =
        getRandomItemType(itemTypes);

    items.push({
        type,

        x:
            brick.x +
            brick.width / 2 -
            ITEM_CONFIG.width / 2,

        y:
            brick.y +
            brick.height / 2 -
            ITEM_CONFIG.height / 2,

        width: ITEM_CONFIG.width,
        height: ITEM_CONFIG.height,

        fallSpeed: ITEM_CONFIG.fallSpeed
    });
}

function resetBricks() {
    resetBrickFormationMovement();
    bricks = createBrickLayout();
}

function resetItems() {
    items = [];
}

function resetPaddleInput() {
    paddle.moveLeft = false;
    paddle.moveRight = false;
    paddle.mouseTargetX = null;
}

function resetPaddle() {
    paddle.width =
        PADDLE_BASE_WIDTH;

    paddle.x =
        (canvas.width - paddle.width) / 2;

    resetPaddleInput();
}

function resetBalls() {
    const initialBallCount =
        getInitialBallCount();

    if (initialBallCount === 1) {
        balls = [
            createSingleInitialBall()
        ];

        return;
    }

    balls =
        createMultiballSet(
            initialBallCount
        );
}

function resetLevelState() {
    lives = INITIAL_LIVES;
    score = 0;

    resetPaddle();
    resetBalls();
    resetBricks();
    resetItems();
}

function restartGame(){
    resetLevelState();
    gameState= GAME_STATES.PLAYING;
}

function handleAllBallsMissed() {
    lives--;

    if (lives <= 0) {
        lives = 0;
        gameState =
            GAME_STATES.GAME_OVER;

        return;
    }

    resetBalls();
}

function isBallCollidingWithBrick(
    ball,
    brick
) {
    const closestX =
        Math.max(
            brick.x,
            Math.min(
                ball.x,
                brick.x + brick.width
            )
        );

    const closestY =
        Math.max(
            brick.y,
            Math.min(
                ball.y,
                brick.y + brick.height
            )
        );

    const distanceX =
        ball.x - closestX;

    const distanceY =
        ball.y - closestY;

    const distanceSquared =
        distanceX * distanceX +
        distanceY * distanceY;

    return (
        distanceSquared <=
        ball.radius * ball.radius
    );
}

function resolveBrickCollision(
    ball,
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
    if (
        brick.destroyed ||
        !isBreakableBrick(brick)
    ) {
        return false;
    }

    brick.hp--;

    score +=
        POINTS_PER_BRICK_HIT;

    if (brick.hp <= 0) {
        brick.hp = 0;
        brick.destroyed = true;

        return true;
    }

    return false;
}

function getBrickColor(brick) {
    if (
        brick.type ===
        BRICK_TYPES.STEEL
    ) {
        return STEEL_BRICK_COLOR;
    }

    if (
        brick.type ===
        BRICK_TYPES.EXPLOSIVE
    ) {
        return EXPLOSIVE_BRICK_COLOR;
    }

    return (
        BRICK_STYLES[brick.maxHp] ||
        "#6f6f6f"
    );
}

function getBrickDamageAlpha(brick) {
    if (!isBreakableBrick(brick)) {
        return 1;
    }

    if (brick.maxHp <= 1) {
        return 1;
    }

    const healthRatio =
        brick.hp / brick.maxHp;

    return (
        0.55 +
        healthRatio * 0.45
    );
}

function handleBrickCollisions(
    ball,
    previousX,
    previousY
) {
    for (const brick of bricks) {
        if (brick.destroyed) {
            continue;
        }

        if (
            !isBallCollidingWithBrick(
                ball,
                brick
            )
        ) {
            continue;
        }

        const wasDestroyed =
            damageBrick(brick);

        if (wasDestroyed) {
            handleBrickDestroyed(brick);
        }

        resolveBrickCollision(
            ball,
            brick,
            previousX,
            previousY
        );

        break;
    }
}

function handleBrickDestroyed(brick) {
    tryDropItem(brick);

    if (
        brick.type ===
        BRICK_TYPES.EXPLOSIVE
    ) {
        triggerBrickExplosion(brick);
    }
}

function triggerBrickExplosion(sourceBrick) {
    const sourceCenterX =
        sourceBrick.x +
        sourceBrick.width / 2;

    const sourceCenterY =
        sourceBrick.y +
        sourceBrick.height / 2;

    const explosionRadiusSquared =
        EXPLOSION_RADIUS *
        EXPLOSION_RADIUS;

    for (const brick of bricks) {
        if (brick.destroyed) {
            continue;
        }

        const brickCenterX =
            brick.x +
            brick.width / 2;

        const brickCenterY =
            brick.y +
            brick.height / 2;

        const distanceX =
            brickCenterX -
            sourceCenterX;

        const distanceY =
            brickCenterY -
            sourceCenterY;

        const distanceSquared =
            distanceX * distanceX +
            distanceY * distanceY;

        if (
            distanceSquared >
            explosionRadiusSquared
        ) {
            continue;
        }

        const wasDestroyed =
            damageBrick(brick);

        if (wasDestroyed) {
            handleBrickDestroyed(brick);
        }
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

function updateBalls(deltaTime) {
    const activeBalls = [];

    for (const ball of balls) {
        const missed =
            updateBall(
                ball,
                deltaTime
            );

        if (!missed) {
            activeBalls.push(ball);
        }
    }

    balls = activeBalls;

    if (balls.length === 0) {
        handleAllBallsMissed();
    }
}

function updateItems(deltaTime) {
    const remainingItems = [];

    for (const item of items) {
        item.y +=
            item.fallSpeed * deltaTime;

        if (
            isItemCollidingWithPaddle(item)
        ) {
            applyItemEffect(item.type);
            continue;
        }

        if (item.y > canvas.height) {
            continue;
        }

        remainingItems.push(item);
    }

    items = remainingItems;
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

    if (
        areAllBreakableBricksDestroyed()
    ) {
        gameState =
            GAME_STATES.LEVEL_COMPLETE;
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

function clampPaddleToCanvas() {
    if (paddle.x < 0) {
        paddle.x = 0;
    }

    if (
        paddle.x + paddle.width >
        canvas.width
    ) {
        paddle.x =
            canvas.width - paddle.width;
    }
}

function updatePaddle(deltaTime) {
    const maxMovement = paddle.speed * deltaTime;

    if (paddle.moveLeft || paddle.moveRight) {
        const direction = Number(paddle.moveRight) - Number(paddle.moveLeft);
        paddle.x += direction * maxMovement;
    } else if (paddle.mouseTargetX !== null) {
        const targetX = Math.max(
            0,
            Math.min(canvas.width - paddle.width, paddle.mouseTargetX - paddle.width / 2)
        );
        const distance = targetX - paddle.x;

        // Follow the mouse at the keyboard speed and stop exactly at the target.
        paddle.x += Math.sign(distance) * Math.min(Math.abs(distance), maxMovement);
    }

    clampPaddleToCanvas();
}

function updateBall(ball, deltaTime) {
    const previousX = ball.x;
    const previousY = ball.y;

    ball.x +=
        ball.velocityX * deltaTime;

    ball.y +=
        ball.velocityY * deltaTime;

    handleWallCollision(ball);
    handlePaddleCollision(ball);

    handleBrickCollisions(
        ball,
        previousX,
        previousY
    );

    return hasBallMissed(ball);
}

function update(deltaTime) {
    if (gameState !== GAME_STATES.PLAYING) {
        return;
    }

    updatePaddle(deltaTime);
    updateBrickFormation(deltaTime);
    updateBalls(deltaTime);
    updateItems(deltaTime);

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

function drawBall(ball) {
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

function drawBalls() {
    for (const ball of balls) {
        drawBall(ball);
    }
}

function setHudText(element, value) {
    const text = String(value);

    if (element.textContent !== text) {
        element.textContent = text;
    }
}

function updateHud() {
    const isLevelSelect =
        gameState === GAME_STATES.LEVEL_SELECT;

    hud.container.hidden = isLevelSelect;
    hud.controls.hidden = isLevelSelect;
    levelMenu.container.hidden = !isLevelSelect;
    canvas.hidden = isLevelSelect;

    if (isLevelSelect) {
        return;
    }

    const currentLevel = getCurrentLevel();

    setHudText(hud.lives, lives);
    setHudText(hud.score, score);
    setHudText(hud.levelNumber, `Level ${currentLevel.id} / ${LEVELS.length}`);
    setHudText(hud.levelName, currentLevel.name);
    setHudText(hud.bricks, getRemainingBreakableBrickCount());
    setHudText(hud.balls, balls.length);
}

function resizeGameLayout() {
    const bodyStyle = getComputedStyle(document.body);
    const availableWidth = document.documentElement.clientWidth -
        parseFloat(bodyStyle.paddingLeft) - parseFloat(bodyStyle.paddingRight);
    const availableHeight = window.innerHeight -
        parseFloat(bodyStyle.paddingTop) - parseFloat(bodyStyle.paddingBottom);

    // The HTML menu keeps readable text and can scroll on smaller screens.
    if (gameState === GAME_STATES.LEVEL_SELECT) {
        gameContainer.style.width = `${Math.min(canvas.width, availableWidth)}px`;
        return;
    }

    // Reserve space for the title, HUD and controls before sizing the canvas.
    const interfaceHeight = gameContainer.offsetHeight - canvas.offsetHeight;
    const borderWidth = canvas.offsetWidth - canvas.clientWidth;
    const borderHeight = canvas.offsetHeight - canvas.clientHeight;
    const canvasHeight = Math.max(0, availableHeight - interfaceHeight - borderHeight);
    const widthFromHeight = canvasHeight * (canvas.width / canvas.height) + borderWidth;
    const gameWidth = Math.min(canvas.width, availableWidth, widthFromHeight);

    gameContainer.style.width = `${Math.floor(gameWidth)}px`;
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

function drawItems() {
    for (const item of items) {
        ctx.fillStyle = "#111111";
        ctx.fillRect(
            item.x,
            item.y,
            item.width,
            item.height
        );

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(
            item.x,
            item.y,
            item.width,
            item.height
        );

        ctx.fillStyle = "white";
        ctx.font = "13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            ITEM_LABELS[item.type] || "?",
            item.x + item.width / 2,
            item.y + item.height / 2
        );
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
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
        return;
    }

    drawBricks();

    if (gameState === GAME_STATES.PLAYING) {
        drawItems();
        drawPaddle();
        drawBalls();
    }

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
    updateHud();
    draw();

    requestAnimationFrame(gameLoop);
}

createLevelMenu();
resetPaddle();
resetBalls();
resetBricks();

const gameLayoutObserver = new ResizeObserver(() => {
    requestAnimationFrame(resizeGameLayout);
});
gameLayoutObserver.observe(gameContainer);
window.addEventListener("resize", resizeGameLayout);

requestAnimationFrame(gameLoop);
