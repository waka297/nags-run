import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/gameConfig';
import bookStackImage from '../assets/images/book_stack.png';
import playerImage from '../assets/images/player.png';
import slipperImage from '../assets/images/slipper.png';
type ObstacleType = 'book' | 'slipper';
type SlipperPattern = 'low' | 'middle' | 'high';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite; //물리 적용 가능
    private ground!: Phaser.GameObjects.Rectangle;
    private groundTiles!: Phaser.GameObjects.Rectangle[];
    private gameSpeed = 300;
    private speedIncreaseRate = 5;
    private speedText!: Phaser.GameObjects.Text;
    private maxObstacleSpawnDelay = 2000;
    private minObstacleSpawnDelay = 900;
    private obstacleWidth = 110;
    private obstacleHeight = 95;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private scoreText!: Phaser.GameObjects.Text;
    private bestScoreText!: Phaser.GameObjects.Text;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private obstacleTimer?: Phaser.Time.TimerEvent;
    private score = 0;
    private bestScore = 0;
    private isGameOver = false;
    private obstacleDelayText!: Phaser.GameObjects.Text;
    private isDucking = false;

    private playerWidth = 120;
    private playerHeight = 170;
    private playerDuckHeight = 90;

    private minObstacleDistance = 380;
    private groundTopY = GAME_HEIGHT - 100;

    private slipperWidth = 86;
    private slipperHeight = 48;

    constructor() {
        super('GameScene');
    }

    create() {
        this.score = 0;
        this.isGameOver = false;
        this.bestScore = Number(localStorage.getItem('bestScore') ?? 0);

        this.cameras.main.setBackgroundColor('#2b2b2b');

        this.createUI();
        this.createGround();
        this.createGroundTiles();
        this.createPlayer();

        //this.createObstacleTexture();
        //this.createSlipperTexture();
        this.createObstacles();

        this.createInput();
        this.createCollision();

        this.createObstacleTimer();
    }

    update(_time: number, delta: number) {
        if (this.isGameOver) return;

        this.updateGameSpeed(delta);
        this.updateObstacleSpeed();
        this.handleJump();
        this.handleDuck();
        this.moveGroundTiles(delta);
        this.removeOffscreenObstacles();
        this.updateScore(delta);
    }

    private createUI() {
        this.bestScoreText = this.add.text(30, 24, `최고 점수 ${this.bestScore}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
        });

        this.scoreText = this.add.text(GAME_WIDTH - 30, 24, `점수 ${Math.floor(this.score)}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(1, 0);

        this.speedText = this.add.text(GAME_WIDTH / 2, 24, `속도 ${Math.floor(this.gameSpeed)}`, {
            fontSize: '20px',
            color: '#bbbbbb',
            fontFamily: 'Arial',
        }).setOrigin(0.5, 0);
    }

    private createGround() {
        this.ground = this.add.rectangle(
            GAME_WIDTH / 2,
            this.groundTopY + 50,
            GAME_WIDTH,
            100,
            0x9b642d
        );

        this.physics.add.existing(this.ground, true);
    }

    private createGroundTiles() {
        this.groundTiles = [];

        const tileWidth = 80;
        const tileHeight = 8;
        const tileY = GAME_HEIGHT - 95;
        const tileCount = Math.ceil(GAME_WIDTH / tileWidth) + 2;

        for (let i = 0; i < tileCount; i++) {
            const tile = this.add.rectangle(
                i * tileWidth,
                tileY,
                tileWidth / 2,
                tileHeight,
                0xc48a4a
            );

            tile.setOrigin(0, 0.5);
            this.groundTiles.push(tile);
        }
    }

    private moveGroundTiles(delta: number) {
        const tileWidth = 80;
        const moveAmount = this.gameSpeed * (delta / 1000);

        this.groundTiles.forEach((tile) => {
            tile.x -= moveAmount;

            if (tile.x < -tileWidth) {
                tile.x += tileWidth * this.groundTiles.length;
            }
        });
    }

    private createPlayer() {
        this.player = this.physics.add.sprite(140, this.groundTopY, 'player');

        this.player.setOrigin(0.5, 1);
        this.player.setDisplaySize(this.playerWidth, this.playerHeight);

        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);

        this.setPlayerBodyStanding();

        this.player.y = this.groundTopY;
        this.player.setDepth(10);
    }

    private createInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    private createCollision() {
        this.physics.add.collider(this.player, this.ground);

        this.physics.add.overlap(
            this.player,
            this.obstacles,
            this.handleGameOver,
            undefined,
            this
        );
    }

    private handleJump() {
        const isSpacePressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const isUpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up!);
        const isOnGround = this.player.body?.blocked.down; // 플레이어가 바닥에 닿아 있는지 확인해서 점프 가능 여부 판단

        if ((isSpacePressed || isUpPressed) && isOnGround && !this.isDucking) {
            this.player.setVelocityY(-600);
        }
    }

    private handleDuck() {
        const isDownPressed = this.cursors.down?.isDown;
        const isOnGround = this.player.body?.blocked.down;

        if (isDownPressed && isOnGround && !this.isDucking) {
            this.startDuck();
        }

        if ((!isDownPressed || !isOnGround) && this.isDucking) {
            this.stopDuck();
        }
    }

    private startDuck() {
        this.isDucking = true;

        this.player.setDisplaySize(this.playerWidth, this.playerDuckHeight);
        this.player.y = this.groundTopY;

        this.setPlayerBodyDucking();
    }

    private stopDuck() {
        this.isDucking = false;

        this.player.setDisplaySize(this.playerWidth, this.playerHeight);
        this.player.y = this.groundTopY;

        this.setPlayerBodyStanding();
    }

    private setPlayerBodyStanding() {
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        const bodyWidth = this.player.width * 0.45;
        const bodyHeight = this.player.height * 0.78;

        body.setSize(bodyWidth, bodyHeight);
        body.setOffset(
            (this.player.width - bodyWidth) / 2,
            this.player.height - bodyHeight
        );
    }

    private setPlayerBodyDucking() {
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        const bodyWidth = this.player.width * 0.55;
        const bodyHeight = this.player.height * 0.38;

        body.setSize(bodyWidth, bodyHeight);
        body.setOffset(
            (this.player.width - bodyWidth) / 2,
            this.player.height - bodyHeight
        );
    }

    private createObstacleTexture() {
        const graphics = this.add.graphics();

        graphics.fillStyle(0x8b5a2b, 1);
        graphics.fillRect(0, 40, this.obstacleWidth, 20);

        graphics.fillStyle(0xc0392b, 1);
        graphics.fillRect(5, 20, this.obstacleWidth - 10, 20);

        graphics.fillStyle(0x2980b9, 1);
        graphics.fillRect(0, 0, this.obstacleWidth, 20);

        graphics.generateTexture('book-stack-temp', this.obstacleWidth, this.obstacleHeight);
        graphics.destroy();
    }

    private createObstacles() { // 장애물 그룹 생성
        this.obstacles = this.physics.add.group({
            allowGravity: false,
            immovable: true,
        });
    }

    private createObstacleTimer() {
        const nextDelay = this.getRandomObstacleSpawnDelay();

        this.obstacleTimer = this.time.delayedCall(
            nextDelay,
            () => {
                if (this.isGameOver) return;

                this.spawnObstacle();
                this.createObstacleTimer();
            }
        );
    }

    private spawnObstacle() {
        if (!this.canSpawnObstacle()) {
            return;
        }

        const obstacleType = this.getRandomObstacleType();

        if (obstacleType === 'book') {
            this.spawnBookObstacle();
            return;
        }

        this.spawnSlipperObstacle();
    }

    private spawnBookObstacle() {
        const obstacle = this.obstacles.create(
            GAME_WIDTH + 80,
            this.groundTopY,
            'book-stack'
        ) as Phaser.Physics.Arcade.Sprite;

        obstacle.setOrigin(0.5, 1);
        obstacle.setDisplaySize(this.obstacleWidth, this.obstacleHeight);
        obstacle.setVelocityX(-this.gameSpeed);
        obstacle.setDepth(5);

        obstacle.body!.setSize(this.obstacleWidth * 0.8, this.obstacleHeight * 0.85);
        obstacle.body!.setOffset(this.obstacleWidth * 0.1, this.obstacleHeight * 0.15);
    }

    private spawnSlipperObstacle() {
        const pattern = this.getRandomSlipperPattern();
        const slipperY = this.getSlipperYByPattern(pattern);

        const obstacle = this.obstacles.create(
            GAME_WIDTH + 80,
            slipperY,
            'slipper'
        ) as Phaser.Physics.Arcade.Sprite;

        obstacle.setOrigin(0.5);
        obstacle.setDisplaySize(this.slipperWidth, this.slipperHeight);
        obstacle.setVelocityX(-this.gameSpeed);
        obstacle.setDepth(5);

        obstacle.body!.setSize(this.slipperWidth * 0.8, this.slipperHeight * 0.7);
        obstacle.body!.setOffset(this.slipperWidth * 0.1, this.slipperHeight * 0.15);
    }

    private removeOffscreenObstacles() {
        this.obstacles.getChildren().forEach((child: Phaser.GameObjects.GameObject) => {
            const obstacle = child as Phaser.Physics.Arcade.Sprite;

            if (obstacle.x < -100) {
                obstacle.destroy();
            }
        });
    }

    private handleGameOver() {
        if (this.isGameOver) return;

        this.isGameOver = true;

        const finalScore = Math.floor(this.score);

        if (finalScore > this.bestScore) {
            this.bestScore = finalScore;
            localStorage.setItem('bestScore', String(this.bestScore));
        }

        this.obstacleTimer?.remove(false);
        this.physics.pause();

        this.player.setTint(0xff5555);

        this.cameras.main.shake(250, 0.01);

        this.time.delayedCall(600, () => {
            this.scene.start('GameOverScene', {
                score: finalScore,
                bestScore: this.bestScore,
            });
        });
    }

    private updateScore(delta: number) {
        this.score += delta * 0.01;

        const displayScore = Math.floor(this.score);

        this.scoreText.setText(`점수 ${displayScore}`);
    }

    private updateGameSpeed(delta: number) {
        this.gameSpeed += this.speedIncreaseRate * (delta / 1000);

        this.speedText.setText(`속도 ${Math.floor(this.gameSpeed)}`);
    }

    private updateObstacleSpeed() {
        this.obstacles.getChildren().forEach((child: Phaser.GameObjects.GameObject) => {
            const obstacle = child as Phaser.Physics.Arcade.Sprite;
            obstacle.setVelocityX(-this.gameSpeed);
        });
    }

    private getRandomObstacleSpawnDelay() {
        return Phaser.Math.Between(
            this.minObstacleSpawnDelay,
            this.maxObstacleSpawnDelay
        );
    }

    private createSlipperTexture() {
        const graphics = this.add.graphics();

        graphics.fillStyle(0xff6b81, 1);
        graphics.fillRoundedRect(0, 8, 76, 28, 12);

        graphics.fillStyle(0xffd1dc, 1);
        graphics.fillRoundedRect(14, 0, 36, 16, 8);

        graphics.fillStyle(0x8b2f45, 1);
        graphics.fillRect(8, 30, 56, 6);

        graphics.generateTexture('slipper-temp', 76, 42);
        graphics.destroy();
    }

    private getRandomObstacleType(): ObstacleType {
        const randomValue = Phaser.Math.Between(1, 100);

        if (randomValue <= 60) {
            return 'book';
        }

        return 'slipper';
    }

    private getRandomSlipperPattern(): SlipperPattern {
        const randomValue = Phaser.Math.Between(1, 100);

        if (randomValue <= 35) return 'low';
        if (randomValue <= 60) return 'middle';
        return 'high';
    }

    private getSlipperYByPattern(pattern: SlipperPattern) {
        if (pattern === 'low') {
            return this.groundTopY - 20;
        }

        if (pattern === 'middle') {
            return this.groundTopY - 175;
        }

        return this.groundTopY - 95;
    }

    private canSpawnObstacle() {
        const obstacles = this.obstacles.getChildren() as Phaser.Physics.Arcade.Sprite[];

        if (obstacles.length === 0) {
            return true;
        }

        const rightMostObstacle = obstacles.reduce((rightMost, obstacle) => {
            return obstacle.x > rightMost.x ? obstacle : rightMost;
        });

        const spawnX = GAME_WIDTH + 80;

        return spawnX - rightMostObstacle.x >= this.minObstacleDistance;
    }

    preload() {
        this.load.image('player', playerImage);
        this.load.image('book-stack', bookStackImage);
        this.load.image('slipper', slipperImage);
    }
}