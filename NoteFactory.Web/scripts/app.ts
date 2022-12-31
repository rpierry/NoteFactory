
import { ScheduledNote } from "./ScheduledNote.js";
import { Sequencer, Note, TimeSource, NoteName, Octave } from "./Sequencer.js";

const btnPlay: HTMLButtonElement = document.querySelector("#play");
const btnStop: HTMLButtonElement = document.querySelector("#stop");
const btnToggle: HTMLButtonElement = document.querySelector("#toggle");
const txtFreq: HTMLInputElement = document.querySelector("#freq");
const rngVol: HTMLInputElement = document.querySelector("#vol");
const rngBpm: HTMLInputElement = document.querySelector("#bpm");

btnPlay.addEventListener("click", Play);
btnStop.addEventListener("click", Stop);
btnToggle.addEventListener("click", Toggle);
txtFreq.addEventListener("change", ChangeFrequency, false);
rngVol.addEventListener("change", ChangeVolume, false);
rngBpm.addEventListener("change", ChangeBpm, false);

const ctx = new AudioContext();

const gainNode = ctx.createGain();
gainNode.connect(ctx.destination);
ChangeVolume();
ChangeFrequency();

const sequencer = new Sequencer(ctx, ScheduleNotes);
sequencer.addToStep(0, new Note(NoteName.A, 4, 1));
sequencer.addToStep(1, new Note(NoteName.B, 4, 1));
sequencer.addToStep(2, new Note(NoteName.C, 4, 1));
sequencer.addToStep(3, new Note(NoteName.D, 4, 1));
sequencer.addToStep(4, new Note(NoteName.E, 4, 1));
sequencer.addToStep(5, new Note(NoteName.F, 4, 1));
sequencer.addToStep(6, new Note(NoteName.G, 4, 1));

let playing = false;

function Play() {
    if (playing) return;
    playing = true;

    sequencer.play();
}

function ScheduleNotes(startTime: number, notes: Note[]) {
    for (let n of notes) {
        let sn =
            new ScheduledNote(
                n.noteName,
                startTime,
                n.beatDuration * sequencer.getSecondsPerBeat() * 0.9,
                ctx,
                gainNode,
                () => { });
    }
}

function Stop() {
    if (!playing) return;
    playing = false;
    
    sequencer.stop();    
}

function ChangeFrequency() {
    //oscNode.frequency.value = parseFloat(txtFreq.value);
}

function ChangeVolume() {
    gainNode.gain.value = parseFloat(rngVol.value);
}

function ChangeBpm() {
    sequencer.bpm = parseInt(rngBpm.value);
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
