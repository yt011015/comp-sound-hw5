
var audioCtx;
var osc;
var timings;
var liveCodeState = [];
const playButton = document.querySelector('button');
var notes;
var prevNotes;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)
    osc = audioCtx.createOscillator();
    timings = audioCtx.createGain();
    timings.gain.value = 0;
    osc.connect(timings).connect(audioCtx.destination);
    osc.start();
    scheduleAudio()
}

function scheduleAudio() {
    let timeElapsedSecs = 0;
    liveCodeState.forEach(noteData => {
        timings.gain.setTargetAtTime(1, audioCtx.currentTime + timeElapsedSecs, 0.01)
        osc.frequency.setTargetAtTime(noteData["pitch"], audioCtx.currentTime + timeElapsedSecs, 0.01)
        timeElapsedSecs += noteData["length"]/10.0;
        timings.gain.setTargetAtTime(0, audioCtx.currentTime + timeElapsedSecs, 0.01)
        timeElapsedSecs += 0.2; //rest between notes
    });
    setTimeout(scheduleAudio, timeElapsedSecs * 1000);
}

function parseCode(code) {
    if (code == "") {
        return "NO_INPUT";
    }
    let tokens = [];
    let bracketOpen = false;
    let token = "";

    for (let char of code) {
        if (char == " " && !bracketOpen) {
            tokens.push(token);
            token = "";
        } else if (char == " " && bracketOpen) {
            token += char;
        } else if (char == "[") {
            bracketOpen = true;
            token += char;

        } else if (char == "]") {
            bracketOpen = false;
            token += char;
        } else {
            token += char;
        }
    }
    tokens.push(token);
    prevNotes = notes;

    try {
        notes = parseBrackets(tokens);
        notes = notes.map(note => {
            noteData = note.split("@");
            return   {"length" : eval(noteData[0]),
                    "pitch" : eval(noteData[1])};
        });
        console.log(notes);
    } catch (error) {
        console.log("Parsing Error:", error.message);
        notes = prevNotes;
    }
    return notes;
}

function parseBrackets(tokens) {
    let notes = [];
    const regex = /^(.*?)\[(.*?)\]/;
    for (let t of tokens) {
        let match = t.match(regex);
        if (match != null) {
            for (let i = 0; i < eval(match[1]); i ++) {
                notes.push(...match[2].split(" "));
            }
        } else {
            notes.push(t);
        }
    }
    return notes;
}

function genAudio(data) {
    liveCodeState = data;
}

function reevaluate() {
    var code = document.getElementById('code').value.trim();
    var data = parseCode(code);
    if (data == "NO_INPUT") {
        console.log("No Input Error: Please input code.");
    } else if (data != null) {
        genAudio(data);
    }
}

playButton.addEventListener('click', function () {

    if (!audioCtx) {
        initAudio();
    }

    reevaluate();


});