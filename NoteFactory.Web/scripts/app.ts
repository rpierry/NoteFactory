
import { NoteLength, Sequencer } from "./Sequencer.js";
import { Note, NoteName, NoteNames, Octave } from "./Note.js";
import { Synthesizer } from "./Synthesizer.js";


interface StateSnapshot {
    steps: number,
    bpm: number,
    noteLength: NoteLength,    
    pattern: { noteName: NoteName, octave: Octave }[][],
    octaveDelta: number,
    attackTime: number,
    decayTime: number,
    releaseTime: number,
    attackLevel: number,
    sustainLevel: number
}

const btnPlay: HTMLButtonElement = document.querySelector("#play");
const btnStop: HTMLButtonElement = document.querySelector("#stop");
const rngVol: HTMLInputElement = document.querySelector("#vol");
const outVol: HTMLOutputElement = document.querySelector("#volString");
const rngBpm: HTMLInputElement = document.querySelector("#bpm");
const outBpm: HTMLOutputElement = document.querySelector("#bpmString");
const selNoteLength: HTMLSelectElement = document.querySelector("#noteLength");
const rngOct: HTMLInputElement = document.querySelector("#octave");
const outOct: HTMLOutputElement = document.querySelector("#octaveString");
const rngSteps: HTMLInputElement = document.querySelector("#steps");
const outSteps: HTMLOutputElement = document.querySelector("#stepsString");
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
selNoteLength.addEventListener("change", ChangeNoteLength, false);
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

function OctaveModifierToMultiplier(octaveDelta: number) {
    switch (octaveDelta) {
        case -2: return 0.25;
        case -1: return 0.5;
        case 0: return 1;
        case 1: return 2;
        case 2: return 4;
    }
    return 1;
}

