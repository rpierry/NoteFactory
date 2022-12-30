
import { ScheduledNote } from "./ScheduledNote.js";

const btnPlay: HTMLButtonElement = document.querySelector("#play");
const btnStop: HTMLButtonElement = document.querySelector("#stop");
const txtFreq: HTMLInputElement = document.querySelector("#freq");
const rngVol: HTMLInputElement = document.querySelector("#vol");

btnPlay.addEventListener("click", Play);
btnStop.addEventListener("click", Stop);
txtFreq.addEventListener("change", ChangeFrequency, false);
rngVol.addEventListener("change", ChangeVolume, false);

const ctx = new AudioContext();

const gainNode = ctx.createGain();
gainNode.connect(ctx.destination);
ChangeVolume();
ChangeFrequency();

let playing = false;
let timerId: number;

function Play() {
    if (playing) return;
    playing = true;

    ScheduleNote();    
}

function ScheduleNote() {
    let n =
        new ScheduledNote(
            parseFloat(txtFreq.value),
            ctx.currentTime + 0.5,
            0.5,
            ctx,
            gainNode,
            () => {
                console.log("done playing!");
                //playing = false;
            });

    timerId = setTimeout(ScheduleNote, 1000);
}

function Stop() {
    if (!playing) return;
    playing = false;

    clearTimeout(timerId);
}

function ChangeFrequency() {
    //oscNode.frequency.value = parseFloat(txtFreq.value);
}

function ChangeVolume() {
    gainNode.gain.value = parseFloat(rngVol.value);
}
