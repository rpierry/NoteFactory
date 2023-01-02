
import { Sequencer } from "./Sequencer.js";
import { Note, NoteNames, Octave } from "./Note.js";
import { Synthesizer } from "./Synthesizer.js";

const btnPlay: HTMLButtonElement = document.querySelector("#play");
const btnStop: HTMLButtonElement = document.querySelector("#stop");
const rngVol: HTMLInputElement = document.querySelector("#vol");
const rngBpm: HTMLInputElement = document.querySelector("#bpm");
const rngOct: HTMLInputElement = document.querySelector("#octave");
const rngSteps: HTMLInputElement = document.querySelector("#steps");
const rngAttackLevel: HTMLInputElement = document.querySelector("#attackLevel");
const rngAttackTime: HTMLInputElement = document.querySelector("#attackTime");
const rngDecayTime: HTMLInputElement = document.querySelector("#decayTime");
const rngSustainLevel: HTMLInputElement = document.querySelector("#sustainLevel");
const rngReleaseTime: HTMLInputElement = document.querySelector("#releaseTime");
const tblGrid: HTMLTableElement = document.querySelector("#noteGrid");

btnPlay.addEventListener("click", Play);
btnStop.addEventListener("click", Stop);
rngVol.addEventListener("change", ChangeVolume, false);
rngBpm.addEventListener("change", ChangeBpm, false);
rngOct.addEventListener("change", ChangeOctave, false);
rngSteps.addEventListener("change", ChangeSteps, false);
rngAttackLevel.addEventListener("change", ChangeEnvelope, false);
rngAttackTime.addEventListener("change", ChangeEnvelope, false);
rngDecayTime.addEventListener("change", ChangeEnvelope, false);
rngSustainLevel.addEventListener("change", ChangeEnvelope, false);
rngReleaseTime.addEventListener("change", ChangeEnvelope, false);

tblGrid.querySelectorAll("td.note").forEach(e => e.addEventListener("click", GridNoteClicked));

const ctx = new AudioContext();

const sequencer = new Sequencer(ctx, ScheduleNotes, StepChanged);
const synthesizer = new Synthesizer(ctx);
ChangeVolume();
SetADRTimes();

let playing = false;

function Play() {
    if (playing) return;
    playing = true;
    if (ctx.state == "suspended") ctx.resume();

    sequencer.play();
}

function ScheduleNotes(startTime: number, notes: Note[]) {
    for (let n of notes) {
        synthesizer.play(n.getFrequency(), startTime, n.beatDuration * sequencer.getSecondsPerBeat());        
    }
}

function ClearActiveStep() {
    tblGrid.querySelectorAll("col.step").forEach((e) => e.classList.remove("active"));
}

function Stop() {
    if (!playing) return;
    playing = false;
    
    sequencer.stop();        
    ClearActiveStep();
}

function StepChanged(step: number) {
    ClearActiveStep();
    tblGrid.querySelector("col[data-stepid = '" + step + "']").classList.add("active");
}

function ChangeVolume() {    
    synthesizer.gain = parseFloat(rngVol.value);
}

function ChangeBpm() {
    sequencer.bpm = parseInt(rngBpm.value);
    SetADRTimes(); //recalc durations of the envelope
}

function ChangeOctave() {
    sequencer.mapNotes(
        (n: Note) => new Note(n.noteName, parseInt(rngOct.value) as Octave, n.beatDuration));
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

function GridNoteClicked(this: Element, ev: Event) {    
    //find col and row
    let td = this as HTMLTableCellElement;
    let tr = td.parentElement as HTMLTableRowElement;
    let noteAttr = tr.dataset['note'];
    let noteName = noteAttr.substring(0, noteAttr.length - 1);
    let noteNameKey = noteName as keyof typeof NoteNames;
    let octave = parseInt(noteAttr.substring(noteAttr.length - 1));
    let octaveKey = octave as Octave;
    let note = new Note(NoteNames[noteNameKey], octaveKey, 1);

    let step = td.cellIndex - 1; //account for the th

    if (td.classList.contains('selected')) {
        sequencer.removeFromStep(step, note);
        td.classList.remove('selected');
    } else {
        sequencer.addToStep(step, note);
        td.classList.add('selected');
    }
}

function SelectNote(grid: HTMLTableElement, step: number, n: Note) {
    let dataLabel = Note.getNoteNameKeyForValue(n.noteName) + n.octave.toString();
    let row = grid.querySelector('tr[data-note="' + dataLabel + '"]');
    let tds = row.querySelectorAll('td.note');
    tds[step].classList.add('selected');
}

function ChangeSteps() {
    let oldCount = sequencer.steps;
    let newCount = parseInt(rngSteps.value);
    sequencer.steps = newCount;

    //setup table markup
    // col in colgroup
    // th in first row
    // td in every row with a data-note
    let colGroup = tblGrid.querySelector('colgroup');
    let firstRow = tblGrid.querySelector('tr');
    let dataRows = tblGrid.querySelectorAll('tr[data-note]');

    if (newCount < oldCount) {
        let toRemoveCount = oldCount - newCount;
        let cols = colGroup.querySelectorAll('col.step');
        let ths = firstRow.querySelectorAll('th');

        for (var i = 0; i < toRemoveCount; i++) {
            //length of cols and ths remains at oldCount
            //array isn't updated after we remove since we
            //dont requery
            cols[cols.length - 1 - i].remove();
            ths[ths.length - 1 - i].remove();
            for (var j = 0; j < dataRows.length; j++) {
                let tds = dataRows[j].querySelectorAll('td');
                tds[tds.length - 1].remove();
            }
        }
    } else {
        let toAddCount = newCount - oldCount;
        let aCol = colGroup.querySelector('col.step');
        let cloneCol = aCol.cloneNode(true) as Element;
        cloneCol.classList.remove('active');

        let aTh = firstRow.querySelector('th[scope]');
        let aTd = dataRows[0].querySelector('td.note');

        for (var i = 0; i < toAddCount; i++) {
            let newStepId = (oldCount + i).toString();
            let newCol = cloneCol.cloneNode(true) as HTMLTableColElement;
            newCol.dataset['stepid'] = newStepId;
            colGroup.appendChild(newCol);

            let newTh = aTh.cloneNode(true) as HTMLTableCellElement;
            newTh.innerText = newStepId;
            firstRow.appendChild(newTh);

            for (var j = 0; j < dataRows.length; j++) {
                let newTd = aTd.cloneNode(true);                
                newTd.addEventListener("click", GridNoteClicked);
                dataRows[j].appendChild(newTd);
            }
        }
    }

    //clear selected notes / columns and repopulate from sequencer
    tblGrid.querySelectorAll('td.note').forEach((e) => e.classList.remove('selected'));
    sequencer.forEachNote((step: number, n: Note) => SelectNote(tblGrid, step, n));
}
