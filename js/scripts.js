const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_A = 65;
const KEY_CODE_D = 68;
const KEY_CODE_SPACE = 32;
const KEY_CODE_ENTER = 13;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 400;
const LASER_MAX_SPEED = 500;
const LASER_COOL_DOWN = 0.5;

const ENEMIES_PER_ROW = 10;
const ENEMIES_ROWS = 3;
const ENEMIES_TOTAL = ENEMIES_PER_ROW * ENEMIES_ROWS;
const ENEMY_KILL_POINT = 7.5;
const ENEMY_HORIZONTAL_PADDING = 80;
const ENEMY_VERTICAL_PADDING = 70;
const ENEMY_VERTICAL_SPACING = 80;
const ENEMY_COOL_DOWN = 5.0;

const gameState = {
    lastTime: Date.now(),
    leftPressed: false,
    rightPressed: false,
    spacePressed: false,
    playerX: 0,
    playerY: 0,
    playerCooldown: 0,
    lasers: [],
    enemies: [],
    enemyLasers: [],
    aliveEnemies: ENEMIES_TOTAL,
    killedEnemies: 0,
    currentScore: 0,
    highScore: localStorage.getItem('highScore') ?? 0,
    gameOver: false
};

function rectsIntersect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

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

function rand(min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1;
    return min + Math.random() * (max - min);
}

function createPlayer($container) {
    gameState.playerX = GAME_WIDTH / 2;
    gameState.playerY = GAME_HEIGHT - 50;
    const $player = document.createElement("img");
    $player.src = "./img/player-blue-1.png";
    $player.className = "player";
    $container.appendChild($player);
    setPosition($player, gameState.playerX, gameState.playerY);
}

function destroyPlayer($container, player) {
    $container.removeChild(player);
    gameState.gameOver = true;
    const audio = new Audio("./sound/sfx-lose.ogg");
    audio.play();
}

function updatePlayer(dt, $container) {
    if (gameState.leftPressed) {
        gameState.playerX -= dt * PLAYER_MAX_SPEED;
    }
    if (gameState.rightPressed) {
        gameState.playerX += dt * PLAYER_MAX_SPEED;
    }

    gameState.playerX = clamp(
        gameState.playerX, 
        PLAYER_WIDTH, 
        GAME_WIDTH - PLAYER_WIDTH
    );

    if (gameState.spacePressed && gameState.playerCooldown <= 0) {
        createLaser($container, gameState.playerX, gameState.playerY);
        gameState.playerCooldown = LASER_COOL_DOWN;
    }
    if (gameState.playerCooldown > 0) {
        gameState.playerCooldown -= dt;
    }

    const $player = document.querySelector('.player');
    setPosition($player, gameState.playerX, gameState.playerY);
}

function updateStats() {
    if (localStorage.getItem('highScore') < gameState.currentScore) {
        localStorage.setItem('highScore', gameState.currentScore)
        gameState.highScore = gameState.currentScore
    }

    document.querySelector('.enemy-remaining').innerHTML = gameState.aliveEnemies
    document.querySelector('.enemy-killed').innerHTML = gameState.killedEnemies
    document.querySelector('.current-score').innerHTML = gameState.currentScore
    document.querySelector('.high-score').innerHTML = gameState.highScore
}

function createLaser($container, x, y) {
    const $element = document.createElement("img");
    $element.src = "./img/laser-blue-1.png";
    $element.className = "laser";
    $container.appendChild($element);
    const laser = { x, y, $element };
    gameState.lasers.push(laser);
    setPosition($element, x, y);
    const audio = new Audio("./sound/sfx-laser1.ogg");
    audio.play();
}

function updateLasers(dt, $container) {
    const lasers = gameState.lasers;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y -= dt * LASER_MAX_SPEED;
        if (laser.y < 0) {
            destroyLaser($container, laser);
        }
        setPosition(laser.$element, laser.x, laser.y);
        const r1 = laser.$element.getBoundingClientRect();
        const enemies = gameState.enemies;
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (enemy.isDead) continue;
            const r2 = enemy.$element.getBoundingClientRect();
            if (rectsIntersect(r1, r2)) {
                // Enemy was hit.
                destroyEnemy($container, enemy);
                destroyLaser($container, laser);
                break;
            }
        }
    }
    gameState.lasers = gameState.lasers.filter(e => !e.isDead);
}

function destroyLaser($container, laser) {
    $container.removeChild(laser.$element);
    laser.isDead = true;
}

