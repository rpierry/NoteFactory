
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

const oscNode = ctx.createOscillator();
oscNode.type = "sine";
//we can't reuse oscillators - they can only be played once
//so we will disconnect and reconnect from the audio graph instead
//oscNode.connect(gainNode);

ChangeFrequency();

let playing = false;
let started = false;


function Play() {
    if (playing) return;
    playing = true;

    if (!started) { oscNode.start(); started = true; }
    
    oscNode.connect(gainNode);
}

function Stop() {
    if (!playing) return;
    playing = false;
    //oscNode.stop();
    oscNode.disconnect(gainNode);
}

function ChangeFrequency() {
    oscNode.frequency.value = parseFloat(txtFreq.value);
}

function ChangeVolume() {
    gainNode.gain.value = parseFloat(rngVol.value);
}
