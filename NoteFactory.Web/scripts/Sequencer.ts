
interface TimeSource {
    currentTime: number;
}

interface SameAs {
    sameAs(other: SameAs): boolean;
}

type NoteLength = "quarter" | "eighth" | "sixteenth" | "triplet";

class Sequencer {
    private readonly _timeSource;
    private readonly _noteHandler;
    private readonly _onStepChanged;
    constructor(timeSource: TimeSource, noteHandler: (startTime: number, notes: SameAs[]) => void, onStepChanged: (step: number) => void) {
        this._timeSource = timeSource;
        this._noteHandler = noteHandler;
        this._onStepChanged = onStepChanged;
        this._pattern = [];
        for (var i = 0; i < this._steps; i++) {
            this._pattern[i] = new Array<SameAs>();
        }
    }

    private _steps: number = 8;

    get steps() {
        return this._steps;
    }

    set steps(stepCount: number) {
        this._steps = stepCount;
        //setup _pattern
        let newPattern: SameAs[][] = [];
        //save what we can from the old pattern
        for (var i = 0; i < Math.min(this._pattern.length, stepCount); i++) {
            newPattern[i] = this._pattern[i];
        }
        for (var i = Math.min(this._pattern.length, stepCount); i < stepCount; i++) {
            newPattern[i] = new Array<SameAs>();
        }
        this._pattern = newPattern;
        
        this.setCurrentStep(this._currentStep % this._steps);
    }

    private _pattern: SameAs[][];

    private _bpm: number = 120;
    get bpm() { return this._bpm; }
    set bpm(beatsPerMin: number) { this._bpm = beatsPerMin; }

    private _noteLength: NoteLength = "quarter";
    get noteLength() { return this._noteLength; }
    set noteLength(noteLength: NoteLength) { this._noteLength = noteLength; }

    private noteLengthMultiplier(l: NoteLength) {
        switch (l) {
            case "quarter": return 1;
            case "eighth": return 2;
            case "sixteenth": return 4;
            case "triplet": return 3;
        }        
    }

    getSecondsPerBeat() {
        return 60 / (this._bpm * this.noteLengthMultiplier(this._noteLength)); 
    }

    private _playing = false;
    private _timerId: number;
    private readonly _timerCallback = 50;
    private readonly _scheduleAheadSeconds = 0.1;
    private _nextStepTime = 0;
    private _currentStep = 0;
    private setCurrentStep(val: number) {
        //we set _currentStep in advance of playing the notes for that step, so
        //we want to notify before updating the value
        this._onStepChanged(this._currentStep);
        this._currentStep = val;        
    }

    play() {
        if (this._playing) return;
        this._playing = true;        

        this.setCurrentStep(0);        
        this._nextStepTime = this._timeSource.currentTime;
        this.scheduleNotes();
    }

    private scheduleNotes() {        
        while (this._nextStepTime < this._timeSource.currentTime + this._scheduleAheadSeconds) {
            if (this._pattern[this._currentStep].length > 0) {
                this._noteHandler(this._nextStepTime, this._pattern[this._currentStep]);
            }

            this._nextStepTime += this.getSecondsPerBeat();
            this.setCurrentStep((this._currentStep + 1) % this._steps);
        }
        this._timerId = setTimeout(this.scheduleNotes.bind(this), this._timerCallback);
    }

    stop() {
        if (!this._playing) return;
        this._playing = false;

        clearTimeout(this._timerId);
    }

    private contains(notes: SameAs[], note: SameAs): number {
        for (var i = 0; i < notes.length; i++) {
            if (notes[i].sameAs(note)) {
                return i;
            }
        }
        return -1;
    }

    addToStep(step: number, note: SameAs) {
        if (step >= this._steps) return; //ignore invalid step

        if (this.contains(this._pattern[step], note) == -1) {
            this._pattern[step].push(note);
        }
    }

    removeFromStep(step: number, note: SameAs) {
        if (step >= this._steps) return; //ignore invalid

        let i = this.contains(this._pattern[step], note);
        if (i != -1) {
            this._pattern[step].splice(i, 1);
        }
    }

    forEachNote(fn: (step: number, note: SameAs) => void) {
        for (var i = 0; i < this._pattern.length; i++) {
            for (var j = 0; j < this._pattern[i].length; j++) {
                fn(i, this._pattern[i][j]);
            }
        }
    }

    mapNotes(fn: (note: SameAs) => SameAs) {
        for (var i = 0; i < this._pattern.length; i++) {
            let n = new Array<SameAs>;
            for (var j = 0; j < this._pattern[i].length; j++) {
                n.push(fn(this._pattern[i][j]));
            }
            this._pattern[i] = n;
        }
    }

    clearAll() {
        let newPattern: SameAs[][] = [];
        for (var i = 0; i < newPattern.length; i++) {
            newPattern[i] = new Array<SameAs>();
        }

        this._pattern = newPattern;
    }
}

export { Sequencer, TimeSource, SameAs, NoteLength };