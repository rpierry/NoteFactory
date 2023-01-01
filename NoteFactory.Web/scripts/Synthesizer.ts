
class Synthesizer {
    private _ctx: AudioContext;
    private _outputGain: GainNode;

    constructor(ctx: AudioContext) {
        this._ctx = ctx;
        this._outputGain = this._ctx.createGain();
        this._outputGain.connect(this._ctx.destination);
    }

    private throwIfNotPercentage(name: string, val: number) {
        if ((val < 0) || (val > 1)) throw new Error("Invalid " + name + " - must be between 0 and 1 inclusive");
    }

    get gain() {
        return this._outputGain.gain.value;
    }

    set gain(gain: number) {
        this.throwIfNotPercentage("gain", gain);        

        this._outputGain.gain.value = gain;
    }

    private _oscillatorType: OscillatorType = "sine";
    get oscillatorType() {
        return this._oscillatorType;
    }

    set oscillatorType(val: OscillatorType) {
        this._oscillatorType = val;
    }

    private _releaseAfterPercent: number = 0.9;
    get releaseAfterPercent() {
        return this._releaseAfterPercent;
    }

    set releaseAfterPercent(val: number) {
        this.throwIfNotPercentage("releaseAfterPercent", val);

        this._releaseAfterPercent = val;
    }

    play(frequency: number, startTime: number, durationSeconds: number) {
        let osc = this.createOscillator(frequency, this._outputGain);
        osc.start(startTime);
        osc.stop(startTime + (durationSeconds * this._releaseAfterPercent));
    }

    private createOscillator(frequency: number, destination: AudioNode): AudioScheduledSourceNode {
        let osc = this._ctx.createOscillator();
        osc.type = this._oscillatorType;       
        osc.frequency.value = frequency;
        osc.addEventListener("ended", this.oscEnded);

        osc.connect(destination);
        return osc;
    }

    private oscEnded(this: OscillatorNode, ev: Event): any {
        this.disconnect();
    }
}

export { Synthesizer };