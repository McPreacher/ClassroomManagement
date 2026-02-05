const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyM4uGNoxF4TrEteA_UE_7qQfn0zJ0AjKXPt5mDLhmi9ZHKhiS0uzW55vQVNt4pnruF/exec";

let students = JSON.parse(localStorage.getItem('classroomData')) || { "8th Grade": [] };
let currentClass = localStorage.getItem('lastSelectedClass') || Object.keys(students)[0];

const classSelector = document.getElementById('classSelector');

async function init() {
    updateClassDropdown();
    renderStudents();
    await pullFromCloud();
}

/** * MATH ENGINE 
 */
function calculateDailyGrade(student) {
    let score = 100;
    score -= (student.behaviorMarks || 0) * 5;
    score -= (student.instructionMarks || 0) * 5;
    return Math.max(0, score);
}

/**
 * ACTIONS
 */
function addStudent() {
    const input = document.getElementById('studentName');
    const name = input.value.trim();
    if (!name || students[currentClass].some(s => s.name.toLowerCase() === name.toLowerCase())) return;

    students[currentClass].push({ 
        name, 
        warn: false, 
        behaviorMarks: 0, 
        instructionMarks: 0,
        weeklyBehavior: 0,
        weeklyInstruction: 0,
        daysTracked: 0,
        totalScore: 0
    });
    input.value = "";
    saveAndRender();
}

function updateMark(studentName, type, change) {
    const student = students[currentClass].find(s => s.name === studentName);
    if (student) {
        student[type] = Math.max(0, (student[type] || 0) + change);
        saveAndRender();
    }
}

function toggleWarning(studentName) {
    const student = students[currentClass].find(s => s.name === studentName);
    if (student) {
        student.warn = !student.warn;
        saveAndRender();
    }
}

function resetDots() {
    if (confirm(`End Day for ${currentClass}? Today's grades will be added to the Weekly Total.`)) {
        students[currentClass].forEach(s => {
            const todayGrade = calculateDailyGrade(s);
            s.weeklyBehavior = (s.weeklyBehavior || 0) + (s.behaviorMarks || 0);
            s.weeklyInstruction = (s.weeklyInstruction || 0) + (s.instructionMarks || 0);
            s.totalScore = (s.totalScore || 0) + todayGrade;
            s.daysTracked = (s.daysTracked || 0) + 1;
            s.behaviorMarks = 0;
            s.instructionMarks = 0;
            s.warn = false;
        });
        saveAndRender();
    }
}

function fullWeeklyReset() {
    if (confirm("CLEAR ALL WEEKLY TOTALS? Do this only on Monday mornings.")) {
        students[currentClass].forEach(s => {
            s.weeklyBehavior = 0;
            s.weeklyInstruction = 0;
            s.totalScore = 0;
            s.daysTracked = 0;
        });
        saveAndRender();
    }
}

/**
 * CLOUD SYNC
 */
async function saveToCloud() {
    students.updatedAt = Date.now();
    try {
        const blob = new Blob([JSON.stringify(students)], { type: 'text/plain' });
        await fetch(GOOGLE_SHEET_URL, { method: "POST", mode: "no-cors", body: blob });
    } catch (e) { console.error("Cloud save failed", e); }
}

async function pullFromCloud() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL, { redirect: "follow" });
        const textData = await response.text();
        if (!textData || !textData.trim().startsWith("{")) return;
        const cloudData = JSON.parse(textData);
        if (cloudData.updatedAt && (!students.updatedAt || cloudData.updatedAt > students.updatedAt)) {
            students = cloudData;
            localStorage.setItem('classroomData', JSON.stringify(students));
            updateClassDropdown();
            renderStudents();
        }
    } catch (e) { console.error("Cloud pull failed", e); }
}

/**
 * UI RENDERING
 */
function renderStudents() {
    const container = document.getElementById('studentList');
    container.innerHTML = "";
    if (!students[currentClass]) return;

    const sortedList = [...students[currentClass]].sort((a, b) => a.name.localeCompare(b.name));

    sortedList.forEach((student) => {
        // 1. Calculate Daily Grade for the badge
        const dailyGrade = calculateDailyGrade(student);
        
        // 2. Real-time Weekly Math: Combine saved history + what's currently on screen
        const totalBehaviorForWeek = (student.weeklyBehavior || 0) + (student.behaviorMarks || 0);
        
        // We calculate the average by adding today's "live" score to the saved "totalScore"
        const liveTotalScore = (student.totalScore || 0) + dailyGrade;
        const liveDaysTracked = (student.daysTracked || 0) + 1;
        const weeklyAvg = Math.round(liveTotalScore / liveDaysTracked);
        
        const card = document.createElement('div');
        let status = (student.behaviorMarks > 0 || student.instructionMarks > 0) ? 'danger' : (student.warn ? 'warning' : '');
        
        card.className = `student-card ${status}`;
        card.innerHTML = `
            <div class="card-header">
                <h3>${student.name}</h3>
                <div class="daily-score">${dailyGrade}</div>
            </div>

            <button class="warn-btn ${student.warn ? 'active' : ''}" onclick="toggleWarning('${student.name}')">
                ${student.warn ? '⚠️ Warning Given' : 'Give Warning'}
            </button>

            <div class="mark-section">
                <div class="mark-control">
                    <span class="mark-label">Behavior (Verses)</span>
                    <div class="count">${student.behaviorMarks || 0}</div>
                    <div class="btns">
                        <button onclick="updateMark('${student.name}', 'behaviorMarks', 1)">+</button>
                        <button onclick="updateMark('${student.name}', 'behaviorMarks', -1)">-</button>
                    </div>
                </div>
                <div class="mark-control">
                    <span class="mark-label">Instruction (Focus)</span>
                    <div class="count">${student.instructionMarks || 0}</div>
                    <div class="btns">
                        <button onclick="updateMark('${student.name}', 'instructionMarks', 1)">+</button>
                        <button onclick="updateMark('${student.name}', 'instructionMarks', -1)">-</button>
                    </div>
                </div>
            </div>

            <div class="weekly-summary">
                <span>Week Avg: ${weeklyAvg}%</span> | <span>Verses Due: ${totalBehaviorForWeek * 10}</span>
            </div>
            
            <button class="delete-btn" onclick="deleteStudent('${student.name}')">Remove</button>
        `;
        container.appendChild(card);
    });
}

function updateClassDropdown() {
    classSelector.innerHTML = "";
    Object.keys(students).filter(key => key !== 'updatedAt').sort().forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        if (className === currentClass) option.selected = true;
        classSelector.appendChild(option);
    });
}

classSelector.addEventListener('change', (e) => {
    currentClass = e.target.value;
    localStorage.setItem('lastSelectedClass', currentClass);
    renderStudents();
});

async function manageClasses() {
    const newName = prompt("New class name:");
    if (newName && !students[newName]) {
        students[newName] = [];
        currentClass = newName;
        updateClassDropdown();
        saveAndRender();
    }
}

function deleteCurrentClass() {
    if (Object.keys(students).filter(k => k !== 'updatedAt').length <= 1) return;
    if (confirm(`Delete ${currentClass}?`)) {
        delete students[currentClass];
        currentClass = Object.keys(students).filter(k => k !== 'updatedAt')[0];
        updateClassDropdown();
        saveAndRender();
    }
}

function deleteStudent(name) {
    if (confirm(`Remove ${name}?`)) {
        students[currentClass] = students[currentClass].filter(s => s.name !== name);
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('classroomData', JSON.stringify(students));
    localStorage.setItem('lastSelectedClass', currentClass);
    renderStudents();
    saveToCloud();
}

init();