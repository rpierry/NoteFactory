
import { Sequencer, TimeSource } from "./Sequencer.js";
import { Note, NoteName, Octave } from "./Note.js";
import { Synthesizer } from "./Synthesizer.js";

const btnPlay: HTMLButtonElement = document.querySelector("#play");
const btnStop: HTMLButtonElement = document.querySelector("#stop");
const btnToggle: HTMLButtonElement = document.querySelector("#toggle");
const rngVol: HTMLInputElement = document.querySelector("#vol");
const rngBpm: HTMLInputElement = document.querySelector("#bpm");
const rngOct: HTMLInputElement = document.querySelector("#octave");
const rngAttackLevel: HTMLInputElement = document.querySelector("#attackLevel");
const rngAttackTime: HTMLInputElement = document.querySelector("#attackTime");
const rngDecayTime: HTMLInputElement = document.querySelector("#decayTime");
const rngSustainLevel: HTMLInputElement = document.querySelector("#sustainLevel");
const rngReleaseTime: HTMLInputElement = document.querySelector("#releaseTime");

btnPlay.addEventListener("click", Play);
btnStop.addEventListener("click", Stop);
btnToggle.addEventListener("click", Toggle);
rngVol.addEventListener("change", ChangeVolume, false);
rngBpm.addEventListener("change", ChangeBpm, false);
rngOct.addEventListener("change", ChangeOctave, false);
rngAttackLevel.addEventListener("change", ChangeEnvelope, false);
rngAttackTime.addEventListener("change", ChangeEnvelope, false);
rngDecayTime.addEventListener("change", ChangeEnvelope, false);
rngSustainLevel.addEventListener("change", ChangeEnvelope, false);
rngReleaseTime.addEventListener("change", ChangeEnvelope, false);

const ctx = new AudioContext();

const sequencer = new Sequencer(ctx, ScheduleNotes);
sequencer.addToStep(0, new Note(NoteName.A, 4, 1));
sequencer.addToStep(1, new Note(NoteName.B, 4, 1));
sequencer.addToStep(2, new Note(NoteName.C, 4, 1));
sequencer.addToStep(3, new Note(NoteName.D, 4, 1));
sequencer.addToStep(4, new Note(NoteName.E, 4, 1));
sequencer.addToStep(5, new Note(NoteName.F, 4, 1));
sequencer.addToStep(6, new Note(NoteName.G, 4, 1));

const synthesizer = new Synthesizer(ctx);
ChangeVolume();
SetADRTimes();

let playing = false;

function Play() {
    if (playing) return;
    playing = true;

    sequencer.play();
}

function ScheduleNotes(startTime: number, notes: Note[]) {
    for (let n of notes) {
        synthesizer.play(n.getFrequency(), startTime, n.beatDuration * sequencer.getSecondsPerBeat());        
    }
}

function Stop() {
    if (!playing) return;
    playing = false;
    
    sequencer.stop();    
}

function ChangeVolume() {    
    synthesizer.gain = parseFloat(rngVol.value);
}

function ChangeBpm() {
    sequencer.bpm = parseInt(rngBpm.value);
}

function ChangeOctave() {
    sequencer.mapNotes(
        (n: Note) => new Note(n.noteName, parseInt(rngOct.value) as Octave, n.beatDuration));
}

let incl = false;
let n = new Note(NoteName.C, 4, 1);
function Toggle() {
    if (incl) {
        sequencer.removeFromStep(0, n);
    } else {
        sequencer.addToStep(0, n);
    }
    incl = !incl;
}

function SetADRTimes() {
    //treat times as a percentage of overall beat length
    //convert to actual seconds based on current BPM and set
    let secondsPerBeat = sequencer.getSecondsPerBeat();
    let attackTime = parseFloat(rngAttackTime.value);
    let decayTime = parseFloat(rngDecayTime.value);
    let releaseTime = parseFloat(rngReleaseTime.value);

    let total = attackTime + decayTime + releaseTime;
    let factor = total > 1 ? (1.0 / total) : 1.0;

    synthesizer.envelope.attackTime = attackTime * factor * secondsPerBeat;
    synthesizer.envelope.decayTime = decayTime * factor * secondsPerBeat;
    synthesizer.envelope.releaseTime = releaseTime * factor * secondsPerBeat;
}

function ChangeEnvelope(this: HTMLInputElement, ev: Event) {
    let valAsFloat = parseFloat(this.value);    

    switch (this.id) {
        case "attackLevel":
            synthesizer.envelope.attackLevel = valAsFloat;
            break;
        case "sustainLevel":
            synthesizer.envelope.sustainLevel = valAsFloat;
            break;
        case "attackTime":
        case "decayTime":
        case "releaseTime":
            SetADRTimes();
            break;
    }
}
