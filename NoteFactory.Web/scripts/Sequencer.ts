
interface TimeSource {
    currentTime: number;
}

enum NoteName {
    C = 261.63,
    D = 293.67,
    E = 329.63,
    F = 349.23,
    G = 392,
    A = 440,
    B = 493.88
}

type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

class Note {
    constructor(name: NoteName, oct: Octave, beats: number) {
        this.noteName = name;
        this.octave = oct;
        this.beatDuration = beats;
    }

    readonly beatDuration: number = 1;
    readonly noteName: NoteName = NoteName.A;
    readonly octave: Octave = 4;

    getFrequency() {
        return this.octave >= 4 ?
                this.noteName * (2 << (this.octave - 4)) :
                this.noteName / (2 << (4 - this.octave));
    }

}

class Sequencer {
    private readonly _timeSource;
    private readonly _noteHandler;
    constructor(timeSource: TimeSource, noteHandler: (startTime: number, notes: Note[]) => void) {
        this._timeSource = timeSource;
        this._noteHandler = noteHandler;
        this._pattern = [];
        for (var i = 0; i < this._steps; i++) {
            this._pattern[i] = new Array<Note>();
        }
    }

    private _steps: number = 8;

    get steps() {
        return this._steps;
    }

    set steps(stepCount: number) {
        this._steps = stepCount;
        //setup _pattern
    }

    private _pattern: Note[][];

    private _bpm: number = 120;
    get bpm() {
        return this._bpm;
    }
    set bpm(beatsPerMin: number) {
        this._bpm = beatsPerMin;
    }

    getSecondsPerBeat() {
        return 60 / this._bpm; 
    }

    private _playing = false;
    private _timerId: number;
    private readonly _timerCallback = 50;
    private readonly _scheduleAheadSeconds = 0.1;
    private _nextStepTime = 0;
    private _currentStep = 0;

    play() {
        if (this._playing) return;
        this._playing = true;        

        this._currentStep = 0;
        this._nextStepTime = this._timeSource.currentTime;
        this.scheduleNotes();
    }

    private scheduleNotes() {        
        while (this._nextStepTime < this._timeSource.currentTime + this._scheduleAheadSeconds) {
            if (this._pattern[this._currentStep].length > 0) {
                this._noteHandler(this._nextStepTime, this._pattern[this._currentStep]);
            }

            this._nextStepTime += this.getSecondsPerBeat();
            this._currentStep = (this._currentStep + 1) % this._steps;
        }
        this._timerId = setTimeout(this.scheduleNotes.bind(this), this._timerCallback);
    }

    stop() {
        if (!this._playing) return;
        this._playing = false;
        console.log("Sequencer stopping!");

        clearTimeout(this._timerId);
    }

    private contains(notes: Note[], note: Note): number {
        for (var i = 0; i < notes.length; i++) {
            if ((notes[i].noteName == note.noteName) &&
                (notes[i].octave == note.octave)) {
                return i;
            }
        }
        return -1;
    }

    addToStep(step: number, note: Note) {
        if (step >= this._steps) return; //ignore invalid step

        if (this.contains(this._pattern[step], note) == -1) {
            this._pattern[step].push(note);
        }
    }

    removeFromStep(step: number, note: Note) {
        if (step >= this._steps) return; //ignore invalid

        let i = this.contains(this._pattern[step], note);
        if (i != -1) {
            this._pattern[step].splice(i, 1);
        }
    }
}

export { Sequencer, Note, TimeSource, NoteName, Octave };