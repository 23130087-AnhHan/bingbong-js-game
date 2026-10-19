const canvas = document.getElementById('gameCanvas');
const ctx= canvas.getContext('2d');
const gameContainer = document.querySelector(".game-container");

// Read the shared CSS palette once when the game loads.
const themeStyles = getComputedStyle(document.documentElement);

function getThemeColor(property) {
    return themeStyles.getPropertyValue(property).trim();
}

const GAME_COLORS = Object.freeze({
    paddle: getThemeColor("--color-paddle"),
    ball: getThemeColor("--color-ball"),
    ballHighlight: getThemeColor("--color-ball-highlight"),
    ballShadow: getThemeColor("--color-ball-shadow"),
    text: getThemeColor("--color-text"),
    detail: getThemeColor("--color-ink"),
    border: getThemeColor("--color-border"),
    brickOneHit: getThemeColor("--color-brick-one-hit"),
    brickTwoHits: getThemeColor("--color-brick-two-hits"),
    brickThreeHits: getThemeColor("--color-brick-three-hits"),
    brickLabel: getThemeColor("--color-brick-label"),
    explosiveBrick: getThemeColor("--color-explosive"),
    steelBrick: getThemeColor("--color-steel"),
    success: getThemeColor("--color-success"),
    danger: getThemeColor("--color-danger"),
    endOverlay: getThemeColor("--color-end-overlay")
});

const gameView = {
    board: document.getElementById("gameBoard"),
    readyMessage: document.getElementById("readyMessage"),
    pausedMessage: document.getElementById("pausedMessage")
};

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
    controls: document.getElementById("gameControls"),
    time: document.getElementById("hudTime"),
    itemTimer: document.getElementById("hudItemTimer"),
    itemTimerValue: document.getElementById("hudItemTimerValue"),
    wallTimer: document.getElementById("hudWallTimer")
};


const INITIAL_LIVES = 3;
const POINTS_PER_BRICK_HIT = 10;

const MAX_LIVES = 5;

const PADDLE_BASE_WIDTH = 120;
const PADDLE_EXPAND_AMOUNT = 40;
const PADDLE_MAX_WIDTH = 200;
const PADDLE_MIN_WIDTH = 70;
const HELPFUL_EFFECT_DURATION = 10;
const HARMFUL_EFFECT_DURATION = 6;


const SLOW_BALL_MULTIPLIER = 0.85;
const FAST_BALL_MULTIPLIER = 1.12;
const MIN_BALL_SPEED = 220;
const MAX_BALL_SPEED = 480;
const MAX_ACTIVE_BALLS = 2;

const PHYSICS_STEP = 1 / 120;
const MAX_FRAME_TIME = 0.25;
const COLLISION_GAP = 0.01;
const MAX_COLLISION_PASSES = 4;

const BRICK_STYLES = Object.freeze({
    1: GAME_COLORS.brickOneHit,
    2: GAME_COLORS.brickTwoHits,
    3: GAME_COLORS.brickThreeHits
});

const BRICK_TYPES = Object.freeze({
    NORMAL: "normal",
    EXPLOSIVE: "explosive",
    STEEL: "steel"
});

const EXPLOSION_RADIUS = 95;

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

    speed: 480,

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
    READY: "ready",
    PLAYING: "playing",
    PAUSED: "paused",
    LEVEL_COMPLETE: "levelComplete",
    GAME_OVER: "gameOver"
});

const ITEM_TYPES = Object.freeze({
    // Có lợi (Buffs - Xanh lá)
    EXTRA_LIFE: "extraLife",
    EXPAND_PADDLE: "expandPaddle",
    SLOW_BALL: "slowBall",
    ADD_ONE_BALL: "addOneBall",
    ADD_TWO_BALLS: "addTwoBalls",

    // Có hại (Debuffs - Đỏ)
    LOSE_LIFE: "loseLife",
    SHRINK_PADDLE: "shrinkPaddle",
    FAST_BALL: "fastBall"
});

const ITEM_LABELS = Object.freeze({
    [ITEM_TYPES.EXTRA_LIFE]: "+1\u2665",
    [ITEM_TYPES.EXPAND_PADDLE]: "\u2194",
    [ITEM_TYPES.SLOW_BALL]: "\u2193",
    [ITEM_TYPES.ADD_ONE_BALL]: "+1\u25cf",
    [ITEM_TYPES.ADD_TWO_BALLS]: "+2\u25cf",

    [ITEM_TYPES.LOSE_LIFE]: "-1\u2665",
    [ITEM_TYPES.SHRINK_PADDLE]: "><",
    [ITEM_TYPES.FAST_BALL]: "\u2191"
});

const ITEM_COLORS = Object.freeze({
    // Có lợi: Xanh lá cây
    [ITEM_TYPES.EXTRA_LIFE]: "#16a34a",
    [ITEM_TYPES.EXPAND_PADDLE]: "#16a34a",
    [ITEM_TYPES.SLOW_BALL]: "#16a34a",
    [ITEM_TYPES.ADD_ONE_BALL]: "#16a34a",
    [ITEM_TYPES.ADD_TWO_BALLS]: "#16a34a",

    // Có hại: Đỏ
    [ITEM_TYPES.LOSE_LIFE]: "#dc2626",
    [ITEM_TYPES.SHRINK_PADDLE]: "#dc2626",
    [ITEM_TYPES.FAST_BALL]: "#dc2626"
});

const HARMFUL_ITEM_TYPES = Object.freeze([
    ITEM_TYPES.LOSE_LIFE,
    ITEM_TYPES.SHRINK_PADDLE,
    ITEM_TYPES.FAST_BALL
]);

