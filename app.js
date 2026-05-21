/* ===================== DATA POOLS & RANDOMIZATION ===================== */

// 1. Word Pool
const masterWordPool = [
    "truck", "banana", "violin", "desk", "green", 
    "apple", "chair", "ocean", "river", "horse", 
    "clock", "bread", "stone", "cloud", "train"
];
let targetWords = [];

// 2. Naming (Recognition) Pool
const masterNamingPool = [
    { emoji: "🦁", valid: ["lion"] },
    { emoji: "🦏", valid: ["rhino", "rhinoceros"] },
    { emoji: "🐪", valid: ["camel", "dromedary"] },
    { emoji: "🐘", valid: ["elephant"] },
    { emoji: "🐅", valid: ["tiger"] },
    { emoji: "🐻", valid: ["bear"] },
    { emoji: "🦓", valid: ["zebra"] },
    { emoji: "🦒", valid: ["giraffe"] }
];
let currentNamingTargets = [];

// 3. Abstraction Pool
const masterAbstractionPool = [
    {
        q: "How are a <strong>Train</strong> and a <strong>Bicycle</strong> alike?",
        options: [
            { text: "A. They both have wheels", points: 0 },
            { text: "B. They are means of transportation", points: 1 },
            { text: "C. They are both made of metal", points: 0 },
            { text: "D. They both travel on tracks", points: 0 }
        ]
    },
    {
        q: "How are a <strong>Watch</strong> and a <strong>Ruler</strong> alike?",
        options: [
            { text: "A. They are both measuring instruments", points: 1 },
            { text: "B. They both have numbers on them", points: 0 },
            { text: "C. They are both made of plastic", points: 0 },
            { text: "D. They are used in school", points: 0 }
        ]
    },
    {
        q: "How are a <strong>Poem</strong> and a <strong>Statue</strong> alike?",
        options: [
            { text: "A. They are both old", points: 0 },
            { text: "B. They are found in museums", points: 0 },
            { text: "C. They are both works of art", points: 1 },
            { text: "D. They are made by people", points: 0 }
        ]
    }
];
let currentAbstraction = null;

// Utility: Shuffle Array
function shuffleArray(array) {
    let newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// Generate the specific random test setup for this session
function initializeRandomTest() {
    // Pick 5 random words
    targetWords = shuffleArray(masterWordPool).slice(0, 5);
    
    // Pick 3 random animals to name
    currentNamingTargets = shuffleArray(masterNamingPool).slice(0, 3);
    
    // Pick 1 random abstraction question
    currentAbstraction = shuffleArray(masterAbstractionPool)[0];

    // Inject Words into HTML
    const wordGrid = document.getElementById('word-grid-container');
    wordGrid.innerHTML = '';
    targetWords.forEach(word => {
        const div = document.createElement('div');
        div.className = 'word-item';
        div.innerText = word;
        wordGrid.appendChild(div);
    });

    // Inject Abstraction into HTML
    document.getElementById('abs-question').innerHTML = currentAbstraction.q;
    const absOptionsGrid = document.getElementById('abs-options');
    absOptionsGrid.innerHTML = '';
    
    // Shuffle the options so the correct answer isn't always in the same spot
    const shuffledOptions = shuffleArray(currentAbstraction.options);
    shuffledOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = opt.text;
        btn.onclick = () => submitAbstraction(opt.points);
        absOptionsGrid.appendChild(btn);
    });
}


/* ===================== GLOBAL STATE & NAVIGATION ===================== */
let scores = {
    visualLevel: 1,
    attentionHits: 0,
    attentionTotal: 11,
    attentionFalseAlarms: 0,
    naming: 0,
    abstraction: 0,
    recall: 0
};

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
    document.getElementById(screenId).classList.add('visible');
}

function startPhase(phase) {
    if (phase === 'memory-encode') {
        initializeRandomTest(); // Randomize right before starting
        startMemoryEncoding();
    }
    if (phase === 'visual-memory') startVisualMemory();
    if (phase === 'attention') startAttention();
    if (phase === 'naming') startNaming();
    if (phase === 'abstraction') startAbstraction();
    if (phase === 'recall') startRecall();
    if (phase === 'results') showResults();
}


