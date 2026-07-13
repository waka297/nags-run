import Phaser from 'phaser';
import backgroundHallwayImage from '../assets/images/background_hallway.png';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/gameConfig';

export class StartScene extends Phaser.Scene {
    private bestScore = 0;

    constructor() {
        super('StartScene');
    }

    create() {
        this.bestScore = Number(localStorage.getItem('bestScore') ?? 0);

        this.createBackground();

        const centerX = GAME_WIDTH / 2;

        this.add.text(centerX, 105, '잔소리 피하기 런', {
            fontSize: '54px',
            color: '#ffffff',
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setPadding(0, 20, 0, 20)
            .setDepth(10);

        this.add.text(centerX, 170, '엄마의 잔소리를 피해 최대한 오래 달려라!', {
            fontSize: '24px',
            color: '#eeeeee',
        })
            .setOrigin(0.5)
            .setPadding(0, 10, 0, 10)
            .setDepth(10);

        this.add.text(centerX, 235, `최고 점수 ${this.bestScore}`, {
            fontSize: '28px',
            color: '#ffd36a',
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setPadding(0, 10, 0, 10)
            .setDepth(10);

        this.createStartButton(centerX, 315);

        this.add.text(centerX, 405, '↑ / Space : 점프    ↓ : 숙이기', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setPadding(0, 8, 0, 8)
            .setDepth(10);
    }

    private createBackground() {
        const background = this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            'background-hallway'
        );

        background.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        background.setDepth(0);

        const overlay = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.75
        );

        overlay.setDepth(1);
    }

    private createStartButton(x: number, y: number) {
        const startButton = this.add.rectangle(
            x,
            y,
            280,
            64,
            0x111827,
            0.75
        )
            .setStrokeStyle(2, 0xffffff, 0.9)
            .setInteractive({ useHandCursor: true })
            .setDepth(10);

        const startText = this.add.text(x, y, '게임 시작', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setPadding(0, 8, 0, 8)
            .setDepth(11);

        startButton.on('pointerover', () => {
            startButton.setFillStyle(0xffffff, 0.22);
        });

        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x111827, 0.75);
        });

        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        return { startButton, startText };
    }

    preload() {
        this.load.image('background-hallway', backgroundHallwayImage);
    }
}