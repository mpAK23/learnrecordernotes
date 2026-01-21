
// State
let appState = {
    instrument: 'soprano', // 'soprano' | 'alto'
    mode: 'explore',       // 'explore' | 'quiz'
    selectedNote: null,    // current note key e.g. "C4"
    quizTarget: null,
    score: 0
};

// DOM Elements
const staffContainer = document.getElementById('staff-container');
const recorderWrapper = document.querySelector('.recorder-wrapper');
const noteBank = document.getElementById('note-bank');
const msgBox = document.getElementById('quiz-message');
const btnSoprano = document.getElementById('btn-soprano');
const btnAlto = document.getElementById('btn-alto');
const btnExplore = document.getElementById('btn-explore');
const btnQuiz = document.getElementById('btn-quiz');

// Initialization
function init() {
    setupListeners();
    renderNoteBank();
    renderStaff();
    if (appState.mode === 'explore') {
        selectNote(Object.keys(NOTE_DATA[appState.instrument])[0]);
    }
}

function setupListeners() {
    btnSoprano.onclick = () => setInstrument('soprano');
    btnAlto.onclick = () => setInstrument('alto');
    btnExplore.onclick = () => setMode('explore');
    btnQuiz.onclick = () => setMode('quiz');
}

function setInstrument(inst) {
    if (appState.instrument === inst) return;
    appState.instrument = inst;
    btnSoprano.classList.toggle('active', inst === 'soprano');
    btnAlto.classList.toggle('active', inst === 'alto');
    renderNoteBank();
    if (appState.mode === 'explore') {
        selectNote(Object.keys(NOTE_DATA[inst])[0]);
    } else {
        startQuiz();
    }
}

function setMode(mode) {
    if (appState.mode === mode) return;
    appState.mode = mode;
    btnExplore.classList.toggle('active', mode === 'explore');
    btnQuiz.classList.toggle('active', mode === 'quiz');

    const advToggle = document.getElementById('advanced-toggle-container');
    if (advToggle) {
        if (mode === 'quiz') {
            advToggle.classList.remove('hidden');
        } else {
            advToggle.classList.add('hidden');
        }
    }

    if (mode === 'quiz') startQuiz(); else stopQuiz();
}