/* ===================== PHASE 1: MEMORY ENCODING ===================== */
let encodeInterval;
function startMemoryEncoding() {
    switchScreen('screen-memory-encode');
    let timeLeft = 12;
    const timerDisplay = document.getElementById('encode-timer');
    
    encodeInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(encodeInterval);
            startPhase('visual-memory');
        }
    }, 1000);
}

function skipEncoding() {
    clearInterval(encodeInterval);
    startPhase('visual-memory');
}


/* ===================== PHASE 2: VISUAL MEMORY (TILES) ===================== */
let vmLevel = 1;
let vmLives = 3;
let vmGridSize = 3;
let vmActiveCount = 3;
let vmPattern = [];
let vmClicked = [];
let vmState = 'waiting'; 
const board = document.getElementById('game-board');

function startVisualMemory() {
    switchScreen('screen-visual-memory');
    vmLevel = 1;
    vmLives = 3;
    updateVmHeader();
    initVmLevel();
}

function updateVmHeader() {
    document.getElementById('vm-level-display').innerText = vmLevel;
    document.getElementById('vm-lives-display').innerText = '🤍'.repeat(vmLives);
}

function initVmLevel() {
    vmState = 'waiting';
    vmClicked = [];
    vmPattern = [];
    board.innerHTML = '';
    document.getElementById('vm-transition-msg').style.display = 'none';
    
    // Calculate Difficulty
    vmActiveCount = vmLevel + 2; 
    vmGridSize = 3;
    while (vmActiveCount > (vmGridSize * vmGridSize) * 0.45) { vmGridSize++; }
    
    board.style.gridTemplateColumns = `repeat(${vmGridSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${vmGridSize}, 1fr)`;

    let totalTiles = vmGridSize * vmGridSize;
    let availableIndices = Array.from({length: totalTiles}, (_, i) => i);
    
    for (let i = 0; i < vmActiveCount; i++) {
        let randomIndex = Math.floor(Math.random() * availableIndices.length);
        vmPattern.push(availableIndices[randomIndex]);
        availableIndices.splice(randomIndex, 1);
    }

    for (let i = 0; i < totalTiles; i++) {
        let tile = document.createElement('div');
        tile.classList.add('tile');
        tile.addEventListener('click', () => handleTileClick(i, tile));
        board.appendChild(tile);
    }

    setTimeout(showVmPattern, 800);
}

function showVmPattern() {
    vmState = 'showing';
    const tiles = document.querySelectorAll('.tile');
    vmPattern.forEach(index => tiles[index].classList.add('active'));

    const displayTime = Math.max(700, 1500 - (vmLevel * 50));

    setTimeout(() => {
        vmPattern.forEach(index => tiles[index].classList.remove('active'));
        vmState = 'playing';
    }, displayTime);
}

function handleTileClick(index, tileElement) {
    if (vmState !== 'playing') return;
    if (vmClicked.includes(index)) return;

    if (vmPattern.includes(index)) {
        tileElement.classList.add('revealed');
        vmClicked.push(index);

        if (vmClicked.length === vmPattern.length) {
            vmState = 'waiting';
            setTimeout(() => {
                vmLevel++;
                updateVmHeader();
                initVmLevel();
            }, 800);
        }
    } else {
        vmState = 'waiting';
        tileElement.classList.add('wrong');
        vmLives--;
        updateVmHeader();

        const tiles = document.querySelectorAll('.tile');
        vmPattern.forEach(idx => {
            if (!vmClicked.includes(idx)) tiles[idx].classList.add('active');
        });

        setTimeout(() => {
            if (vmLives > 0) {
                initVmLevel(); // Retry same level
            } else {
                scores.visualLevel = vmLevel; // Save score
                document.getElementById('vm-transition-msg').style.display = 'block';
                setTimeout(() => startPhase('attention'), 2000); // Move to next phase
            }
        }, 1500);
    }
}


/* ===================== PHASE 3: ATTENTION ===================== */
const attSequence = ['F','B','A','C','M','N','A','A','J','K','L','B','A','F','A','K','D','E','A','A','A','J','A','M','O','F','A','A','B'];
let attInterval;
let attIndex = 0;
let attCurrentTarget = '';

