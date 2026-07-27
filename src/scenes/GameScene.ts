import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/gameConfig';
import bookStackImage from '../assets/images/book_stack.png';
import playerRun1Image from '../assets/images/player_run_1.png';
import playerRun2Image from '../assets/images/player_run_2.png';
import slipperImage from '../assets/images/slipper.png';
import backgroundHallwayImage from '../assets/images/background_hallway.png';
import groundImage from '../assets/images/ground.png';
import playerDuckImage from '../assets/images/player_duck.png';
import playerJumpImage from '../assets/images/player_jump.png';
import playerHitImage from '../assets/images/player_hit.png';
import jumpSound from '../assets/audio/jump.mp3';
import hitSound from '../assets/audio/hit.mp3';
import gameBgm from '../assets/audio/game-bgm.mp3';
import slideSound from '../assets/audio/slide.mp3';
import motherRun1Image from '../assets/images/mother_run_1.png';
import motherRun2Image from '../assets/images/mother_run_2.png';
import playerCaughtImage from '../assets/images/player-caught.png';
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
    private playerDuckWidth = 120;
    private playerDuckHeight = 105;

    private minObstacleDistance = 380;
    private groundTopY = GAME_HEIGHT - 95;

    private slipperWidth = 86;
    private slipperHeight = 48;

    private backgrounds: Phaser.GameObjects.Image[] = []; // 배경 이미지 배열
    private backgroundSpeedRatio = 0.15; // 배경 이동 속도 비율

    private groundSprite!: Phaser.GameObjects.TileSprite;
    private groundHeight = 28;

    private playerNormalScaleX = 1;
    private playerNormalScaleY = 1;

    private wasOnGround = true;

    private mother!: Phaser.GameObjects.Sprite;

    private isMotherChasing = false;
    private isHitCooldown = false;

    private motherChaseTimer?: Phaser.Time.TimerEvent;

    private motherChaseDuration = 5000;
    private hitCooldownDuration = 700;

    private jumpSound!: Phaser.Sound.BaseSound;
    private hitSound!: Phaser.Sound.BaseSound;
    private gameBgm!: Phaser.Sound.BaseSound;
    private slideSound!: Phaser.Sound.BaseSound;

    private caughtImage!: Phaser.GameObjects.Image;

    constructor() {
        super('GameScene');
    }

    create() {
        this.score = 0;
        this.isGameOver = false;
        this.isMotherChasing = false;
        this.isHitCooldown = false;
        this.bestScore = Number(localStorage.getItem('bestScore') ?? 0);

        this.createBackground();

        this.createUI();
        this.createGround();
        //this.createGroundTiles();
        this.createPlayerAnimations();
        this.createMotherAnimations();

        this.createPlayer();
        this.createMother();
        this.createCaughtImage();

        this.jumpSound = this.sound.add('jump-sound', {
            volume: 0.35,
        });

        this.hitSound = this.sound.add('hit-sound', {
            volume: 0.5,
        });

        this.gameBgm = this.sound.add('game-bgm', {
            volume: 0.25,
            loop: true,
        });

        this.slideSound = this.sound.add('slide-sound', {
            volume: 0.3,
        });

        this.gameBgm.play();

        //this.createObstacleTexture();
        //this.createSlipperTexture();
        this.createObstacles();
        this.createObstacleTimer();
        this.createCollision();
        this.createInput();

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            () => {
                if (this.gameBgm?.isPlaying) {
                    this.gameBgm.stop();
                }

                this.motherChaseTimer?.remove(false);
                this.tweens.killTweensOf(this.mother);
            }
        );
    }

    update(_time: number, delta: number) {
        if (this.isGameOver) return;

        this.updateGameSpeed(delta);
        this.updateObstacleSpeed();

        this.handleJump();
        this.handleDuck();
        this.updatePlayerAnimation();

        this.moveBackgrounds(delta);
        this.moveGround(delta);
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

        this.speedText = this.add.text(
            GAME_WIDTH / 2,
            30,
            `속도 ${Math.floor(this.gameSpeed)}`,
            {
                fontSize: '20px',
                color: '#aaaaaa',
            }
        ).setOrigin(0.5);

        this.speedText.setVisible(false);
    }

    private createGround() {
        this.groundSprite = this.add.tileSprite(
            GAME_WIDTH / 2,
            this.groundTopY + this.groundHeight / 2,
            GAME_WIDTH,
            this.groundHeight,
            'ground'
        );

        this.groundSprite.setDepth(1);
        this.groundSprite.setAlpha(0.8);

        this.ground = this.add.rectangle(
            GAME_WIDTH / 2,
            this.groundTopY + this.groundHeight / 2,
            GAME_WIDTH,
            this.groundHeight,
            0xffffff,
            0
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
                0xd09a5c
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
        this.player = this.physics.add.sprite(
            140,
            this.groundTopY,
            'player-run-1'
        );

        this.player.setOrigin(0.5, 1);
        this.player.setDisplaySize(this.playerWidth, this.playerHeight);

        this.playerNormalScaleX = this.player.scaleX;
        this.playerNormalScaleY = this.player.scaleY;

        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);

        this.setPlayerBodyStanding();

        this.player.y = this.groundTopY;
        this.player.setDepth(10);
        this.player.play('player-run');
    }

    private createMother() {
        this.mother = this.add.sprite(
            -40,
            this.groundTopY,
            'mother-run-1'
        );

        this.mother.setOrigin(0.5, 1);
        this.mother.setDisplaySize(120, 180);
        this.mother.setDepth(10);
        this.mother.setVisible(false);
    }

    private createCaughtImage() {
        this.caughtImage = this.add.image(
            this.player.x,
            this.groundTopY,
            'player-caught'
        );

        this.caughtImage.setOrigin(0.5, 1);
        this.caughtImage.setDisplaySize(240, 180);
        this.caughtImage.setDepth(11);
        this.caughtImage.setVisible(false);
    }

    private updatePlayerAnimation() {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.blocked.down || body.touching.down;

        if (this.isDucking) {
            this.player.anims.stop();

            if (this.player.texture.key !== 'player-duck') {
                this.player.setTexture('player-duck');

                this.player.setScale(
                    this.playerNormalScaleX,
                    this.playerNormalScaleY
                );

                this.setPlayerBodyDucking();
            }

            this.wasOnGround = true;
            return;
        }

        if (!isOnGround) {
            this.player.anims.stop();

            if (this.player.texture.key !== 'player-jump') {
                this.player.setTexture('player-jump');

                this.player.setScale(
                    this.playerNormalScaleX,
                    this.playerNormalScaleY
                );

                this.setPlayerBodyStanding();
            }

            this.wasOnGround = false;
            return;
        }

        if (!this.wasOnGround) {
            this.player.setTexture('player-run-1');

            this.player.setScale(
                this.playerNormalScaleX,
                this.playerNormalScaleY
            );

            this.setPlayerBodyStanding();
        }

        if (!this.player.anims.isPlaying) {
            this.player.play('player-run');
        }

        this.wasOnGround = true;
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
            (
                _player,
                obstacle
            ) => {
                this.handleObstacleHit(
                    obstacle as Phaser.Physics.Arcade.Sprite
                );
            }
        );
    }

    private handleObstacleHit(
        obstacle: Phaser.Physics.Arcade.Sprite
    ) {
        if (this.isGameOver || this.isHitCooldown) {
            return;
        }

        this.isHitCooldown = true;

        // 같은 장애물과 여러 프레임 연속 충돌하는 것을 방지
        obstacle.destroy();

        this.showHitEffect();

        if (this.isMotherChasing) {
            this.handleGameOver();
            return;
        }

        this.startMotherChase();

        this.time.delayedCall(
            this.hitCooldownDuration,
            () => {
                if (!this.isGameOver) {
                    this.isHitCooldown = false;
                }
            }
        );
    }

    private handleJump() {
        const isSpacePressed =
            Phaser.Input.Keyboard.JustDown(this.spaceKey);

        const isUpPressed =
            Phaser.Input.Keyboard.JustDown(this.cursors.up!);

        const isOnGround =
            this.player.body?.blocked.down;

        if (
            (isSpacePressed || isUpPressed) &&
            isOnGround &&
            !this.isDucking
        ) {
            this.player.setVelocityY(-600);

            this.player.anims.stop();
            this.player.setTexture('player-jump');

            this.player.setScale(
                this.playerNormalScaleX,
                this.playerNormalScaleY
            );

            this.setPlayerBodyStanding();

            this.jumpSound.play();
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
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.blocked.down || body.touching.down;

        if (!isOnGround || this.isGameOver) {
            return;
        }

        this.isDucking = true;

        this.slideSound.play();

        this.player.anims.stop();
        this.player.setTexture('player-duck');

        this.player.setScale(
            this.playerNormalScaleX,
            this.playerNormalScaleY
        );

        this.player.y = this.groundTopY;

        this.setPlayerBodyDucking();
    }

    private stopDuck() {
        this.isDucking = false;

        this.player.setTexture('player-run-1');

        this.player.setScale(
            this.playerNormalScaleX,
            this.playerNormalScaleY
        );

        this.player.y = this.groundTopY;

        this.setPlayerBodyStanding();
        this.player.play('player-run');
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

        const bodyWidth = this.player.width * 0.65;
        const bodyHeight = this.player.height * 0.35;

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
        this.isHitCooldown = true;

        this.motherChaseTimer?.remove(false);
        this.obstacleTimer?.remove(false);


        this.mother.anims.stop();
        this.gameBgm.stop();
        this.hitSound.play();

        const finalScore = Math.floor(this.score);

        if (finalScore > this.bestScore) {
            this.bestScore = finalScore;
            localStorage.setItem('bestScore', String(this.bestScore));
        }

        this.obstacleTimer?.remove(false);

        // 피격 이미지 적용
        this.player.anims.stop();
        this.player.setTexture('player-hit');

        this.player.setScale(
            this.playerNormalScaleX,
            this.playerNormalScaleY
        );

        this.setPlayerBodyStanding();

        // 플레이어 즉시 정지
        this.player.setVelocity(0, 0);
        this.player.setAcceleration(0, 0);
        this.player.setAngularVelocity(0);

        // 게임 전체 물리 정지
        this.physics.pause();

        // 피격 효과
        this.player.setTint(0xff6666);
        this.cameras.main.shake(200, 0.008);

        this.moveMotherToPlayer();
    }

    private moveMotherToPlayer() {
        const finalScore = Math.floor(this.score);

        const caughtScaleX = this.caughtImage.scaleX;
        const caughtScaleY = this.caughtImage.scaleY;

        this.mother.setVisible(true);
        this.mother.play('mother-run', true);

        this.tweens.add({
            targets: this.mother,
            x: this.player.x - 20,
            duration: 700,
            ease: 'Linear',

            onComplete: () => {
                this.mother.anims.stop();

                this.player.setVisible(false);
                this.mother.setVisible(false);

                this.caughtImage
                    .setPosition(this.player.x, this.groundTopY)
                    .setVisible(true)
                    .setAlpha(0)
                    .setScale(
                        caughtScaleX * 0.85,
                        caughtScaleY * 0.85
                    );

                // 잡힌 이미지 등장
                this.tweens.add({
                    targets: this.caughtImage,
                    alpha: 1,
                    scaleX: caughtScaleX,
                    scaleY: caughtScaleY,
                    duration: 250,
                    ease: 'Back.Out',
                });

                // 잡힌 장면으로 카메라 이동
                this.cameras.main.pan(
                    this.caughtImage.x,
                    this.caughtImage.y - 80,
                    1800,
                    'Sine.easeInOut'
                );

                // 서서히 확대
                this.cameras.main.zoomTo(
                    1.15,
                    1800,
                    'Sine.easeInOut'
                );

                // 확대가 끝나면 암전
                this.time.delayedCall(1800, () => {
                    this.cameras.main.fadeOut(
                        500,
                        0,
                        0,
                        0
                    );
                });
            },
        });

        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
            () => {
                // 다음 플레이를 위해 카메라 원상복구
                this.cameras.main.setZoom(1);
                this.cameras.main.centerOn(
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2
                );

                this.scene.start('GameOverScene', {
                    score: finalScore,
                    bestScore: this.bestScore,
                });
            }
        );
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
            return this.groundTopY - 120;
        }

        return this.groundTopY - 190;
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

    private createBackground() {
        this.backgrounds = [];

        for (let i = 0; i < 2; i += 1) {
            const background = this.add.image(
                GAME_WIDTH / 2 + GAME_WIDTH * i,
                GAME_HEIGHT / 2,
                'background-hallway'
            );

            background.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
            background.setDepth(0);

            this.backgrounds.push(background);
        }
    }

    private moveBackgrounds(delta: number) {
        const moveDistance = this.gameSpeed * this.backgroundSpeedRatio * delta / 1000;

        this.backgrounds.forEach((background) => {
            background.x -= moveDistance;

            if (background.x <= -GAME_WIDTH / 2) {
                background.x += GAME_WIDTH * this.backgrounds.length;
            }
        });
    }

    private moveGround(delta: number) {
        const moveDistance = this.gameSpeed * delta / 1000;
        this.groundSprite.tilePositionX += moveDistance;
    }

    private createPlayerAnimations() {
        if (this.anims.exists('player-run')) {
            return;
        }

        this.anims.create({
            key: 'player-run',
            frames: [
                { key: 'player-run-1' },
                { key: 'player-run-2' },
            ],
            frameRate: 5,
            repeat: -1,
        });
    }

    private setPlayerHeightPreservingRatio(targetHeight: number) {
        const textureWidth = this.player.width;
        const textureHeight = this.player.height;

        const scale = targetHeight / textureHeight;

        this.player.setScale(scale);
    }

    private showHitEffect() {
        this.hitSound.play();

        this.player.setTint(0xff8888);
        this.cameras.main.shake(150, 0.005);

        this.time.delayedCall(250, () => {
            if (!this.isGameOver) {
                this.player.clearTint();
            }
        });
    }

    private startMotherChase() {
        this.isMotherChasing = true;

        this.mother.setVisible(true);
        this.mother.play('mother-run');
        this.mother.setAlpha(1);

        this.mother.x = -40;

        this.tweens.add({
            targets: this.mother,
            x: 35,
            duration: 350,
            ease: 'Back.Out',
        });

        this.motherChaseTimer?.remove(false);

        this.motherChaseTimer = this.time.delayedCall(
            this.motherChaseDuration,
            () => {
                this.stopMotherChase();
            }
        );
    }

    private stopMotherChase() {
        if (this.isGameOver) {
            return;
        }

        this.isMotherChasing = false;

        this.tweens.add({
            targets: this.mother,
            x: -60,
            alpha: 0,
            duration: 300,

            onComplete: () => {
                this.mother.anims.stop();
                this.mother.setVisible(false);
                this.mother.setAlpha(1);
            }
        });
    }
    
    private createMotherAnimations() {
        if (this.anims.exists('mother-run')) {
            return;
        }

        this.anims.create({
            key: 'mother-run',
            frames: [
                { key: 'mother-run-1' },
                { key: 'mother-run-2' },
            ],
            frameRate: 5,
            repeat: -1,
        });
    }

    preload() {
        this.load.audio('game-bgm', gameBgm);
        this.load.audio('jump-sound', jumpSound);
        this.load.audio('hit-sound', hitSound);

        this.load.image('player-run-1', playerRun1Image);
        this.load.image('player-run-2', playerRun2Image);
        this.load.image('player-duck', playerDuckImage);
        this.load.image('player-jump', playerJumpImage);

        this.load.image('book-stack', bookStackImage);
        this.load.image('slipper', slipperImage);
        this.load.image('background-hallway', backgroundHallwayImage);
        this.load.image('ground', groundImage);
        this.load.image('player-hit', playerHitImage);
        this.load.image('mother-run-1', motherRun1Image);
        this.load.image('mother-run-2', motherRun2Image);
        this.load.image('player-caught', playerCaughtImage);

        this.load.audio('slide-sound', slideSound);
    }
}