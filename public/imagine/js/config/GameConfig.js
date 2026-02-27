// config/GameConfig.js – Game configuration
export const GameConfig = {
    MOVEMENT_SPEED: 3.0,
    MOUSE_SENSITIVITY: 0.002,
    INITIAL_PLAYER_POSITION: [0, 1.7, 5],
    ASSET_PATHS: {
        textures: {
            floor: 'assets/textures/floor.png',
            wall: 'assets/textures/wall.png',
            table: 'assets/textures/table.png',
            pill: 'assets/textures/pill.png',
            spider: 'assets/textures/spider.png'
        },
        audio: {
            ambient: 'assets/audio/ambient.mp3',
            takePill: 'assets/audio/take_pill.mp3',
            distortionLoop: 'assets/audio/distortion_loop.mp3',
            heartbeat: 'assets/audio/heartbeat.mp3'
        }
    }
};