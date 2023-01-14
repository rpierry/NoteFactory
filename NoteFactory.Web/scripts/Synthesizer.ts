import { Envelope } from "./Envelope.js";

class Synthesizer {
    private _ctx: AudioContext;
    private _outputGain: GainNode;
    private _connectSubTo: AudioNode;
    private _connectOscTo: AudioNode;
    private _connectOsc2To: AudioNode;  
    private _delay: DelayNode;
    private _delayFeedback: GainNode;
    private _delayLevel: GainNode;
    private _reverb: ConvolverNode;
    private _reverbLevel: GainNode;
    private _thicknessNodes: GainNode[];
    private _oneMinusThicknessNodes: GainNode[];
    
    private _split = 0.8;
    private _defaultThickness = 0.25;

    constructor(ctx: AudioContext, reverbIR: AudioBuffer) {
        this._ctx = ctx;
        this.envelope = new Envelope(this._ctx);

        let oscPan = this._ctx.createStereoPanner();
        oscPan.pan.value = this._split;
        this._connectOscTo = oscPan;

        let osc2Pan = this._ctx.createStereoPanner();
        osc2Pan.pan.value = -this._split;
        this._connectOsc2To = osc2Pan;      

        let oscGain = this._ctx.createGain();
        oscGain.gain.value = 1 - this._defaultThickness; //keep the 2 oscs summing to 1
        oscPan.connect(oscGain);

        let osc2Gain = this._ctx.createGain();
        osc2Gain.gain.value = this._defaultThickness;
        osc2Pan.connect(osc2Gain);

        let subMix = this._ctx.createGain();
        subMix.gain.value = this._defaultThickness;
        this._connectSubTo = subMix;        

        let mainMix = this._ctx.createGain();
        mainMix.gain.value = 1 - this._defaultThickness;

        oscGain.connect(mainMix);
        osc2Gain.connect(mainMix);

        this._thicknessNodes = [osc2Gain, subMix];   
        this._oneMinusThicknessNodes = [oscGain, mainMix];

        let dry = this._ctx.createGain();
        subMix.connect(dry);
        mainMix.connect(dry);

        this._delay = this._ctx.createDelay();
        this._delayFeedback = this._ctx.createGain();
        this._delayLevel = this._ctx.createGain();
        dry.connect(this._delay);
        this._delay.connect(this._delayFeedback);
        this._delay.connect(this._delayLevel);
        this._delayFeedback.connect(this._delay);

        this._reverb =
            new ConvolverNode(this._ctx,
                {
                    buffer: reverbIR
                }); 
        this._reverbLevel = this._ctx.createGain();                
        this._reverb.connect(this._reverbLevel);
        //mix both the delayed signal and the dry in
        this._delayLevel.connect(this._reverb);
        dry.connect(this._reverb);
        
        this._outputGain = this._ctx.createGain();
        dry.connect(this._outputGain);
        this._delayLevel.connect(this._outputGain); //send the delayed signal out, even if no reverb
        this._reverbLevel.connect(this._outputGain);

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

    get thickness() {
        return this._thicknessNodes[0].gain.value;
    }

    set thickness(thickness: number) {
        this._thicknessNodes.forEach((n) => { n.gain.value = thickness; });
        this._oneMinusThicknessNodes.forEach((n) => { n.gain.value = 1 - thickness; });
    }

    get delayTime() {
        return this._delay.delayTime.value;
    }

    set delayTime(time: number) {
        this._delay.delayTime.value = time;
    }

    get delayFeedback() {
        return this._delayFeedback.gain.value;
    }

    set delayFeedback(gain: number) {
        this._delayFeedback.gain.value = gain;
    }

    get delayLevel() {
        return this._delayLevel.gain.value;
    }

    set delayLevel(gain: number) {
        this._delayLevel.gain.value = gain;
    }

    get reverbLevel() {
        return this._reverbLevel.gain.value;
    }

    set reverbLevel(gain: number) {
        this._reverbLevel.gain.value = gain;
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
    
    private _subDetune = 8;    
    private _secondDetune = 12;    

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
        sub.frequency.value = frequency / 4;
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