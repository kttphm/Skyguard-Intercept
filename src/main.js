import Preload from './scenes/Preload.js';
import Menu from './scenes/Menu.js';
import Tutorial from './scenes/Tutorial.js';
import Game from './scenes/Game.js';
import Solution from './scenes/Solution.js';

const config = {
    type: Phaser.AUTO,
    title: 'Iron Dome',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: false,
    scene:  [Preload, Menu, Game, Tutorial, Solution],
    physics: {
        default: 'arcade',
        debug: false
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
