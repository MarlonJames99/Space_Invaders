const keyCodeLeft = 37;
const keyCodeRight = 39;
const keyCodeSpace = 32;

const gameWidth = 800;
const gameHeight = 600;

const playerWidth = 20;
const playerMaxSpeed = 400;
const laserMaxSpeed = 500;
const laserCooldown = 0.5;

const enemiesPerRow = 10;
const enemyHorizontalPadding = 80;
const enemyVerticalPadding = 70;
const enemyVerticalSpacing = 80;
const enemyCooldown = 5.0;

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
    gameState.playerX = gameWidth / 2;
    gameState.playerY = gameHeight - 50;
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
        gameState.playerX -= dt * playerMaxSpeed;
    }
    if (gameState.rightPressed) {
        gameState.playerX += dt * playerMaxSpeed;
    }

    gameState.playerX = clamp(
        gameState.playerX, 
        playerWidth, 
        gameWidth - playerWidth
    );

    if (gameState.spacePressed && gameState.playerCooldown <= 0) {
        createLaser($container, gameState.playerX, gameState.playerY);
        gameState.playerCooldown = laserCooldown;
    }
    if (gameState.playerCooldown > 0) {
        gameState.playerCooldown -= dt;
    }

    const $player = document.querySelector('.player');
    setPosition($player, gameState.playerX, gameState.playerY);
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
        laser.y -= dt * laserMaxSpeed;
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
        cooldown: rand(0.5, enemyCooldown),
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
            enemy.cooldown = enemyCooldown;
        }
    }
    gameState.enemies = gameState.enemies.filter(e => !e.isDead);
}

function destroyEnemy($container, enemy) {
    $container.removeChild(enemy.$element);
    enemy.isDead = true;
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
        laser.y += dt * laserMaxSpeed;
        if (laser.y > gameHeight) {
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

    const enemySpacing = (gameWidth - enemyHorizontalPadding * 2) /
        (enemiesPerRow - 1);
    for (let j = 0; j < 3; j++) {
        const y = enemyVerticalPadding + j * enemyVerticalSpacing;
        for (let i = 0; i < enemiesPerRow; i++) {
            const x = i * enemySpacing + enemyHorizontalPadding;
            createEnemy($container, x, y);
        }
    }
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

function onKeyDown(e) {
    if (e.keyCode === keyCodeLeft) {
        gameState.leftPressed = true;
    } else if (e.keyCode === keyCodeRight) {
        gameState.rightPressed = true;
    } else if (e.keyCode === keyCodeSpace) {
        gameState.spacePressed = true;
    }
}

function isModalOverShowing() {
    return !!document.querySelector("div[style*='display: block'].game-over")
}

function onKeyUp(e) {
    if (e.keyCode === keyCodeLeft) {
        gameState.leftPressed = false;
    } else if (e.keyCode === keyCodeRight) {
        gameState.rightPressed = false;
    } else if (e.keyCode === keyCodeSpace) {
        gameState.spacePressed = false;
    } else if (e.keyCode === KEY_CODE_ENTER && isModalOverShowing()) {
        window.location.reload()
    }
}

init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);
