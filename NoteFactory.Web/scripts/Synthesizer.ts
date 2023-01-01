import { Envelope } from "./Envelope.js";

class Synthesizer {
    private _ctx: AudioContext;
    private _outputGain: GainNode;
    private _connectSubTo: AudioNode;
    private _connectOscTo: AudioNode;
    private _connectOsc2To: AudioNode;    

    constructor(ctx: AudioContext) {
        this._ctx = ctx;
        this.envelope = new Envelope(this._ctx);

        let oscPan = this._ctx.createStereoPanner();
        oscPan.pan.value = this._split;
        this._connectOscTo = oscPan;

        let osc2Pan = this._ctx.createStereoPanner();
        osc2Pan.pan.value = -this._split;
        this._connectOsc2To = osc2Pan;      

        let oscGain = this._ctx.createGain();
        oscGain.gain.value = this._oscBalance;        
        oscPan.connect(oscGain);

        let osc2Gain = this._ctx.createGain();
        osc2Gain.gain.value = 1.0 - this._oscBalance;        
        osc2Pan.connect(osc2Gain);

        let subMix = this._ctx.createGain();
        subMix.gain.value = this._subLevel;
        this._connectSubTo = subMix;        

        let mainMix = this._ctx.createGain();
        mainMix.gain.value = 1 - this._subLevel;        

        oscGain.connect(mainMix);
        osc2Gain.connect(mainMix);

        this._outputGain = this._ctx.createGain();
        subMix.connect(this._outputGain);
        mainMix.connect(this._outputGain);
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

    readonly envelope: Envelope;

    play(frequency: number, startTime: number, durationSeconds: number) {
        let [toSchedule] =
            this.createOscillators(frequency,
                () => this.envelope.createAtTime(startTime, durationSeconds, this.disconnectNode));
                
        for (var o of toSchedule) {
            o.start(startTime);
            o.stop(startTime + durationSeconds);
        }
    }

    private _subLevel = 0.2;
    private _subDetune = 5;
    private _split = 0.7;
    private _secondDetune = 8;
    private _oscBalance = 0.5;

    private createOscillators(frequency: number, getEnvelope: () => AudioNode): [ toSchedule: AudioScheduledSourceNode[]] {
        let osc = this._ctx.createOscillator();
        osc.type = this._oscillatorType;       
        osc.frequency.value = frequency;
        osc.addEventListener("ended", this.disconnectNode);
        let oscEnv = getEnvelope();
        osc.connect(oscEnv);
        oscEnv.connect(this._connectOscTo);

        let osc2 = this._ctx.createOscillator();
        osc2.type = this._oscillatorType;
        osc2.frequency.value = frequency;
        osc2.detune.value = this._secondDetune;
        osc2.addEventListener("ended", this.disconnectNode);
        let osc2Env = getEnvelope();
        osc2.connect(osc2Env);
        osc2Env.connect(this._connectOsc2To);

        let sub = this._ctx.createOscillator();
        sub.type = "sine";
        sub.frequency.value = frequency / 2;
        sub.detune.value = this._subDetune;
        sub.addEventListener("ended", this.disconnectNode);
        let subEnv = getEnvelope();
        sub.connect(subEnv);
        subEnv.connect(this._connectSubTo);
        
        return [[ osc, osc2, sub ]];
    }

    private disconnectNode(this: AudioNode, ev: Event): any {
        this.disconnect();
    }
}

export { Synthesizer };