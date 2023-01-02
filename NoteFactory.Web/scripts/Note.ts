import { SameAs } from "./Sequencer.js";

const NoteNames = {
    C:  261.63,
    Db: 277.18,
    D:  293.67,
    Eb: 311.13,
    E:  329.63,
    F:  349.23,
    Gb: 369.99,
    G:  392,
    Ab: 415.30,
    A:  440,
    Bb: 466.16,
    B:  493.88
} as const;

type NoteName = typeof NoteNames[keyof typeof NoteNames];

type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

class Note implements SameAs {
    constructor(name: NoteName, oct: Octave, beats: number) {
        this.noteName = name;
        this.octave = oct;
        this.beatDuration = beats;
    }

    sameAs(other: SameAs): boolean {
        return (other instanceof Note) && (other.noteName == this.noteName) && (other.octave == this.octave);
    }

    readonly beatDuration: number = 1;
    readonly noteName: NoteName = NoteNames.A;
    readonly octave: Octave = 4;

    getFrequency() {
        return this.octave == 4 ? this.noteName :
            this.octave > 4 ?
                this.noteName * (2 << (this.octave - 4 - 1)) :
                this.noteName / (2 << (4 - this.octave - 1));
    }

}

export { Note, NoteNames, NoteName, Octave };