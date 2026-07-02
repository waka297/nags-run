import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/gameConfig';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite; //물리 적용 가능
    private ground!: Phaser.GameObjects.Rectangle;
    private groundTiles!: Phaser.GameObjects.Rectangle[];
    private gameSpeed = 300;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private scoreText!: Phaser.GameObjects.Text;
    private bestScoreText!: Phaser.GameObjects.Text;

    constructor() {
        super('GameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2b2b2b');

        this.createUI();
        this.createGround();
        this.createGroundTiles();
        this.createPlayer();
        this.createInput();
        this.createCollision();
    }

    update(_time: number, delta: number) {
        this.handleJump();
        this.moveGroundTiles(delta);
    }

    private createUI() {
        this.bestScoreText = this.add.text(30, 24, '최고 점수 000000', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
        });

        this.scoreText = this.add.text(GAME_WIDTH - 30, 24, '점수 000000', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(1, 0);
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

        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
    }

    private createInput() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    private createCollision() {
        this.physics.add.collider(this.player, this.ground); // 플레이어와 바닥 충돌 처리
    }

    private handleJump() {
        const isSpacePressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const isUpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up!);
        const isOnGround = this.player.body?.blocked.down; // 플레이어가 바닥에 닿아 있는지 확인해서 점프 가능 여부 판단

        if ((isSpacePressed || isUpPressed) && isOnGround) {
            this.player.setVelocityY(-600);
        }
    }
}