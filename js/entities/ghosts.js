export const GHOSTS = [
    { id: 'blur', formulaId: 'spectral-clarity', clue: 'blurry' },
    { id: 'static', formulaId: 'static-eater', clue: 'speckled' },
    { id: 'veil', formulaId: 'boundary-seeker', clue: 'faint' },
    { id: 'relief', formulaId: 'phantom-engraver', clue: 'flat' },
    { id: 'split', formulaId: 'rift-finder', clue: 'broken' }
];

export function createGhost(type, index, position){
    return {
        id: `${type.id}-${index + 1}`,
        typeId: type.id,
        formulaId: type.formulaId,
        clue: type.clue,
        x: position.x,
        y: position.y,
        revealed: false,
        caught: false,
        chances: 2
    };
}