function renderNoteBank() {
    noteBank.innerHTML = '';
    const notes = NOTE_DATA[appState.instrument];
    let noteKeys = Object.keys(notes);

    // Sort logic
    noteKeys.sort((a, b) => {
        const offA = NOTE_OFFSETS[a] || 0;
        const offB = NOTE_OFFSETS[b] || 0;
        if (offA !== offB) return offA - offB;
        return a.length - b.length;
    });

    // Separation Logic
    let splitNoteIndex = -1;
    if (appState.instrument === 'soprano') {
        // Split after D5. Find index of D5.
        // If sorting works correctly, we just find "D5".
        splitNoteIndex = noteKeys.indexOf("D5");
    } else {
        // Alto: Split after G#5.
        splitNoteIndex = noteKeys.indexOf("G#5");
    }

    const row1Div = document.createElement('div');
    row1Div.className = 'note-row';
    const row2Div = document.createElement('div');
    row2Div.className = 'note-row';

    noteKeys.forEach((noteKey, index) => {
        const btn = document.createElement('button');
        btn.className = 'note-btn';

        // Enharmonic Logic: Show Sharp/Flat e.g. F#/Gb4
        let labelHTML = noteKey.replace(/(\d+)/, '<sub>$1</sub>'); // Default
        if (noteKey.includes('#')) {
            const match = noteKey.match(/^([A-G]#)(\d+)$/);
            if (match) {
                const noteName = match[1];
                const octave = match[2];
                const map = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
                if (map[noteName]) {
                    // "only one number for the octave" -> F#/Gb4
                    labelHTML = `${noteName}/${map[noteName]}<sub>${octave}</sub>`;
                }
            }
        }

        btn.innerHTML = labelHTML;
        btn.onclick = () => handleNoteInput(noteKey);
        btn.dataset.note = noteKey;

        if (splitNoteIndex !== -1 && index <= splitNoteIndex) {
            row1Div.appendChild(btn);
        } else {
            row2Div.appendChild(btn);
        }
    });

    noteBank.appendChild(row1Div);
    // Add a small divider or just let block display handle it
    noteBank.appendChild(row2Div);
}

function handleNoteInput(noteKey) {
    // Audio Feedback
    if (typeof playNote === 'function') {
        // For Soprano, we shift playNote logic internally.
        // We just pass the key.
        playNote(noteKey);
    }

    if (appState.mode === 'explore') selectNote(noteKey); else checkQuizAnswer(noteKey);
}

function selectNote(noteKey) {
    appState.selectedNote = noteKey;
    document.querySelectorAll('.note-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.note-btn[data-note="${noteKey}"]`);
    if (btn) btn.classList.add('active');
    updateStaff(noteKey);
    updateRecorder(noteKey);
}

// ----------------------
// Recorder Rendering
// ----------------------
function createRecorderElement(index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'recorder-visual';
    wrapper.id = `recorder-visual-${index}`;

    // Generated Cream Recorder Structure
    let html = `
        <div class="recorder-body">
            <div class="mouthpiece-area"></div>
            <div class="mouthpiece-window"></div>
            <div class="joint top"></div>
            <div class="joint middle"></div>
            <div class="joint foot"></div>
            
            <!-- Holes -->
            <!-- Thumb (0) -->
            <div class="hole" id="rec-${index}-hole-0"><div class="finger-dot"></div> <span class="thumb-label">Thumb</span></div>
            
            <!-- Standard Holes 1-5 -->
            <div class="hole" id="rec-${index}-hole-1"><div class="finger-dot"></div></div>
            <div class="hole" id="rec-${index}-hole-2"><div class="finger-dot"></div></div>
            <div class="hole" id="rec-${index}-hole-3"><div class="finger-dot"></div></div>
            <div class="hole" id="rec-${index}-hole-4"><div class="finger-dot"></div></div>
            <div class="hole" id="rec-${index}-hole-5"><div class="finger-dot"></div></div>
            
            <!-- Double Holes 6 & 7 -->
            <div class="hole-pair" id="rec-${index}-hole-6">
                <div class="hole-sub left"><div class="finger-dot"></div></div>
                <div class="hole-sub right"><div class="finger-dot"></div></div>
            </div>
            <div class="hole-pair" id="rec-${index}-hole-7">
                <div class="hole-sub left"><div class="finger-dot"></div></div>
                <div class="hole-sub right"><div class="finger-dot"></div></div>
            </div>
            
            <div class="bell">
                <div class="bell-cover" id="rec-${index}-bell-cover"></div>
            </div>
        </div>
    `;
    wrapper.innerHTML = html;
    return wrapper;
}

function updateRecorder(noteKey) {
    const container = document.querySelector('.recorder-wrapper');
    if (!container) return;
    container.innerHTML = '';

    if (!noteKey) return;
    const data = NOTE_DATA[appState.instrument][noteKey];
    if (!data) return;

    data.forEach((fingering, idx) => {
        const el = createRecorderElement(idx);
        container.appendChild(el);

        if (data.length > 1) {
            const label = document.createElement('div');
            label.className = 'alt-label';
            label.innerText = idx === 0 ? "Standard" : "Alternate";
            el.appendChild(label);
        }

        fingering.forEach((state, holeIdx) => {
            // Index 8: Bell Cover
            if (holeIdx === 8) {
                const cover = el.querySelector(`#rec-${idx}-bell-cover`);
                if (cover && state === 1) {
                    cover.classList.add('visible');
                    // Add label "Knee" or "Bell"?
                    // Could add tool tip if needed, but visual enough.
                }
            }
            // Handle Thumb & 1-5 (Single Holes)
            else if (holeIdx <= 5) {
                const hole = el.querySelector(`#rec-${idx}-hole-${holeIdx}`);
                if (!hole) return;
                hole.className = 'hole'; // reset
                if (state === 1) {
                    hole.classList.add('covered');
                } else if (state === 0.5) {
                    hole.className = 'hole half'; // Pinched thumb
                }
            }
            // Handle 6 & 7 (Double Holes)
            else {
                const pair = el.querySelector(`#rec-${idx}-hole-${holeIdx}`);
                if (!pair) return;
                const subs = pair.querySelectorAll('.hole-sub');

                // State 1: Both Covered
                if (state === 1) {
                    subs.forEach(s => s.classList.add('covered'));
                }
                // State 0.5: One Covered
                // User requirement: "when it's only one hole, it's the smaller one to the left..."
                // So cover the Left one (index 0).
                else if (state === 0.5) {
                    subs[0].classList.add('covered'); // Left Covered
                }
                // State 0: Open
            }
        });
    });
}

// ----------------------
// Staff Rendering
// ----------------------
function renderStaff() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 200 150");
    svg.classList.add("staff-svg");

    const startY = 50;
    const spacing = 10;
    for (let i = 0; i < 5; i++) {
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", "10");
        line.setAttribute("y1", startY + (i * spacing));
        line.setAttribute("x2", "190");
        line.setAttribute("y2", startY + (i * spacing));
        line.setAttribute("stroke", "#aaa");
        line.setAttribute("stroke-width", "2");
        svg.appendChild(line);
    }

    const clefTxt = document.createElementNS(ns, "text");
    clefTxt.setAttribute("x", "15");
    clefTxt.setAttribute("y", "85");
    clefTxt.setAttribute("font-size", "40");
    clefTxt.setAttribute("fill", "#ddd");
    clefTxt.textContent = "𝄞";
    svg.appendChild(clefTxt);

    const noteGroup = document.createElementNS(ns, "g");
    noteGroup.id = "staff-note-group";
    svg.appendChild(noteGroup);

    staffContainer.innerHTML = '';
    staffContainer.appendChild(svg);
}

function updateStaff(noteKey) {
    const group = document.getElementById("staff-note-group");
    if (!group) return;
    group.innerHTML = '';

    const offset = NOTE_OFFSETS[noteKey];
    if (offset === undefined) return;

    const centerY = 70;
    const stepSize = 5;
    const cy = centerY - (offset * stepSize);
    const ns = "http://www.w3.org/2000/svg";

    // Ledgers
    if (cy <= 40) {
        let curr = 40;
        while (curr >= cy) {
            const line = document.createElementNS(ns, "line");
            line.setAttribute("x1", "80"); line.setAttribute("x2", "120");
            line.setAttribute("y1", curr); line.setAttribute("y2", curr);
            line.setAttribute("stroke", "#aaa"); line.setAttribute("stroke-width", "2");
            group.appendChild(line);
            curr -= 10;
        }
    }
    if (cy >= 100) {
        let curr = 100;
        while (curr <= cy) {
            const line = document.createElementNS(ns, "line");
            line.setAttribute("x1", "80"); line.setAttribute("x2", "120");
            line.setAttribute("y1", curr); line.setAttribute("y2", curr);
            line.setAttribute("stroke", "#aaa"); line.setAttribute("stroke-width", "2");
            group.appendChild(line);
            curr += 10;
        }
    }

    const noteHead = document.createElementNS(ns, "ellipse");
    noteHead.setAttribute("cx", "100");
    noteHead.setAttribute("cy", cy);
    noteHead.setAttribute("rx", "8");
    noteHead.setAttribute("ry", "6");
    noteHead.setAttribute("fill", "#fff");
    group.appendChild(noteHead);

    if (noteKey.includes("#")) {
        const acc = document.createElementNS(ns, "text");
        acc.setAttribute("x", "75"); acc.setAttribute("y", cy + 5);
        acc.setAttribute("fill", "#fff"); acc.setAttribute("font-size", "20");
        acc.textContent = "♯";
        group.appendChild(acc);
    }
}

function startQuiz() {
    msgBox.classList.remove('hidden');
    nextQuizQuestion();
}

function stopQuiz() {
    msgBox.classList.add('hidden');
    appState.quizTarget = null;
    clearVisuals();
}

function nextQuizQuestion() {
    const notes = Object.keys(NOTE_DATA[appState.instrument]);
    const advancedCb = document.getElementById('cb-advanced');
    const includeAdvanced = advancedCb ? advancedCb.checked : false;

    // Filter Logic
    let pool = notes;
    if (!includeAdvanced) {
        // Determine Split Point (Same as renderNoteBank)
        let splitNote = appState.instrument === 'soprano' ? "D5" : "G#5";
        let splitIdx = notes.indexOf(splitNote);

        if (splitIdx !== -1) {
            // Include only up to split index (Row 1)
            pool = notes.slice(0, splitIdx + 1);
        }
    }

    const rnd = pool[Math.floor(Math.random() * pool.length)];
    appState.quizTarget = rnd;
    msgBox.textContent = "Identify this note!";
    msgBox.className = "quiz-feedback";
    updateRecorder(rnd);
    const group = document.getElementById("staff-note-group");
    if (group) group.innerHTML = '';
    const ns = "http://www.w3.org/2000/svg";
    const q = document.createElementNS(ns, "text");
    q.setAttribute("x", "90"); q.setAttribute("y", "75");
    q.setAttribute("fill", "#888"); q.setAttribute("font-size", "40");
    q.textContent = "?";
    if (group) group.appendChild(q);
}

function checkQuizAnswer(noteInput) {
    if (noteInput === appState.quizTarget) {
        msgBox.textContent = "Correct!";
        msgBox.classList.add('correct');
        updateStaff(appState.quizTarget);
        setTimeout(nextQuizQuestion, 3000); // User requested ~3s pause to view correct answer
    } else {
        msgBox.textContent = "Try Again!";
        msgBox.classList.add('incorrect');
    }
}

function clearVisuals() {
    if (appState.mode === 'quiz') return;
    const group = document.getElementById("staff-note-group");
    if (group) group.innerHTML = '';
    const container = document.querySelector('.recorder-wrapper');
    if (container) container.innerHTML = '';
}

init();