// Mạng và bóng bổ sung xuất hiện ít hơn các hiệu ứng tạm thời.
const ITEM_WEIGHTS = Object.freeze({
    [ITEM_TYPES.EXTRA_LIFE]: 1,
    [ITEM_TYPES.EXPAND_PADDLE]: 3,
    [ITEM_TYPES.SLOW_BALL]: 3,
    [ITEM_TYPES.ADD_ONE_BALL]: 1,
    [ITEM_TYPES.LOSE_LIFE]: 1,
    [ITEM_TYPES.SHRINK_PADDLE]: 4,
    [ITEM_TYPES.FAST_BALL]: 4
});

const ITEM_CONFIG = Object.freeze({
    width: 36,
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
        name: "Phá gạch cơ bản",
        description: "Làm quen cách chơi: đỡ bóng và phá hết các viên gạch để qua màn.",
        speedMultiplier: 1.0,
        brickLayout: DEFAULT_BRICK_LAYOUT
    }),

    Object.freeze({
        id: 2,
        name: "Lớp giáp kiên cố",
        description: "Tận dụng hai lối mở ở hàng dưới để đưa bóng vào nhóm gạch cứng bên trong. Tốc độ bóng: 1.03x.",
        speedMultiplier: 1.03,
        brickLayout: Object.freeze([
            Object.freeze([0, 1, 2, 3, 2, 1, 0]),
            Object.freeze([1, 2, 2, 3, 2, 2, 1]),
            Object.freeze([1, 1, 2, 2, 2, 1, 1]),
            Object.freeze([1, 2, 0, 2, 0, 2, 1]),
            Object.freeze([1, 1, 0, 1, 0, 1, 1])
        ])
    }),

    Object.freeze({
        id: 3,
        name: "Đội hình di động",
        description: "Đội hình gạch liên tục di chuyển qua lại. Căn thời điểm và điều chỉnh hướng bóng chính xác. Tốc độ bóng: 1.06x.",
        speedMultiplier: 1.06,

        brickLayout: Object.freeze([
            Object.freeze([0, 2, 3, 3, 3, 2, 0]),
            Object.freeze([1, 2, 2, 2, 2, 2, 1]),
            Object.freeze([1, 1, 2, 1, 2, 1, 1]),
            Object.freeze([0, 2, 2, 2, 2, 2, 0]),
            Object.freeze([0, 0, 1, 1, 1, 0, 0])
        ]),

        formationMovement: Object.freeze({
            speed: 75,
            maxOffsetX: 70
        })
    }),

    Object.freeze({
        id: 4,
        name: "Cơn mưa vật phẩm",
        description: "Nhặt vật phẩm xanh và tránh vật phẩm đỏ khi gạch di chuyển. Tối đa hai bóng và một vật phẩm thêm mạng mỗi màn. Tốc độ bóng: 1.09x.",
        speedMultiplier: 1.09,

        brickLayout: Object.freeze([
            Object.freeze([2, 3, 3, 3, 3, 3, 2]),
            Object.freeze([2, 2, 3, 3, 3, 2, 2]),
            Object.freeze([2, 2, 2, 3, 2, 2, 2]),
            Object.freeze([1, 2, 2, 3, 2, 2, 1]),
            Object.freeze([1, 1, 1, 1, 1, 1, 1])
        ]),

        formationMovement: Object.freeze({
            speed: 75,
            maxOffsetX: 60
        }),

        itemDropRate: 0.22,
        harmfulItemChance: 0.25,
        extraLifeDropLimit: 1,

        itemTypes: Object.freeze([
            // Có lợi (Xanh lá)
            ITEM_TYPES.EXTRA_LIFE,
            ITEM_TYPES.EXPAND_PADDLE,
            ITEM_TYPES.SLOW_BALL,
            ITEM_TYPES.ADD_ONE_BALL,

            // Có hại (Đỏ)
            ITEM_TYPES.SHRINK_PADDLE,
            ITEM_TYPES.FAST_BALL
        ])
    }),

    Object.freeze({
        id: 5,
        name: "Vụ nổ dây chuyền",
        description: "Nhắm vào từng cụm gạch nổ để dọn đường và tránh vật phẩm đỏ rơi từ vụ nổ. Tốc độ bóng: 1.12x.",
        speedMultiplier: 1.12,

        brickLayout: Object.freeze([
            Object.freeze([3, 3, 3, 3, 3, 3, 3]),
            Object.freeze([3, 1, 3, 3, 3, 1, 3]),
            Object.freeze([2, 3, 3, 3, 3, 3, 2]),
            Object.freeze([2, 1, 3, 3, 3, 1, 2]),
            Object.freeze([1, 2, 2, 3, 2, 2, 1]),
            Object.freeze([0, 1, 2, 2, 2, 1, 0])
        ]),

        formationMovement: Object.freeze({
            speed: 80,
            maxOffsetX: 65
        }),

        explosiveCells: Object.freeze([
            Object.freeze([1, 1]),
            Object.freeze([1, 5]),
            Object.freeze([3, 1]),
            Object.freeze([3, 5])
        ]),

        itemDropRate: 0.23,
        harmfulItemChance: 0.35,
        extraLifeDropLimit: 1,

        itemTypes: Object.freeze([
            // Có lợi (Xanh lá)
            ITEM_TYPES.EXTRA_LIFE,
            ITEM_TYPES.EXPAND_PADDLE,
            ITEM_TYPES.SLOW_BALL,
            ITEM_TYPES.ADD_ONE_BALL,

            // Có hại (Đỏ)
            ITEM_TYPES.SHRINK_PADDLE,
            ITEM_TYPES.FAST_BALL
        ])
    }),

    Object.freeze({
        id: 6,
        name: "Bức tường hạ dần",
        description: "Tường gạch hạ 18 px mỗi 12 giây. Theo dõi đếm ngược và phá gạch trước khi khoảng phản ứng thu hẹp. Không có vật phẩm thêm mạng. Tốc độ bóng: 1.16x.",
        speedMultiplier: 1.16,
        paddleWidth: 110,

        brickLayout: Object.freeze([
            Object.freeze([3, 3, 3, 3, 3, 3, 3]),
            Object.freeze([3, 3, 3, 3, 3, 3, 3]),
            Object.freeze([2, 3, 3, 3, 3, 3, 2]),
            Object.freeze([2, 2, 3, 3, 3, 2, 2]),
            Object.freeze([1, 2, 2, 3, 2, 2, 1]),
            Object.freeze([0, 2, 2, 2, 2, 2, 0])
        ]),

        formationMovement: Object.freeze({
            speed: 85,
            maxOffsetX: 65
        }),

        descendingWall: Object.freeze({
            stepInterval: 12,
            stepDistance: 18,
            maxOffsetY: 126
        }),

        explosiveCells: Object.freeze([
            Object.freeze([1, 2]),
            Object.freeze([4, 4])
        ]),

        itemDropRate: 0.24,
        harmfulItemChance: 0.40,
        extraLifeDropLimit: 0,

        itemTypes: Object.freeze([
            // Có lợi (Xanh lá)
            ITEM_TYPES.EXPAND_PADDLE,
            ITEM_TYPES.SLOW_BALL,
            ITEM_TYPES.ADD_ONE_BALL,

            // Có hại (Đỏ)
            ITEM_TYPES.SHRINK_PADDLE,
            ITEM_TYPES.FAST_BALL
        ])
    }),

    Object.freeze({
        id: 7,
        name: "Pháo đài thép",
        description: "Đưa bóng qua các lối mở của pháo đài thép di động. Thanh đỡ hẹp hơn, ít bom và có vật phẩm trừ mạng. Tốc độ bóng: 1.20x.",
        speedMultiplier: 1.20,
        paddleWidth: 100,

        brickLayout: Object.freeze([
            Object.freeze([3, 3, 3, 3, 3, 3, 3]),
            Object.freeze([3, 3, 3, 1, 3, 3, 3]),
            Object.freeze([3, 3, 0, 3, 0, 3, 3]),
            Object.freeze([1, 3, 3, 3, 3, 3, 1]),
            Object.freeze([3, 3, 3, 1, 3, 3, 3]),
            Object.freeze([0, 2, 3, 3, 3, 2, 0]),
            Object.freeze([0, 2, 2, 2, 2, 2, 0])
        ]),

        formationMovement: Object.freeze({
            speed: 90,
            maxOffsetX: 60
        }),

        steelCells: Object.freeze([
            Object.freeze([0, 1]),
            Object.freeze([0, 5]),
            Object.freeze([2, 3]),
            Object.freeze([3, 0]),
            Object.freeze([3, 6])
        ]),

        explosiveCells: Object.freeze([
            Object.freeze([1, 3]),
            Object.freeze([4, 3])
        ]),

        itemDropRate: 0.25,
        harmfulItemChance: 0.45,
        extraLifeDropLimit: 0,

        itemTypes: Object.freeze([
            // Có lợi (Xanh lá)
            ITEM_TYPES.EXPAND_PADDLE,
            ITEM_TYPES.SLOW_BALL,
            ITEM_TYPES.ADD_ONE_BALL,

            // Có hại (Đỏ)
            ITEM_TYPES.LOSE_LIFE,
            ITEM_TYPES.SHRINK_PADDLE,
            ITEM_TYPES.FAST_BALL
        ])
    }),

    Object.freeze({
        id: 8,
        name: "Trận chiến sức mạnh",
        description: "Bản chơi thử: cơ chế sức mạnh đang phát triển. Màn này hiện sử dụng bố cục gạch cơ bản.",
        inDevelopment: true
    }),

    Object.freeze({
        id: 9,
        name: "Vùng trọng lực",
        description: "Bản chơi thử: cơ chế trọng lực đang phát triển. Màn này hiện sử dụng bố cục gạch cơ bản.",
        inDevelopment: true
    }),

    Object.freeze({
        id: 10,
        name: "Trùm cuối",
        description: "Bản chơi thử: trận đấu với trùm đang phát triển. Màn này hiện sử dụng bố cục gạch cơ bản.",
        inDevelopment: true
    })
]);