function ScheduleNotes(startTime: number, notes: Note[]) {    
    let freqMult = OctaveModifierToMultiplier(parseInt(rngOct.value));
    for (let n of notes) {
        synthesizer.play(n.getFrequency() * freqMult, startTime, n.beatDuration * sequencer.getSecondsPerBeat());
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
    outVol.value = Math.round(parseFloat(rngVol.value) * 100).toString();
}

function ChangeBpm() {
    sequencer.bpm = parseInt(rngBpm.value);
    SetADRTimes(); //recalc durations of the envelope

    outBpm.value = rngBpm.value;
}

function ChangeNoteLength() {
    sequencer.noteLength = selNoteLength.value as NoteLength;
    SetADRTimes(); //recalc env durations
}

function ChangeOctave() {
    outOct.value = rngOct.value;
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

function ChangeEnvelope(this: HTMLInputElement) {
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

function IsSubscribedToNoteUpdates() {
    let chkShare = document.querySelector('#shareUpdates') as HTMLInputElement;
    return (chkShare != null) && chkShare.checked;
}

function GridNoteClicked(this: Element) { 
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
    let added = true;

    if (td.classList.contains('selected')) {
        added = false;
        sequencer.removeFromStep(step, note);
        td.classList.remove('selected');
    } else {
        sequencer.addToStep(step, note);
        td.classList.add('selected');
    }
    
    
    let idHidden = document.querySelector('form input[name="id"]') as HTMLInputElement;
    if (IsSubscribedToNoteUpdates()) {
        let connection = (window as any).getCurrentHubConnection();        
        if ((connection != undefined) && (connection.state == "Connected")) {            
            //public record NoteChangedRequest(string id, bool added, int step, string noteData);
            connection.send("NoteChanged", { id: idHidden.value, added: added, step: step, noteData: JSON.stringify(note) });
        }
    }
}

function GetTdsForNote(grid: HTMLTableElement, n: Note) {
    let dataLabel = Note.getNoteNameKeyForValue(n.noteName) + n.octave.toString();
    let row = grid.querySelector('tr[data-note="' + dataLabel + '"]');
    return row.querySelectorAll('td.note');
}

function SelectNote(grid: HTMLTableElement, step: number, n: Note) {    
    let tds = GetTdsForNote(grid, n);
    tds[step].classList.add('selected');
}

function ClearNote(grid: HTMLTableElement, step: number, n: Note) {
    let tds = GetTdsForNote(grid, n);
    tds[step].classList.remove('selected');
}

function ClearSelectedNotes(grid: HTMLTableElement) {
    let tds = grid.querySelectorAll('td.note');
    tds.forEach((e) => e.classList.remove('selected'));
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
            let newStepLabel = (oldCount + i + 1).toString();
            let newCol = cloneCol.cloneNode(true) as HTMLTableColElement;
            newCol.dataset['stepid'] = newStepId;
            colGroup.appendChild(newCol);

            let newTh = aTh.cloneNode(true) as HTMLTableCellElement;
            newTh.innerText = newStepLabel;
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

    outSteps.value = rngSteps.value;
}

function SaveStateSnapshot(): string {
    var pat: { noteName: NoteName, octave: Octave }[][] = [];

    var objState =
    {
        steps: sequencer.steps,
        bpm: sequencer.bpm,
        noteLength: sequencer.noteLength,
        pattern: pat,
        octaveDelta: parseInt(rngOct.value),
        attackTime: parseFloat(rngAttackTime.value),
        decayTime: parseFloat(rngDecayTime.value),
        releaseTime: parseFloat(rngReleaseTime.value),
        attackLevel: synthesizer.envelope.attackLevel,
        sustainLevel: synthesizer.envelope.sustainLevel
    };

    //foreachnote only gets called for pattern steps that have notes, so we have to init
    //all of the arrays ourselves first, just to make sure we serialize empty arrays instead of nulls
    for (var i = 0; i < sequencer.steps; i++) {
        objState.pattern[i] = new Array<{ noteName: NoteName, octave: Octave }>();
    }

    sequencer.forEachNote((s, n) => {        
        var note = n as Note;
        objState.pattern[s].push({ noteName: note.noteName, octave: note.octave });
    });

    return JSON.stringify(objState);
}

function LoadStateSnapshot(state: string) {
    var objState: StateSnapshot = JSON.parse(state);

    sequencer.clearAll();
    ClearSelectedNotes(tblGrid);

    rngSteps.value = objState.steps.toString();
    ChangeSteps();

    rngBpm.value = objState.bpm.toString();
    ChangeBpm();

    selNoteLength.value = objState.noteLength;
    ChangeNoteLength();

    //pattern
    for (var i = 0; i < objState.pattern.length; i++) {
        for (var n of objState.pattern[i]) {
            let note = new Note(n.noteName, n.octave, 1);
            sequencer.addToStep(i, note);
            SelectNote(tblGrid, i, note);
        }
    }

    rngOct.value = objState.octaveDelta.toString();
    ChangeOctave();

    rngAttackLevel.value = objState.attackLevel.toString();
    rngAttackTime.value = objState.attackTime.toString();
    rngDecayTime.value = objState.decayTime.toString();
    rngSustainLevel.value = objState.sustainLevel.toString();
    rngReleaseTime.value = objState.releaseTime.toString();
    
    synthesizer.envelope.attackLevel = objState.attackLevel;
    synthesizer.envelope.sustainLevel = objState.sustainLevel;
    SetADRTimes();
}

function ProcessIncomingNoteChange(el: HTMLElement) {
    if (IsSubscribedToNoteUpdates()) {
        let addedRaw = el.dataset['noteadded'];
        let stepRaw = el.dataset['notestep'];
        let dataRaw = el.dataset['notedata'];

        let added = addedRaw == "True";
        let step = parseInt(stepRaw);
        let noteRaw = JSON.parse(dataRaw);
        let note = new Note(noteRaw.noteName, noteRaw.octave, noteRaw.beatDuration);

        if (step >= sequencer.steps) return; //ignore out of bounds data

        if (added) {
            sequencer.addToStep(step, note);
            SelectNote(tblGrid, step, note);
        } else {
            sequencer.removeFromStep(step, note);
            ClearNote(tblGrid, step, note);
        }
    }
}

//'export' this to the browser so we can call it from hyperscript later
(window as any).SaveStateSnapshot = SaveStateSnapshot;
(window as any).LoadStateSnapshot = LoadStateSnapshot;
(window as any).ProcessIncomingNoteChange = ProcessIncomingNoteChange;