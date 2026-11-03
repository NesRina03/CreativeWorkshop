export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 272;
export const ROUND_TIME = 7 * 60;
export const FIELD_OF_VIEW = Math.PI / 3;

export const FORMULAS = [
    {
        id: 'spectral-clarity',
        ghostId: 'blur',
        color: '#62e4ef',
        kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
        bias: 0,
        cells: ['0', '-1', '0', '-1', '5', '-1', '0', '-1', '0']
    },
    {
        id: 'static-eater',
        ghostId: 'static',
        color: '#ffd166',
        kernel: Array(9).fill(1 / 9),
        bias: 0,
        cells: ['1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9', '1/9']
    },
    {
        id: 'boundary-seeker',
        ghostId: 'veil',
        color: '#b28dff',
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
        bias: 0,
        cells: ['-1', '-1', '-1', '-1', '8', '-1', '-1', '-1', '-1']
    },
    {
        id: 'phantom-engraver',
        ghostId: 'relief',
        color: '#ff8b67',
        kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
        bias: 128,
        cells: ['-2', '-1', '0', '-1', '1', '1', '0', '1', '2']
    },
    {
        id: 'rift-finder',
        ghostId: 'split',
        color: '#83e38e',
        kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
        bias: 0,
        cells: ['-1', '0', '1', '-2', '0', '2', '-1', '0', '1']
    }
];
