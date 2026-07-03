import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/gameConfig';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite; //물리 적용 가능
    private ground!: Phaser.GameObjects.Rectangle;
    private groundTiles!: Phaser.GameObjects.Rectangle[];
    private gameSpeed = 300;
    private speedIncreaseRate = 5;
    private speedText!: Phaser.GameObjects.Text;
    private obstacleSpawnDelay = 1800;
    private obstacleWidth = 70;
    private obstacleHeight = 60;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private scoreText!: Phaser.GameObjects.Text;
    private bestScoreText!: Phaser.GameObjects.Text;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private obstacleTimer?: Phaser.Time.TimerEvent;
    private score = 0;
    private bestScore = 0;
    private isGameOver = false;

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

        this.createObstacleTexture();
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
            GAME_HEIGHT - 80,
            GAME_WIDTH,
            40,
            0x8b5a2b
        );

        this.physics.add.existing(this.ground, true); // 바닥에 물리 충돌 적용
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
        const graphics = this.add.graphics();

        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 56, 80);

        graphics.generateTexture('player-temp', 56, 80);
        graphics.destroy();

        this.player = this.physics.add.sprite(150, GAME_HEIGHT - 150, 'player-temp');

        this.player.body!.setSize(48, 76);
        this.player.body!.setOffset(4, 4);

        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
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

        if ((isSpacePressed || isUpPressed) && isOnGround) {
            this.player.setVelocityY(-600);
        }
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

    private createObstacleTimer() { // 장애물 생성 타이머
        this.obstacleTimer = this.time.addEvent({
            delay: this.obstacleSpawnDelay,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true,
        });
    }

    private spawnObstacle() {
        const groundTopY = GAME_HEIGHT - 100;

        const obstacle = this.obstacles.create(
            GAME_WIDTH + 80,
            groundTopY,
            'book-stack-temp'
        ) as Phaser.Physics.Arcade.Sprite;

        obstacle.setOrigin(0.5, 1);
        obstacle.setVelocityX(-this.gameSpeed);

        obstacle.body!.setSize(this.obstacleWidth - 10, this.obstacleHeight - 6);
        obstacle.body!.setOffset(5, 6);
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
}