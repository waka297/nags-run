import Phaser from 'phaser';
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
        this.cameras.main.setBackgroundColor('#1f1f1f');

        this.add.text(GAME_WIDTH / 2, 100, '게임 오버', {
            fontSize: '56px',
            color: '#ff6666',
            fontFamily: 'Arial',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 165, '잔소리 회피 실패!', {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 240, `최종 점수: ${this.score}`, {
            fontSize: '30px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 290, `최고 점수: ${this.bestScore}`, {
            fontSize: '30px',
            color: '#ffdd66',
            fontFamily: 'Arial',
        }).setOrigin(0.5);

        this.createRestartButton();
        this.createHomeButton();
    }

    private createRestartButton() {
        const restartButton = this.add.rectangle(GAME_WIDTH / 2, 370, 260, 60, 0x333333)
            .setStrokeStyle(3, 0xffffff)
            .setInteractive({ useHandCursor: true });

        this.add.text(GAME_WIDTH / 2, 370, '다시 시작', {
            fontSize: '30px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5);

        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x555555);
        });

        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x333333);
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
}