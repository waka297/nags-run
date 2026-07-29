import Phaser from 'phaser';
import backgroundHallwayImage from '../assets/images/background_hallway.png';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/gameConfig';

type GameOverData = {
    score: number;
    bestScore: number;
};

export class GameOverScene extends Phaser.Scene {
    private score = 0;
    private bestScore = 0;

    constructor() {
        super('GameOverScene');
    }

    init(data: GameOverData) {
        this.score = data.score ?? 0;
        this.bestScore = data.bestScore ?? 0;
    }

    create() {
        this.createBackground();

        const centerX = GAME_WIDTH / 2;

        this.add.text(centerX, 125, '게임 오버', {
            fontSize: '56px',
            color: '#ffffff',
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setPadding(0, 24, 0, 24)
            .setDepth(10);

        this.add.text(centerX, 175, '잔소리 회피 실패!', {
            fontSize: '24px',
            color: '#d0d0d0',
        })
            .setOrigin(0.5)
            .setPadding(0, 20, 0, 20)
            .setDepth(10);

        const scoreText = this.add.text(centerX, 230, '최종 점수 0', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setPadding(0, 12, 0, 12)
            .setDepth(10);

        const scoreCounter = { value: 0 };

        this.tweens.addCounter({
            from: 0,
            to: this.score,
            duration: 900,
            ease: 'Cubic.Out',

            onUpdate: (tween) => {
                const value = tween.getValue() ?? 0;

                scoreText.setText(
                    `최종 점수 ${Math.floor(value)}`
                );
            }
        });

        const bestScoreText = this.add.text(
            centerX,
            280,
            '최고 점수 0',
            {
                fontSize: '28px',
                color: '#ffd36a',
                fontStyle: 'bold',
            }
        )
            .setOrigin(0.5)
            .setPadding(0, 12, 0, 12)
            .setDepth(10);

        this.tweens.addCounter({
            from: 0,
            to: this.bestScore,
            duration: 900,
            ease: 'Cubic.Out',

            onUpdate: (tween) => {
                const value = tween.getValue() ?? 0;

                bestScoreText.setText(
                    `최고 점수 ${Math.floor(value)}`
                );
            }
        });

        if (this.score === this.bestScore) {
            const newBest = this.add.text(
                centerX,
                315,
                '★ NEW BEST! ★',
                {
                    fontSize: '24px',
                    color: '#ffd700',
                    fontStyle: 'bold',
                }
            )
                .setOrigin(0.5)
                .setAlpha(0);

            this.tweens.add({
                targets: newBest,
                alpha: 1,
                y: 305,
                duration: 500,
                ease: 'Back.Out',
                yoyo: true,
                repeat: -1
            });
        }

        this.createButton(centerX, 350, '다시 시작', () => {
            this.scene.start('GameScene')
        });

        this.createButton(centerX, 430, '처음으로', () => {
            this.scene.start('StartScene');
        });

        this.input.keyboard?.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        this.input.keyboard?.once('keydown-R', () => {
            this.scene.start('GameScene');
        });
    }

    private createRestartButton() {
        const restartButton = this.add.rectangle(
            GAME_WIDTH / 2,
            330,
            220,
            56,
            0xffffff,
            0.15
        )
            .setStrokeStyle(2, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setDepth(10);

        const restartText = this.add.text(
            GAME_WIDTH / 2,
            330,
            '다시 시작',
            {
                fontSize: '24px',
                color: '#ffffff',
            }
        )
            .setOrigin(0.5)
            .setDepth(11);

        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0xffffff, 0.28);
        });

        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0xffffff, 0.15);
        });
    }

    private createHomeButton() {
        const homeButton = this.add.rectangle(GAME_WIDTH / 2, 450, 260, 60, 0x222244)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.add.text(GAME_WIDTH / 2, 450, '처음으로', {
            fontSize: '30px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5);

        homeButton.on('pointerdown', () => {
            this.scene.start('StartScene');
        });

        homeButton.on('pointerover', () => {
            homeButton.setFillStyle(0x444466);
        });

        homeButton.on('pointerout', () => {
            homeButton.setFillStyle(0x222244);
        });
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
            0.6
        );

        overlay.setDepth(1);
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        onClick: () => void
    ) {
        const buttonBg = this.add.rectangle(
            x,
            y,
            240,
            56,
            0x111827,
            0.75
        )
            .setStrokeStyle(2, 0xffffff, 0.8)
            .setInteractive({ useHandCursor: true })
            .setDepth(10);

        const buttonText = this.add.text(x, y, label, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setPadding(0, 8, 0, 8)
            .setDepth(11);

        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0xffffff, 0.22);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x111827, 0.75);
        });

        buttonBg.on('pointerdown', () => {

            this.tweens.add({
                targets: [buttonBg, buttonText],
                scaleX: 0.96,
                scaleY: 0.96,
                duration: 70,
                yoyo: true
            });

            onClick();
        });

        return { buttonBg, buttonText };
    }

    private createText(
        x: number,
        y: number,
        text: string,
        fontSize: string,
        color: string
    ) {
        return this.add.text(x, y, text, {
            fontSize,
            color,
            fontStyle: 'bold',
        })
            .setOrigin(0.5)
            .setPadding(0, 12, 0, 12)
            .setDepth(10);
    }

    preload() {
        this.load.image('background-hallway', backgroundHallwayImage);
    }
}