let lastTime=0;
let lives=INITIAL_LIVES;
let score=0;
let gameState = GAME_STATES.LEVEL_SELECT;
let stateBeforePause = GAME_STATES.PLAYING;
let currentLevelIndex = 0;
let selectedLevelIndex = 0;
let bricks = [];
let balls = [];
let brickFormationOffsetX = 0;
let brickFormationDirection = 1;
let brickFormationOffsetY = 0;
let brickDescendTimer = 0;
let items = [];
let extraLifeDrops = 0;
let levelTime = 0;
let paddleEffectTimer = 0;
let paddleEffectType = null;
let ballEffectTimer = 0;
let ballEffectType = null;


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

    if (event.code === "Space") {
        event.preventDefault();

        if (!event.repeat) {
            launchBalls();
        }

        return;
    }

    if (event.key.toLowerCase() === "p") {
        pauseGame();
        return;
    }

    if (event.key.toLowerCase() === "c") {
        continueGame();
        return;
    }

    if (
        gameState !== GAME_STATES.PLAYING &&
        gameState !== GAME_STATES.READY
    ) {
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
        (gameState !== GAME_STATES.PLAYING && gameState !== GAME_STATES.READY) ||
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

canvas.addEventListener("click", () => {
    launchBalls();
});

function pauseWhenInactive() {
    resetPaddleInput();
    pauseGame();
    lastTime = 0;
}

window.addEventListener("blur", pauseWhenInactive);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pauseWhenInactive();
    }
});

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
        velocityY,
        brickContacts: new Set()
    };
}

