
import { Sequencer, TimeSource } from "./Sequencer.js";
import { Note, NoteName, Octave } from "./Note.js";
import { Synthesizer } from "./Synthesizer.js";

const btnPlay: HTMLButtonElement = document.querySelector("#play");
const btnStop: HTMLButtonElement = document.querySelector("#stop");
const btnToggle: HTMLButtonElement = document.querySelector("#toggle");
const rngVol: HTMLInputElement = document.querySelector("#vol");
const rngBpm: HTMLInputElement = document.querySelector("#bpm");
const rngOct: HTMLInputElement = document.querySelector("#octave");

btnPlay.addEventListener("click", Play);
btnStop.addEventListener("click", Stop);
btnToggle.addEventListener("click", Toggle);
rngVol.addEventListener("change", ChangeVolume, false);
rngBpm.addEventListener("change", ChangeBpm, false);
rngOct.addEventListener("change", ChangeOctave, false);

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
