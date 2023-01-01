
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
        this._sustainLevel = val;
    }
    
    private _releaseTime = 0.1;
    get releaseTime() { return this._releaseTime; }
    set releaseTime(val: number) { this._releaseTime = val; }

    createAtTime(startTime: number, durationSeconds: number, onEnded: (this: AudioNode, ev: Event) => any) : GainNode {
        let env = this._ctx.createGain();
        env.addEventListener("ended", onEnded);

        let effectiveReleaseTime = this._releaseTime;
        if (effectiveReleaseTime >= durationSeconds) {
            console.warn("Release time must be less than overall note duration - truncating to 95% of duration");
            effectiveReleaseTime = durationSeconds * 0.95;
        }

        //how much time we have for attack, decay, sustain
        let adsDuration = durationSeconds - effectiveReleaseTime;
        let attackToLevel = this._attackLevel;
        let endOfAttack = startTime + this._attackTime;
        let endOfDecay = endOfAttack + this._decayTime;
        let releaseAt = startTime + adsDuration;
        let releaseFromLevel = this._sustainLevel;
        let skipDecay = false;

        if (this._attackTime > adsDuration) {
            //we will release in the middle of our attack
            skipDecay = true;
            endOfAttack = startTime + adsDuration;
            //linear scaling of where we'll be at release time
            attackToLevel = this._attackLevel * (adsDuration / this._attackTime);
            releaseFromLevel = attackToLevel;
        } else {
            if (this._attackTime + this._decayTime > adsDuration) {
                //we will release in the middle of our decay
                endOfDecay = startTime + adsDuration;
                //linear scaling of where we'll be at release time
                releaseFromLevel = this._attackLevel - ((this._attackLevel - this._sustainLevel) * (adsDuration - this._attackTime) / this._decayTime);
            }
        }

        env.gain.setValueAtTime(0, startTime);
        //A
        env.gain.linearRampToValueAtTime(attackToLevel, endOfAttack);

        if (!skipDecay) {
            //D
            env.gain.linearRampToValueAtTime(releaseFromLevel, endOfDecay);
        }

        //S
        env.gain.setValueAtTime(releaseFromLevel, releaseAt);
        //R
        env.gain.linearRampToValueAtTime(0, startTime + durationSeconds);

        return env;
    }
}

export { Envelope };