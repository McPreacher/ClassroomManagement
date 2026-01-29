const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyknJGe8oo-BScGP70kEeN9vIfu_34nmclmgeiFPGWXoTlELKuzjh_Ue6fSFhvheSEf/exec";

let students = JSON.parse(localStorage.getItem('classroomData')) || { "8th Grade": [] };
let currentClass = localStorage.getItem('lastSelectedClass') || Object.keys(students)[0];

const classSelector = document.getElementById('classSelector');

async function init() {
    updateClassDropdown();
    renderStudents();
    await pullFromCloud();
}

async function saveToCloud() {
    try {
        const blob = new Blob([JSON.stringify(students)], { type: 'text/plain' });
        await fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            mode: "no-cors",
            body: blob
        });
        console.log("Cloud sync sent.");
    } catch (error) {
        console.error("Cloud save failed:", error);
    }
}

async function pullFromCloud() {
    try {
        // 'redirect: follow' is required because Google Scripts uses redirects
        const response = await fetch(GOOGLE_SHEET_URL, { redirect: "follow" });
        const textData = await response.text();
        
        // SAFETY GATE: If not a valid JSON string, ignore it
        if (!textData || !textData.trim().startsWith("{")) {
            console.warn("Invalid cloud data received. Keeping local.");
            return;
        }

        const cloudData = JSON.parse(textData);
        if (cloudData && Object.keys(cloudData).length > 0) {
            students = { ...students, ...cloudData };
            localStorage.setItem('classroomData', JSON.stringify(students));
            updateClassDropdown();
            renderStudents();
            console.log("Sync successful.");
        }
    } catch (error) {
        console.error("Cloud pull blocked:", error);
    }
}

function updateClassDropdown() {
    classSelector.innerHTML = "";
    Object.keys(students).sort().forEach(className => {
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
    const newClassName = prompt("New class name:");
    if (newClassName && !students[newClassName]) {
        await pullFromCloud();
        students[newClassName] = [];
        currentClass = newClassName;
        updateClassDropdown();
        saveAndRender();
    }
}

function deleteCurrentClass() {
    if (Object.keys(students).length <= 1) return;
    if (confirm(`Delete ${currentClass}?`)) {
        delete students[currentClass];
        currentClass = Object.keys(students)[0];
        updateClassDropdown();
        saveAndRender();
    }
}

function addStudent() {
    const input = document.getElementById('studentName');
    const name = input.value.trim();
    if (!name || students[currentClass].some(s => s.name.toLowerCase() === name.toLowerCase())) return;
    students[currentClass].push({ name, dots: 0, warn: false });
    input.value = "";
    saveAndRender();
}

function toggleWarning(studentName) {
    const student = students[currentClass].find(s => s.name === studentName);
    if (student) {
        student.warn = !student.warn;
        saveAndRender();
    }
}

function updateDots(studentName, change) {
    const student = students[currentClass].find(s => s.name === studentName);
    if (student) {
        student.dots = Math.max(0, student.dots + change);
        saveAndRender();
    }
}

function deleteStudent(studentName) {
    if (confirm(`Remove ${studentName}?`)) {
        students[currentClass] = students[currentClass].filter(s => s.name !== studentName);
        saveAndRender();
    }
}

function resetDots() {
    if (confirm(`Reset all?`)) {
        students[currentClass].forEach(s => { s.dots = 0; s.warn = false; });
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('classroomData', JSON.stringify(students));
    localStorage.setItem('lastSelectedClass', currentClass);
    renderStudents();
    saveToCloud();
}

function renderStudents() {
    const container = document.getElementById('studentList');
    container.innerHTML = "";
    if (!students[currentClass]) return;
    const sortedList = [...students[currentClass]].sort((a, b) => a.name.localeCompare(b.name));
    sortedList.forEach((student) => {
        const card = document.createElement('div');
        let statusClass = student.dots > 0 ? 'danger' : (student.warn ? 'warning' : '');
        card.className = `student-card ${statusClass}`;
        card.innerHTML = `
            <h3>${student.name}</h3>
            <button class="warn-btn" onclick="toggleWarning('${student.name}')">
                ${student.warn ? '⚠️ Warned' : 'Give Warning'}
            </button>
            <div class="dot-display">${student.dots}</div>
            <div class="verse-display">${student.dots * 10} Verses</div>
            <div class="card-controls">
                <button class="dot-btn" onclick="updateDots('${student.name}', 1)">+ Dot</button>
                <button class="minus-btn" onclick="updateDots('${student.name}', -1)">-</button>
            </div>
            <button class="delete-btn" onclick="deleteStudent('${student.name}')">Remove Student</button>
        `;
        container.appendChild(card);
    });
}

init();