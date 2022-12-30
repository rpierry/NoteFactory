
interface TimeSource {
    currentTime: number;
}

enum NoteName {
    A = 440,    
}

type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

class Note {
    beatDuration: number = 1;
    noteName: NoteName = NoteName.A;
    octave: Octave = 4;

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
    }

    private _steps: number = 8;

    get steps() {
        return this._steps;
    }

    set steps(stepCount: number) {
        this._steps = stepCount;
        //setup _pattern
    }

    private _pattern = [ true, false, true, false, false, true, true, false ];

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
            if (this._pattern[this._currentStep]) {
                this._noteHandler(this._nextStepTime, [new Note()]);
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
}

export { Sequencer, Note, TimeSource, NoteName, Octave };