function startAttention() {
    switchScreen('screen-attention');
    const letterDisplay = document.getElementById('att-letter');
    const targetBtn = document.getElementById('target-btn');
    
    attIndex = 0;
    scores.attentionHits = 0;
    scores.attentionFalseAlarms = 0;

    targetBtn.onclick = () => {
        if (attCurrentTarget === 'A') {
            scores.attentionHits++;
            attCurrentTarget = ''; 
            targetBtn.style.backgroundColor = "var(--success)";
            targetBtn.style.color = "white";
            setTimeout(() => {
                targetBtn.style.backgroundColor = "var(--warning)";
                targetBtn.style.color = "black";
            }, 150);
        } else if (attCurrentTarget !== '' && attCurrentTarget !== '-') {
            scores.attentionFalseAlarms++;
            targetBtn.style.backgroundColor = "var(--danger)";
            targetBtn.style.color = "white";
            setTimeout(() => {
                targetBtn.style.backgroundColor = "var(--warning)";
                targetBtn.style.color = "black";
            }, 150);
        }
    };

    attInterval = setInterval(() => {
        if (attIndex >= attSequence.length) {
            clearInterval(attInterval);
            startPhase('naming');
            return;
        }
        
        attCurrentTarget = attSequence[attIndex];
        letterDisplay.innerText = attCurrentTarget;
        attIndex++;
        
        setTimeout(() => { letterDisplay.innerText = ''; }, 750);
    }, 1000);
}


/* ===================== PHASE 4: NAMING ===================== */
let namingIndex = 0;

function startNaming() {
    switchScreen('screen-naming');
    namingIndex = 0;
    scores.naming = 0;
    loadNamingItem();
    
    document.getElementById('naming-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') submitNaming();
    });
}

function loadNamingItem() {
    // Pull from the randomized target list generated at the start
    document.getElementById('naming-emoji').innerText = currentNamingTargets[namingIndex].emoji;
    document.getElementById('naming-progress').innerText = namingIndex + 1;
    const input = document.getElementById('naming-input');
    input.value = '';
    setTimeout(() => input.focus(), 100);
}

function submitNaming() {
    const inputVal = document.getElementById('naming-input').value.trim().toLowerCase();
    
    // Check against the valid answers for the current randomized animal
    if (currentNamingTargets[namingIndex].valid.includes(inputVal)) {
        scores.naming++;
    }
    namingIndex++;
    if (namingIndex < currentNamingTargets.length) {
        loadNamingItem();
    } else {
        startPhase('abstraction');
    }
}


/* ===================== PHASE 5: ABSTRACTION ===================== */
function startAbstraction() {
    switchScreen('screen-abstraction');
    // Note: The HTML and answers were already injected by initializeRandomTest()
}

function submitAbstraction(points) {
    scores.abstraction = points;
    startPhase('recall');
}


/* ===================== PHASE 6: DELAYED RECALL ===================== */
function startRecall() {
    switchScreen('screen-recall');
    setTimeout(() => document.getElementById('recall-0').focus(), 100);
}

function finishAssessment() {
    let userWords = [];
    for (let i = 0; i < 5; i++) {
        let val = document.getElementById(`recall-${i}`).value.trim().toLowerCase();
        if (val !== "") userWords.push(val);
    }
    
    let matchedWords = [];
    scores.recall = 0;
    
    userWords.forEach(word => {
        // Check against the 5 dynamically chosen words for this round
        if (targetWords.includes(word) && !matchedWords.includes(word)) {
            scores.recall++;
            matchedWords.push(word);
        }
    });

    startPhase('results');
}


/* ===================== RESULTS ===================== */
function showResults() {
    switchScreen('screen-results');
    
    document.getElementById('res-recall').innerText = `${scores.recall} / 5`;
    document.getElementById('res-visual').innerText = `Level ${scores.visualLevel}`;
    document.getElementById('res-att-corr').innerText = `${scores.attentionHits} / ${scores.attentionTotal}`;
    document.getElementById('res-att-false').innerText = `${scores.attentionFalseAlarms}`;
    document.getElementById('res-naming').innerText = `${scores.naming} / 3`;
    document.getElementById('res-abstraction').innerText = `${scores.abstraction} / 1`;

    const faElem = document.getElementById('res-att-false');
    if (scores.attentionFalseAlarms === 0) {
        faElem.style.color = "var(--success)";
    } else if (scores.attentionFalseAlarms > 2) {
        faElem.style.color = "var(--danger)";
    }
}