function createLevelMenu() {
    for (const [index, level] of LEVELS.entries()) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "level-card";

        const number = document.createElement("span");
        number.className = "level-card-number";
        number.textContent = `Màn ${level.id}`;

        const name = document.createElement("strong");
        name.className = "level-card-name";
        name.textContent = level.name;

        button.append(number, name);

        if (level.inDevelopment) {
            button.classList.add("level-card-in-development");

            const status = document.createElement("span");
            status.className = "level-card-status";
            status.textContent = "Đang phát triển";
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

    levelMenu.title.textContent = `Màn ${level.id}: ${level.name}`;
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

    prepareBallLaunch();
    canvas.focus({ preventScroll: true });
}

function attachBallsToPaddle() {
    for (const ball of balls) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 2;
    }
}

function prepareBallLaunch() {
    resetPaddleInput();
    attachBallsToPaddle();
    gameState = GAME_STATES.READY;
    updateHud();
}

function launchBalls() {
    if (gameState !== GAME_STATES.READY) {
        return;
    }

    gameState = GAME_STATES.PLAYING;
    lastTime = 0;
    updateHud();
}

function pauseGame() {
    if (
        gameState !== GAME_STATES.PLAYING &&
        gameState !== GAME_STATES.READY
    ) {
        return;
    }

    stateBeforePause = gameState;
    resetPaddleInput();
    gameState = GAME_STATES.PAUSED;
    updateHud();
}

function continueGame() {
    if (gameState !== GAME_STATES.PAUSED) {
        return;
    }

    gameState = stateBeforePause;
    lastTime = 0;
    updateHud();
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
    updateHud();
}

function applyLoseLifeEffect() {
    lives--;
    if (lives <= 0) {
        lives = 0;
        gameState = GAME_STATES.GAME_OVER;
        return;
    }
    updateHud();
}

function getBasePaddleWidth() {
    const currentLevel = typeof getCurrentLevel === "function" ? getCurrentLevel() : null;
    return (currentLevel && typeof currentLevel.paddleWidth === "number" && currentLevel.paddleWidth > 0)
        ? currentLevel.paddleWidth
        : PADDLE_BASE_WIDTH;
}

function setPaddleWidth(newWidth) {
    const paddleCenter = paddle.x + paddle.width / 2;
    paddle.width = newWidth;
    paddle.x = paddleCenter - paddle.width / 2;
    clampPaddleToCanvas();
}

function resetPaddleWidth() {
    setPaddleWidth(getBasePaddleWidth());
    paddleEffectTimer = 0;
    paddleEffectType = null;
}

function applyExpandPaddleEffect() {
    paddleEffectTimer = HELPFUL_EFFECT_DURATION;
    paddleEffectType = ITEM_TYPES.EXPAND_PADDLE;
    const targetWidth = Math.min(
        getBasePaddleWidth() + PADDLE_EXPAND_AMOUNT,
        PADDLE_MAX_WIDTH
    );
    setPaddleWidth(targetWidth);
}

