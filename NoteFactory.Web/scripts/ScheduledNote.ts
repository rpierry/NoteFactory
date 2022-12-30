
class ScheduledNote {
    private _ctx: AudioContext;
    private _osc: OscillatorNode;

    constructor(frequency: number, startAt: number, duration: number, context: AudioContext, destination: AudioNode, onEnded: () => any) {
        this._ctx = context;
        this._osc = this._ctx.createOscillator();
        this._osc.addEventListener("ended", onEnded);
        this._osc.type = "sine";
        this._osc.frequency.value = frequency;
        this._osc.connect(destination);
        this._osc.start(startAt);
        this._osc.stop(startAt + duration);
        
    }
}

export { ScheduledNote };