function createEnemy($container, x, y) {
    const $element = document.createElement("img");
    $element.src = "./img/enemy-orange-1.png";
    $element.className = "enemy";
    $container.appendChild($element);
    const enemy = {
        x,
        y,
        cooldown: rand(0.5, ENEMY_COOL_DOWN),
        $element
    };
    gameState.enemies.push(enemy);
    setPosition($element, x, y);
}

function updateEnemies(dt, $container) {
    const dx = Math.sin(gameState.lastTime / 1000.0) * 50;
    const dy = Math.cos(gameState.lastTime / 1000.0) * 10;

    const enemies = gameState.enemies;
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const x = enemy.x + dx;
        const y = enemy.y + dy;
        setPosition(enemy.$element, x, y);
        enemy.cooldown -= dt;
        if (enemy.cooldown <= 0) {
            createEnemyLaser($container, x, y);
            enemy.cooldown = ENEMY_COOL_DOWN;
        }
    }
    gameState.enemies = gameState.enemies.filter(e => !e.isDead);
}

function destroyEnemy($container, enemy) {
    $container.removeChild(enemy.$element);
    enemy.isDead = true;
    gameState.aliveEnemies--;
    gameState.killedEnemies++;
    gameState.currentScore += ENEMY_KILL_POINT;
    updateStats()
}

function createEnemyLaser($container, x, y) {
    const $element = document.createElement("img");
    $element.src = "./img/laser-red-5.png";
    $element.className = "enemy-laser";
    $container.appendChild($element);
    const laser = { x, y, $element };
    gameState.enemyLasers.push(laser);
    setPosition($element, x, y);
}

function updateEnemyLasers(dt, $container) {
    const lasers = gameState.enemyLasers;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y += dt * LASER_MAX_SPEED;
        if (laser.y > GAME_HEIGHT) {
            destroyLaser($container, laser);
        }
        setPosition(laser.$element, laser.x, laser.y);
        const r1 = laser.$element.getBoundingClientRect();
        const player = document.querySelector(".player");
        const r2 = player.getBoundingClientRect();
        if (rectsIntersect(r1, r2)) {
            // Player was hit
            destroyPlayer($container, player);
            break;
        }
    }
    gameState.enemyLasers = gameState.enemyLasers.filter(e => !e.isDead);
}

function init() {
    const $container = document.querySelector(".game");
    createPlayer($container);

    const enemySpacing = (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) /
        (ENEMIES_PER_ROW - 1);
    for (let j = 0; j < ENEMIES_ROWS; j++) {
        const y = ENEMY_VERTICAL_PADDING + j * ENEMY_VERTICAL_SPACING;
        for (let i = 0; i < ENEMIES_PER_ROW; i++) {
            const x = i * enemySpacing + ENEMY_HORIZONTAL_PADDING;
            createEnemy($container, x, y);
        }
    }

    updateStats()
}

function playerHasWon() {
    return gameState.enemies.length === 0;
}

function update(e) {
    const currentTime = Date.now();
    const dt = (currentTime - gameState.lastTime) / 1000.0;

    if (gameState.gameOver) {
        document.querySelector(".game-over").style.display = "block";
        return;
    }

    if (playerHasWon()) {
        document.querySelector(".congratulations").style.display = "block";
        return;
    }

    const $container = document.querySelector(".game");
    updatePlayer(dt, $container);
    updateLasers(dt, $container);
    updateEnemies(dt, $container);
    updateEnemyLasers(dt, $container);

    gameState.lastTime = currentTime;
    window.requestAnimationFrame(update);
}

const moviment = {
    isLeft: (e) => [KEY_CODE_LEFT, KEY_CODE_A].includes(e.keyCode),
    isRight: (e) => [KEY_CODE_RIGHT, KEY_CODE_D].includes(e.keyCode)
}

function onKeyDown(e) {
    if (moviment.isLeft(e)) {
        gameState.leftPressed = true;
    } else if (moviment.isRight(e)) {
        gameState.rightPressed = true;
    } else if (e.keyCode === KEY_CODE_SPACE) {
        gameState.spacePressed = true;
    }
}

function isModalVisible() {
    return !!document.querySelector("div[style*='display: block'].game-over, div[style*='display: block'].congratulations");
}

function onKeyUp(e) {
    if (moviment.isLeft(e)) {
        gameState.leftPressed = false;
    } else if (moviment.isRight(e)) {
        gameState.rightPressed = false;
    } else if (e.keyCode === KEY_CODE_SPACE) {
        gameState.spacePressed = false;
    } else if (e.keyCode === KEY_CODE_ENTER && isModalVisible()) {
        window.location.reload();
    }
}

init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);