function applyShrinkPaddleEffect() {
    paddleEffectTimer = HARMFUL_EFFECT_DURATION;
    paddleEffectType = ITEM_TYPES.SHRINK_PADDLE;
    const targetWidth = Math.max(
        getBasePaddleWidth() - PADDLE_EXPAND_AMOUNT,
        PADDLE_MIN_WIDTH
    );
    setPaddleWidth(targetWidth);
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

function getBaseBallSpeed() {
    const baseSpeed = Math.hypot(BALL_INITIAL_VELOCITY_X, BALL_INITIAL_VELOCITY_Y);
    return baseSpeed * getLevelSpeedMultiplier();
}

function resetBallSpeed() {
    const baseSpeed = getBaseBallSpeed();
    for (const ball of balls) {
        setBallSpeed(ball, baseSpeed);
    }
    ballEffectTimer = 0;
    ballEffectType = null;
}

function resetItemEffects() {
    resetPaddleWidth();
    resetBallSpeed();
}

function updateItemTimers(deltaTime) {
    if (paddleEffectTimer > 0) {
        paddleEffectTimer -= deltaTime;
        if (paddleEffectTimer <= 0) {
            resetPaddleWidth();
        }
    }

    if (ballEffectTimer > 0) {
        ballEffectTimer -= deltaTime;
        if (ballEffectTimer <= 0) {
            resetBallSpeed();
        }
    }
}

function applySlowBallEffect() {
    ballEffectTimer = HELPFUL_EFFECT_DURATION;
    ballEffectType = ITEM_TYPES.SLOW_BALL;
    const targetSpeed = Math.max(
        MIN_BALL_SPEED,
        getBaseBallSpeed() * SLOW_BALL_MULTIPLIER
    );
    for (const ball of balls) {
        setBallSpeed(ball, targetSpeed);
    }
}

function applyFastBallEffect() {
    ballEffectTimer = HARMFUL_EFFECT_DURATION;
    ballEffectType = ITEM_TYPES.FAST_BALL;
    const targetSpeed = Math.min(
        MAX_BALL_SPEED,
        getBaseBallSpeed() * FAST_BALL_MULTIPLIER
    );
    for (const ball of balls) {
        setBallSpeed(ball, targetSpeed);
    }
}


function spawnExtraBalls(count) {
    if (balls.length === 0 || balls.length >= MAX_ACTIVE_BALLS) {
        return;
    }

    const availableSlots = MAX_ACTIVE_BALLS - balls.length;
    const spawnCount = Math.min(count, availableSlots);
    const sourceBall = balls[0];
    const currentSpeed =
        Math.hypot(sourceBall.velocityX, sourceBall.velocityY) ||
        getBaseBallSpeed();
    const baseAngle = Math.atan2(sourceBall.velocityX, -sourceBall.velocityY);

    for (let i = 0; i < spawnCount; i++) {
        const sign = i % 2 === 0 ? 1 : -1;
        const offset = ((Math.floor(i / 2) + 1) * Math.PI) / 7;
        const angle = baseAngle + sign * offset;

        const velocityX = currentSpeed * Math.sin(angle);
        const velocityY = -currentSpeed * Math.cos(angle);

        const newBall = createBall(
            sourceBall.x,
            sourceBall.y,
            velocityX,
            velocityY
        );
        // Bóng mới cũng cần góc bay đủ dốc để không trôi ngang quá lâu.
        limitBallAngle(newBall, 0, 0);
        balls.push(newBall);
    }

    updateHud();
}

function applyItemEffect(type) {
    switch (type) {
        case ITEM_TYPES.EXTRA_LIFE:
            applyExtraLifeEffect();
            break;

        case ITEM_TYPES.LOSE_LIFE:
            applyLoseLifeEffect();
            break;

        case ITEM_TYPES.EXPAND_PADDLE:
            applyExpandPaddleEffect();
            break;

        case ITEM_TYPES.SHRINK_PADDLE:
            applyShrinkPaddleEffect();
            break;

        case ITEM_TYPES.SLOW_BALL:
            applySlowBallEffect();
            break;

        case ITEM_TYPES.FAST_BALL:
            applyFastBallEffect();
            break;

        case ITEM_TYPES.ADD_ONE_BALL:
            spawnExtraBalls(1);
            break;

        case ITEM_TYPES.ADD_TWO_BALLS:
            spawnExtraBalls(2);
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

function getLevelSpeedMultiplier() {
    const currentLevel = getCurrentLevel();

    if (
        currentLevel &&
        typeof currentLevel.speedMultiplier === "number" &&
        currentLevel.speedMultiplier > 0
    ) {
        return currentLevel.speedMultiplier;
    }

    return 1.0;
}

function createSingleInitialBall() {
    const horizontalDirection =
        Math.random() < 0.5 ? -1 : 1;
    const speedMultiplier = getLevelSpeedMultiplier();

    return createBall(
        paddle.x + paddle.width / 2,
        paddle.y - BALL_RADIUS - 2,

        BALL_INITIAL_VELOCITY_X *
        horizontalDirection *
        speedMultiplier,

        BALL_INITIAL_VELOCITY_Y *
        speedMultiplier
    );
}

function createMultiballSet(ballCount) {
    const createdBalls = [];

    const spawnX =
        paddle.x + paddle.width / 2;

    const spawnY =
        paddle.y - BALL_RADIUS - 2;

    const speedMultiplier = getLevelSpeedMultiplier();
    const initialSpeed =
        Math.hypot(
            BALL_INITIAL_VELOCITY_X,
            BALL_INITIAL_VELOCITY_Y
        ) * speedMultiplier;

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

function handlePaddleCollision(ball) {
    // Chỉ đỡ bóng đang rơi từ phía trên, không cứu bóng đã lọt xuống dưới.
    if (ball.velocityY <= 0 || ball.y > paddle.y) {
        return;
    }

    // Tìm điểm gần tâm bóng nhất trên mép trên của thanh đỡ.
    const closestX = Math.max(
        paddle.x,
        Math.min(ball.x, paddle.x + paddle.width)
    );
    const distanceX = ball.x - closestX;
    const distanceY = ball.y - paddle.y;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    // Kiểm tra bằng bán kính thật để tránh nhận nhầm va chạm ở góc.
    if (distanceSquared > ball.radius * ball.radius) {
        return;
    }

    ball.y = paddle.y - ball.radius - COLLISION_GAP;

    const paddleCenter = paddle.x + paddle.width / 2;
    const hitPosition = (ball.x - paddleCenter) / (paddle.width / 2);
    const clampedHitPosition = Math.max(-1, Math.min(1, hitPosition));

    let bounceAngle = clampedHitPosition * MAX_BOUNCE_ANGLE;

    if (Math.abs(bounceAngle) < MIN_BOUNCE_ANGLE) {
        let direction = Math.sign(clampedHitPosition);

        if (direction === 0) {
            direction = Math.sign(ball.velocityX);
        }

        if (direction === 0) {
            direction = Math.random() < 0.5 ? -1 : 1;
        }

        bounceAngle = direction * MIN_BOUNCE_ANGLE;
    }

    const speed = Math.hypot(ball.velocityX, ball.velocityY);

    ball.velocityX = speed * Math.sin(bounceAngle);
    ball.velocityY = -speed * Math.cos(bounceAngle);
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
                baseY: y,

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
    // Trong cùng một nhóm, trọng số lớn hơn có cơ hội được chọn cao hơn.
    const totalWeight = itemTypes.reduce(
        (total, type) => total + ITEM_WEIGHTS[type],
        0
    );
    let randomWeight = Math.random() * totalWeight;

    for (const type of itemTypes) {
        randomWeight -= ITEM_WEIGHTS[type];
        if (randomWeight < 0) {
            return type;
        }
    }

    return itemTypes[itemTypes.length - 1];
}

function canDropItem(type) {
    if (type === ITEM_TYPES.EXTRA_LIFE) {
        return lives < MAX_LIVES && extraLifeDrops < getCurrentLevel().extraLifeDropLimit;
    }

    if (type === ITEM_TYPES.ADD_ONE_BALL) {
        return balls.length < MAX_ACTIVE_BALLS;
    }

    return true;
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

    const availableTypes = itemTypes.filter(canDropItem);
    if (availableTypes.length === 0) {
        return;
    }

    // Chọn nhóm trước, rồi chọn vật phẩm để kiểm soát lượng trợ giúp mỗi màn.
    const dropHarmfulItem = Math.random() < currentLevel.harmfulItemChance;
    const groupTypes = availableTypes.filter(
        type => HARMFUL_ITEM_TYPES.includes(type) === dropHarmfulItem
    );
    const type = getRandomItemType(groupTypes.length > 0 ? groupTypes : availableTypes);

    if (type === ITEM_TYPES.EXTRA_LIFE) {
        extraLifeDrops++;
    }

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
    extraLifeDrops = 0;
}

function resetPaddleInput() {
    paddle.moveLeft = false;
    paddle.moveRight = false;
    paddle.mouseTargetX = null;
}

function resetPaddle() {
    paddle.width = getBasePaddleWidth();
    paddle.x = (canvas.width - paddle.width) / 2;
    paddleEffectTimer = 0;
    paddleEffectType = null;
    resetPaddleInput();
}

function resetBalls() {
    ballEffectTimer = 0;
    ballEffectType = null;
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
    levelTime = 0;

    resetItemEffects();
    resetPaddle();
    resetBalls();
    resetBricks();
    resetItems();
}

function restartGame(){
    startLevel(currentLevelIndex);
}

function handleAllBallsMissed() {
    lives--;
    resetItemEffects();

    if (lives <= 0) {
        lives = 0;
        gameState =
            GAME_STATES.GAME_OVER;

        return;
    }

    resetBalls();
    prepareBallLaunch();
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

function resolveBrickCollision(ball, brick) {
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;
    const distance = Math.hypot(distanceX, distanceY);

    let normalX = 0;
    let normalY = 0;
    let overlap = ball.radius - distance;

    if (distance > 0) {
        // Hướng từ điểm gần nhất trên gạch ra tâm bóng.
        normalX = distanceX / distance;
        normalY = distanceY / distance;
    } else {
        // Nếu tâm bóng đã nằm trong gạch, đẩy ra qua cạnh gần nhất.
        const toLeft = ball.x - brick.x;
        const toRight = brick.x + brick.width - ball.x;
        const toTop = ball.y - brick.y;
        const toBottom = brick.y + brick.height - ball.y;
        const nearestEdge = Math.min(toLeft, toRight, toTop, toBottom);

        if (nearestEdge === toTop) {
            normalY = -1;
        } else if (nearestEdge === toBottom) {
            normalY = 1;
        } else if (nearestEdge === toLeft) {
            normalX = -1;
        } else {
            normalX = 1;
        }

        overlap = ball.radius + nearestEdge;
    }

    ball.x += normalX * (overlap + COLLISION_GAP);
    ball.y += normalY * (overlap + COLLISION_GAP);

    const speedIntoSurface = ball.velocityX * normalX + ball.velocityY * normalY;

    // Bóng đang rời gạch thì chỉ tách ra, không tính thêm lần chạm.
    if (speedIntoSurface >= 0) {
        return false;
    }

    // Phản xạ theo hướng vuông góc với mặt va chạm, giữ nguyên tốc độ.
    ball.velocityX -= 2 * speedIntoSurface * normalX;
    ball.velocityY -= 2 * speedIntoSurface * normalY;
    limitBallAngle(ball, normalX, normalY);

    return true;
}

function limitBallAngle(ball, normalX, normalY) {
    const angle = Math.atan2(Math.abs(ball.velocityX), Math.abs(ball.velocityY));

    if (angle >= MIN_BOUNCE_ANGLE && angle <= MAX_BOUNCE_ANGLE) {
        return;
    }

    // Tránh bóng bay quá ngang hoặc quá dọc sau khi chạm góc gạch.
    const limitedAngle = Math.max(MIN_BOUNCE_ANGLE, Math.min(MAX_BOUNCE_ANGLE, angle));
    const speed = Math.hypot(ball.velocityX, ball.velocityY);
    const directionX = Math.sign(ball.velocityX) || Math.sign(normalX) || 1;
    const directionY = Math.sign(ball.velocityY) || Math.sign(normalY) || -1;

    ball.velocityX = directionX * speed * Math.sin(limitedAngle);
    ball.velocityY = directionY * speed * Math.cos(limitedAngle);

    // Góc mới vẫn phải hướng ra ngoài gạch.
    if (ball.velocityX * normalX + ball.velocityY * normalY < 0) {
        if (ball.velocityX * normalX < 0) {
            ball.velocityX *= -1;
        }

        if (ball.velocityY * normalY < 0) {
            ball.velocityY *= -1;
        }
    }
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
        return GAME_COLORS.steelBrick;
    }

    if (
        brick.type ===
        BRICK_TYPES.EXPLOSIVE
    ) {
        return GAME_COLORS.explosiveBrick;
    }

    return (
        BRICK_STYLES[brick.maxHp] ||
        GAME_COLORS.brickOneHit
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
        0.8 +
        healthRatio * 0.2
    );
}

function handleBrickCollisions(ball) {
    const contacts = new Set();

    // Kiểm tra lại vì việc tách khỏi một viên có thể chạm viên bên cạnh.
    for (let pass = 0; pass < MAX_COLLISION_PASSES; pass++) {
        let foundCollision = false;

        for (const brick of bricks) {
            if (brick.destroyed || !isBallCollidingWithBrick(ball, brick)) {
                continue;
            }

            foundCollision = true;
            const isNewContact = !ball.brickContacts.has(brick) && !contacts.has(brick);
            contacts.add(brick);
            const bounced = resolveBrickCollision(ball, brick);

            if (bounced && isNewContact) {
                const wasDestroyed = damageBrick(brick);

                if (wasDestroyed) {
                    handleBrickDestroyed(brick);
                }
            }
        }

        if (!foundCollision) {
            break;
        }
    }

    ball.brickContacts = contacts;
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

function dropHarmfulItemFromExplosion(sourceBrick) {
    const debuffTypes = getCurrentLevel().itemTypes.filter(
        type => HARMFUL_ITEM_TYPES.includes(type)
    );

    const type = getRandomItemType(debuffTypes);

    items.push({
        type,
        x:
            sourceBrick.x +
            sourceBrick.width / 2 -
            ITEM_CONFIG.width / 2,
        y:
            sourceBrick.y +
            sourceBrick.height / 2 -
            ITEM_CONFIG.height / 2,
        width: ITEM_CONFIG.width,
        height: ITEM_CONFIG.height,
        fallSpeed: ITEM_CONFIG.fallSpeed * 1.2
    });
}

function triggerBrickExplosion(sourceBrick) {
    dropHarmfulItemFromExplosion(sourceBrick);

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

function getCurrentDescendingWall() {
    const currentLevel = getCurrentLevel();

    if (
        !currentLevel.descendingWall ||
        typeof currentLevel.descendingWall.stepInterval !== "number" ||
        typeof currentLevel.descendingWall.stepDistance !== "number"
    ) {
        return null;
    }

    return currentLevel.descendingWall;
}

function resetBrickFormationMovement() {
    brickFormationOffsetX = 0;
    brickFormationDirection = 1;
    brickFormationOffsetY = 0;
    brickDescendTimer = 0;
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
            // Dừng ngay nếu vật phẩm trừ mạng đã kết thúc ván chơi.
            if (gameState === GAME_STATES.GAME_OVER) {
                items = [];
                return;
            }
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

    const descending =
        getCurrentDescendingWall();

    if (!movement && !descending) {
        return;
    }

    if (movement) {
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
    }

    if (descending && brickFormationOffsetY < descending.maxOffsetY) {
        brickDescendTimer += deltaTime;
        while (brickDescendTimer >= descending.stepInterval &&
               brickFormationOffsetY < descending.maxOffsetY) {
            brickDescendTimer -= descending.stepInterval;
            brickFormationOffsetY = Math.min(
                descending.maxOffsetY,
                brickFormationOffsetY + descending.stepDistance
            );
        }
    }

    for (const brick of bricks) {
        brick.x =
            brick.baseX +
            brickFormationOffsetX;

        brick.y =
            (brick.baseY !== undefined ? brick.baseY : brick.y) +
            brickFormationOffsetY;
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
    ball.x +=
        ball.velocityX * deltaTime;

    ball.y +=
        ball.velocityY * deltaTime;

    handleWallCollision(ball);
    handlePaddleCollision(ball);

    handleBrickCollisions(ball);

    return hasBallMissed(ball);
}

function update(deltaTime) {
    if (
        deltaTime <= 0 ||
        (gameState !== GAME_STATES.PLAYING && gameState !== GAME_STATES.READY)
    ) {
        return;
    }

    // Chia khung hình chậm thành các bước nhỏ để bóng không nhảy qua vật cản.
    const frameTime = Math.min(deltaTime, MAX_FRAME_TIME);
    const stepCount = Math.ceil(frameTime / PHYSICS_STEP);
    const stepTime = frameTime / stepCount;
    const initialState = gameState;

    for (let step = 0; step < stepCount; step++) {
        updateGameStep(stepTime);

        if (gameState !== initialState) {
            break;
        }
    }
}

function updateGameStep(deltaTime) {
    if (gameState === GAME_STATES.READY) {
        updatePaddle(deltaTime);
        attachBallsToPaddle();
        return;
    }

    if (gameState !== GAME_STATES.PLAYING) {
        return;
    }

    levelTime += deltaTime;
    updateItemTimers(deltaTime);

    updatePaddle(deltaTime);
    updateBrickFormation(deltaTime);
    updateBalls(deltaTime);

    if (gameState !== GAME_STATES.PLAYING) {
        return;
    }

    updateItems(deltaTime);

    checkLevelCompletion();
}


function drawPaddle() {
    ctx.fillStyle = GAME_COLORS.paddle;

    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );
}

function drawBall(ball) {
    ctx.save();

    const gradient = ctx.createRadialGradient(
        ball.x - ball.radius * 0.35,
        ball.y - ball.radius * 0.35,
        0,
        ball.x,
        ball.y,
        ball.radius
    );
    gradient.addColorStop(0, GAME_COLORS.ballHighlight);
    gradient.addColorStop(0.55, GAME_COLORS.ball);
    gradient.addColorStop(1, GAME_COLORS.ballShadow);

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius - 0.5,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = GAME_COLORS.ballShadow;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.closePath();
    ctx.restore();
}

function drawBalls() {
    for (const ball of balls) {
        drawBall(ball);
    }
}

function setHudText(element, value) {
    if (!element) {
        return;
    }

    const text = String(value);

    if (element.textContent !== text) {
        element.textContent = text;
    }
}

function formatTime(totalSeconds) {
    const total = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateHud() {
    const isLevelSelect =
        gameState === GAME_STATES.LEVEL_SELECT;

    hud.container.hidden = isLevelSelect;
    hud.controls.hidden = isLevelSelect;
    levelMenu.container.hidden = !isLevelSelect;
    gameView.board.hidden = isLevelSelect;
    gameView.readyMessage.hidden = gameState !== GAME_STATES.READY;
    gameView.pausedMessage.hidden = gameState !== GAME_STATES.PAUSED;

    if (isLevelSelect) {
        return;
    }

    const currentLevel = getCurrentLevel();

    setHudText(hud.lives, lives);
    hud.lives.classList.toggle("is-low", lives <= 1);
    setHudText(hud.score, score);
    setHudText(hud.levelNumber, `Màn ${currentLevel.id} / ${LEVELS.length}`);
    setHudText(hud.levelName, currentLevel.name);
    setHudText(hud.bricks, getRemainingBreakableBrickCount());
    setHudText(hud.balls, balls.length);

    const descendingWall = getCurrentDescendingWall();
    hud.wallTimer.hidden = !descendingWall;
    if (descendingWall) {
        const hasStopped = brickFormationOffsetY >= descendingWall.maxOffsetY;
        const remaining = Math.ceil(descendingWall.stepInterval - brickDescendTimer);
        setHudText(hud.wallTimer, hasStopped ? "Tường hạ: đã dừng" : `Tường hạ: ${remaining}s`);
        hud.wallTimer.classList.toggle("is-warning", !hasStopped && remaining <= 2);
    }

    if (hud.time) {
        setHudText(hud.time, formatTime(levelTime));
    }

    if (hud.itemTimer && hud.itemTimerValue) {
        const activeEffects = [];
        if (paddleEffectTimer > 0 && paddleEffectType) {
            const label = paddleEffectType === ITEM_TYPES.EXPAND_PADDLE ? "Dài (↔)" : "Ngắn (><)";
            activeEffects.push(`${label} ${Math.ceil(paddleEffectTimer)}s`);
        }
        if (ballEffectTimer > 0 && ballEffectType) {
            const label = ballEffectType === ITEM_TYPES.SLOW_BALL ? "Chậm (↓)" : "Nhanh (↑)";
            activeEffects.push(`${label} ${Math.ceil(ballEffectTimer)}s`);
        }

        if (activeEffects.length > 0) {
            hud.itemTimer.hidden = false;
            setHudText(hud.itemTimerValue, activeEffects.join(" | "));
        } else {
            hud.itemTimer.hidden = true;
        }
    }
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
    ctx.save();
    ctx.strokeStyle = GAME_COLORS.border;
    ctx.lineWidth = 1;

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

        ctx.globalAlpha = 1;
        ctx.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.width - 1, brick.height - 1);
        drawBrickDetails(brick);
    }

    ctx.restore();
}

function drawBrickDetails(brick) {
    ctx.fillStyle = GAME_COLORS.detail;

    if (brick.type === BRICK_TYPES.STEEL) {
        for (const rivetX of [brick.x + 7, brick.x + brick.width - 7]) {
            ctx.beginPath();
            ctx.arc(rivetX, brick.y + brick.height / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        return;
    }

    let label = brick.maxHp > 1 ? String(brick.hp) : "";

    if (brick.type === BRICK_TYPES.EXPLOSIVE) {
        label = label ? `\u2726 ${label}` : "\u2726";
    }

    if (!label) {
        return;
    }

    ctx.font = "bold 12px Arial";
    ctx.fillStyle = brick.type === BRICK_TYPES.NORMAL
        ? GAME_COLORS.brickLabel
        : GAME_COLORS.detail;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, brick.x + brick.width / 2, brick.y + brick.height / 2);
}

function drawItems() {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const item of items) {
        ctx.fillStyle = ITEM_COLORS[item.type] || GAME_COLORS.brickOneHit;
        ctx.fillRect(
            item.x,
            item.y,
            item.width,
            item.height
        );

        ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
        ctx.strokeRect(item.x + 0.5, item.y + 0.5, item.width - 1, item.height - 1);

        ctx.fillStyle = "#ffffff";

        ctx.fillText(
            ITEM_LABELS[item.type] || "?",
            item.x + item.width / 2,
            item.y + item.height / 2
        );
    }

    ctx.restore();
}

function drawLevelComplete() {
    if (gameState !== GAME_STATES.LEVEL_COMPLETE) {
        return;
    }

    const currentLevel = getCurrentLevel();

    const hasNextLevel = currentLevelIndex < LEVELS.length - 1;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = GAME_COLORS.endOverlay;
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = GAME_COLORS.success;
    ctx.textAlign = "center";

    ctx.font = "42px Arial";
    ctx.fillText(
        hasNextLevel ? "HOÀN THÀNH MÀN!" : "HOÀN THÀNH TRÒ CHƠI!",
        centerX,
        centerY - 35
    );

    ctx.fillStyle = GAME_COLORS.text;
    ctx.font = "24px Arial";
    ctx.fillText(
        currentLevel.name,
        centerX,
        centerY + 10
    );

    ctx.font = "18px Arial";
    ctx.fillText(
        `Điểm: ${score}  |  Thời gian: ${formatTime(levelTime)}`,
        centerX,
        centerY + 50
    );

    ctx.font = "18px Arial";
    ctx.fillText(
        hasNextLevel ? "Nhấn Enter để sang màn tiếp theo" : "Nhấn M để chọn màn khác",
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

    ctx.fillStyle = GAME_COLORS.endOverlay;
    ctx.fillRect(
        0, 0, canvas.width, canvas.height
    );

    ctx.fillStyle = GAME_COLORS.danger;
    ctx.textAlign = "center";

    ctx.font = "48px Arial";
    ctx.fillText("BẠN ĐÃ THUA!", centerX, centerY - 30);

    ctx.fillStyle = GAME_COLORS.text;
    ctx.font = "20px Arial";
    ctx.fillText(`Điểm: ${score}  |  Thời gian: ${formatTime(levelTime)}`, centerX, centerY + 20);


    ctx.font = "18px Arial";
    ctx.fillText("Nhấn R để chơi lại", centerX, centerY + 60);

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

    if (
        gameState === GAME_STATES.PLAYING ||
        gameState === GAME_STATES.READY ||
        gameState === GAME_STATES.PAUSED
    ) {
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
