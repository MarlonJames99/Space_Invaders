const keyCodeLeft = 37;
const keyCodeRight = 39;
const keyCodeSpace = 32;

const gameWidth = 800;
const gameHeight = 600;

const playerWidth = 20;
const playerMaxSpeed = 400;

const gameState = {
    lastTime: Date.now(),
    leftPressed: false,
    rightPressed: false,
    spacePressed: false,
    playerX: 0,
    playerY: 0,
};

function setPosition(el, x, y) {
    el.style.transform = `translate(${x}px, ${y}px)`;
}

function clamp(v, min, max) {
    if (v < min) {
        return min;
    } else if (v > max) {
        return max;
    } else {
        return v;
    }
}

function createPlayer($container) {
    gameState.playerX = gameWidth / 2;
    gameState.playerY = gameHeight - 50;
    const $player = document.createElement("img");
    $player.src = "../img/player-blue-1.png";
    $player.className = "player";
    $container.appendChild($player);
    setPosition($player, gameState.playerX, gameState.playerY);
}

function init() {
    const $container = document.querySelector(".game");
    createPlayer($container);
}

function updatePlayer(dt) {
    if (gameState.leftPressed) {
        gameState.playerX -= dt * playerMaxSpeed;
    }
    if (gameState.rightPressed) {
        gameState.playerX += dt * playerMaxSpeed;
    }

    gameState.playerX = clamp(gameState.playerX, playerWidth, gameWidth - playerWidth);

    const $player = document.querySelector('.player');
    setPosition($player, gameState.playerX, gameState.playerY);
}

function update() {
    const currentTime = Date.now();
    const dt = (currentTime - gameState.lastTime) / 1000;

    updatePlayer(dt);

    gameState.lastTime = currentTime;
    window.requestAnimationFrame(update);
}

function onKeyDown(e) {
    if (e.keyCode === keyCodeLeft) {
        gameState.leftPressed = true;
    } else if (e.keyCode === keyCodeRight) {
        gameState.rightPressed = true;
    } else if (e.keyCode === keyCodeSpace) {
        gameState.spacePressed = true;
    }
}

function onKeyUp(e) {
    if (e.keyCode === keyCodeLeft) {
        gameState.leftPressed = false;
    } else if (e.keyCode === keyCodeRight) {
        gameState.rightPressed = false;
    } else if (e.keyCode === keyCodeSpace) {
        gameState.spacePressed = false;
    }
}

init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);