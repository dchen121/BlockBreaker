let GAME_WIDTH = document.documentElement.clientWidth;
let GAME_HEIGHT = document.documentElement.clientHeight;

let game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, '');

// BOOT STATE
let bootState = {
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.checkCollision.down = false;

        game.state.start('load');
    }
}

// LOAD STATE
let loadState = {
    preload: function() {
        game.load.image('ball', 'assets/ball.png');
        game.load.image('brick', 'assets/brick.png');
        game.load.image('paddle', 'assets/paddle.png');
        game.load.image('background', 'assets/background.png');
    },
    create: function() {
        game.state.start('game');
    }
}

// GAME STATE
let LIVES = 3;
let LEVEL = 1;
let SCORE = 0;

let BLOCK_ROW = 10;
let BLOCK_HEIGHT = 5;
let BLOCK_SPACING_X = 75;
let BLOCK_SPACING_Y = 40;

let bricks;
let paddle;
let ball;

let livesText;
let levelText;
let scoreText;

let isBallOnPaddle = true;

let gameState = {
    create: function() {
        initGame();
        setupBackground();
        setupText();
        setupBricks();
        setupPaddle();
        setupBall();
    },
    update: function() {
        checkBricks();
        updatePaddle();
        updateBall();
        checkCollision();
    }
}

function initGame() {
    game.globals = {
        lives: LIVES,
        level: LEVEL,
        score: SCORE
    }
}

function setupBackground() {
    let background = game.add.sprite(0, 0, 'background');
    background.width = game.world.width;
    background.height = game.world.height;
}

function setupText() {
    livesText = createText(-30, 30, 'right', `Lives: ${game.globals.lives}`);
    scoreText = createText(30, 30, 'left', `Score: ${game.globals.score}`);
    levelText = createText(0, 30, 'center', `Level: ${game.globals.level}`);
}

function createText(x, y, align, text) {
    return game.add.text(x, y, text,
        {
            font: '18px Arial',
            fill: '#000',
            boundsAlignH: align
        }
    ).setTextBounds(0, 0, game.world.width, 0);
}

function setupBricks() {
    bricks = game.add.group();
    let brick;

    for (let x = 0; x < BLOCK_ROW; x++) {
        for (let y = 0; y < BLOCK_HEIGHT; y++) {
            brick = game.add.sprite(x * BLOCK_SPACING_X, y * BLOCK_SPACING_Y, 'brick');
            brick.scale.setTo(1.5, 1.5);
            game.physics.arcade.enable(brick);
            brick.body.immovable = true;
            bricks.add(brick);
        }
    }

    let bricksWidth = ((BLOCK_SPACING_X * BLOCK_ROW) - (BLOCK_SPACING_X - brick.width));

    bricks.position.setTo(
        game.world.centerX - bricksWidth/2,
        game.world.centerY - 250
    );
}

function setupPaddle() {
    paddle = game.add.sprite(game.world.centerX, game.world.height - 50, 'paddle');
    game.physics.arcade.enable(paddle);
    paddle.body.immovable = true;
    paddle.anchor.setTo(0.5, 0.5);
    paddle.scale.setTo(1.25, 1.25);
}

function setupBall() {
    ball = game.add.sprite(game.world.centerX, game.world.height - 50, 'ball');
    game.physics.arcade.enable(ball);
    ball.checkWorldBounds = true;
    ball.body.collideWorldBounds = true;
    ball.body.bounce.set(1);
    ball.anchor.set(0.5, 0.5);
    ball.scale.setTo(2, 2);

    game.input.onDown.add(releaseBall, game);
    ball.events.onOutOfBounds.add(ballOutOfBounds, game)
}

function releaseBall() {
    if (isBallOnPaddle) {
        isBallOnPaddle = false;

        ball.body.velocity.x = 0;
        ball.body.velocity.y = -600;
    }
}

function ballOutOfBounds() {
    updateLives(--game.globals.lives);
    resetBallOnPaddle();

    if (game.globals.lives <= 0) {
        game.state.start('gameover');
    }
}

function resetBallOnPaddle() {
    isBallOnPaddle = true;
}

function checkBricks() {
    if (bricks.countLiving() <= 0) {
        nextLevel();
    }
}

function nextLevel() {
    resetBallOnPaddle();
    updateLevel(++game.globals.level);
    setupBricks();
}

function updatePaddle() {
    if (game.input.x == 0) return;

    if (game.input.x < paddle.width/2) {
        paddle.body.x = 0;
    } else if (game.input.x > game.world.width - paddle.width/2) {
        paddle.body.x = game.world.width - paddle.width;
    } else {
        paddle.body.x = game.input.x - paddle.width/2;
    }
}

function updateBall() {
    if (isBallOnPaddle) {
        ball.body.x = paddle.body.x + paddle.width/2 - ball.width/2;
        ball.body.y = paddle.body.y - ball.height;
    }
}

function checkCollision() {
    game.physics.arcade.collide(ball, paddle, ballHitPaddle, null, game);
    game.physics.arcade.collide(ball, bricks, ballHitBrick, null, game);
}

function ballHitPaddle(ball, paddle) {
    let diff = 0

    if (ball.x < paddle.x) {
        diff = paddle.x - ball.x
        ball.body.velocity.x = (-10 * diff)
    }

    if (ball.x > paddle.x) {
        diff = ball.x - paddle.x
        ball.body.velocity.x = (10 * diff)
    }
}

function ballHitBrick(ball, brick) {
    brick.kill();
    updateScore(game.globals.score+=10);
}

function updateLives(lives) {
    game.globals.lives = lives;
    livesText.text = `Lives: ${lives}`
}

function updateLevel(level) {
    game.globals.level = level;
    levelText.text = `Level: ${level}`;
}

function updateScore(score) {
    game.globals.score = score;
    scoreText.text = `Score: ${score}`;
}

// GAMEOVER STATE
let gameoverState = {
    create: gameoverStateCreate
}

function gameoverStateCreate() {
    setupBackground();
    setupGameoverText();
    game.input.onDown.add(restartGame, game);
}

function setupGameoverText() {
    let text = game.add.text(
        game.width * 0.5,
        game.height * 0.5,
        `Game over\n\nYou reached level ${game.globals.level} with score ${game.globals.score}\n\nClick anywhere to play again`,
        { font: '24px Arial', fill: '#FFF', align: 'center' }
    );

    text.anchor.set(0.5);
}

function restartGame() {
    game.state.start('game');
}

game.state.add('boot', bootState);
game.state.add('load', loadState);
game.state.add('game', gameState);
game.state.add('gameover', gameoverState);
game.state.start('boot');
