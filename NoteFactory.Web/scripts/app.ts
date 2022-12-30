
import { ScheduledNote } from "./ScheduledNote.js";
import { Sequencer, Note, TimeSource, NoteName, Octave } from "./Sequencer.js";

const btnPlay: HTMLButtonElement = document.querySelector("#play");
const btnStop: HTMLButtonElement = document.querySelector("#stop");
const txtFreq: HTMLInputElement = document.querySelector("#freq");
const rngVol: HTMLInputElement = document.querySelector("#vol");
const rngBpm: HTMLInputElement = document.querySelector("#bpm");

btnPlay.addEventListener("click", Play);
btnStop.addEventListener("click", Stop);
txtFreq.addEventListener("change", ChangeFrequency, false);
rngVol.addEventListener("change", ChangeVolume, false);
rngBpm.addEventListener("change", ChangeBpm, false);

const ctx = new AudioContext();

const gainNode = ctx.createGain();
gainNode.connect(ctx.destination);
ChangeVolume();
ChangeFrequency();

const sequencer = new Sequencer(ctx, ScheduleNotes);

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
