import { Envelope } from "./Envelope.js";

class Synthesizer {
    private _ctx: AudioContext;
    private _outputGain: GainNode;

    constructor(ctx: AudioContext) {
        this._ctx = ctx;
        this._outputGain = this._ctx.createGain();
        this._outputGain.connect(this._ctx.destination);
        this.envelope = new Envelope(this._ctx);
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

    readonly envelope: Envelope;

    play(frequency: number, startTime: number, durationSeconds: number) {
        let osc = this.createOscillator(frequency);

        osc.start(startTime);
        osc.stop(startTime + durationSeconds);

        let env = this.envelope.createAtTime(startTime, durationSeconds, this.disconnectNode);
        osc.connect(env);
        env.connect(this._outputGain);        
    }

    private createOscillator(frequency: number): AudioScheduledSourceNode {
        let osc = this._ctx.createOscillator();
        osc.type = this._oscillatorType;       
        osc.frequency.value = frequency;
        osc.addEventListener("ended", this.disconnectNode);
        
        return osc;
    }

    private disconnectNode(this: AudioNode, ev: Event): any {
        this.disconnect();
    }
}

export { Synthesizer };