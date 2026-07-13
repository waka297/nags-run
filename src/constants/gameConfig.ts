import Phaser from 'phaser';
import { StartScene } from '../scenes/StartScene';
import { GameScene } from '../scenes/GameScene';
import { GameOverScene } from '../scenes/GameOverScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1f1f1f',
    scene: [StartScene, GameScene, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200, x: 0 },
            debug: true, // 디버그 모드 활성화 여부
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};