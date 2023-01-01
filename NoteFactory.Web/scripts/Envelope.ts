
class Envelope {
    private readonly _ctx: AudioContext;
    constructor(ctx: AudioContext) {
        this._ctx = ctx;
    }

    private throwIfNotPercentage(name: string, val: number) {
        if ((val < 0) || (val > 1)) throw new Error("Invalid " + name + " - must be between 0 and 1 inclusive");
    }

    private _attackLevel = 1.0;
    get attackLevel() { return this._attackLevel; }
    set attackLevel(val: number) {
        this.throwIfNotPercentage("attackLevel", val);
        this._attackLevel = val;
    }

    private _attackTime = 0.3;
    get attackTime() { return this._attackTime; }
    set attackTime(val: number) { this._attackTime = val; }

    private _decayTime = 0.05;
    get decayTime() { return this._decayTime; }
    set decayTime(val: number) { this._decayTime = val; }

    private _sustainLevel = 0.5;
    get sustainLevel() { return this._sustainLevel; }
    set sustainLevel(val: number) {
        this.throwIfNotPercentage("sustainLevel", val);
        if (val > this._attackLevel) throw new Error("sustainLevel must be less than attackLevel");
        this._sustainLevel = val;
    }
    
    private _releaseTime = 0.1;
    get releaseTime() { return this._releaseTime; }
    set releaseTime(val: number) { this._releaseTime = val; }

    createAtTime(startTime: number, durationSeconds: number, onEnded: (this: AudioNode, ev: Event) => any) : GainNode {
        let env = this._ctx.createGain();
        env.addEventListener("ended", onEnded);

        env.gain.setValueAtTime(0, startTime);
        //A
        env.gain.linearRampToValueAtTime(this._attackLevel, startTime + this._attackTime);
        //D
        env.gain.linearRampToValueAtTime(this._sustainLevel, startTime + this._attackTime + this._decayTime);
        //S
        env.gain.setValueAtTime(this._sustainLevel, startTime + (durationSeconds - this._releaseTime));
        //R
        env.gain.linearRampToValueAtTime(0, startTime + durationSeconds);

        return env;
    }
}

export { Envelope };