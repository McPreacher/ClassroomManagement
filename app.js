const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyknJGe8oo-BScGP70kEeN9vIfu_34nmclmgeiFPGWXoTlELKuzjh_Ue6fSFhvheSEf/exec";

// Load local data as a fallback while the cloud loads
let students = JSON.parse(localStorage.getItem('classroomData')) || { "8th Grade": [] };
let currentClass = localStorage.getItem('lastSelectedClass') || Object.keys(students)[0];

const classSelector = document.getElementById('classSelector');

/**
 * Initialize the App
 */
async function init() {
    updateClassDropdown();
    renderStudents();
    
    // Pull the latest data from Google Sheets on startup
    await pullFromCloud();
}

/**
 * Cloud Sync Functions
 */
async function saveToCloud() {
    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            mode: "no-cors", // Required for Google Apps Script
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(students)
        });
        console.log("Data synced to Google Sheets");
    } catch (error) {
        console.error("Cloud save failed:", error);
    }
}

async function pullFromCloud() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const cloudData = await response.json();
        
        if (cloudData && Object.keys(cloudData).length > 0) {
            students = cloudData;
            // Update local storage so it's available offline next time
            localStorage.setItem('classroomData', JSON.stringify(students));
            updateClassDropdown();
            renderStudents();
            console.log("Data pulled from Google Sheets");
        }
    } catch (error) {
        console.error("Cloud pull failed:", error);
    }
}

/**
 * Dynamic Class Management
 */
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

function manageClasses() {
    const newClassName = prompt("Enter the name of the new class (e.g., 10th Grade):");
    if (newClassName && !students[newClassName]) {
        students[newClassName] = [];
        currentClass = newClassName;
        updateClassDropdown();
        saveAndRender();
    } else if (students[newClassName]) {
        alert("That class already exists!");
    }
}

function deleteCurrentClass() {
    if (Object.keys(students).length <= 1) {
        alert("You must have at least one class.");
        return;
    }
    if (confirm(`Are you sure you want to delete the ENTIRE ${currentClass} class?`)) {
        delete students[currentClass];
        currentClass = Object.keys(students)[0];
        updateClassDropdown();
        saveAndRender();
    }
}

/**
 * Student Management Logic
 */
function addStudent() {
    const input = document.getElementById('studentName');
    const name = input.value.trim();
    if (!name) return;

    if (students[currentClass].some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert("Student already exists!");
        return;
    }

    students[currentClass].push({ 
        name: name, 
        dots: 0, 
        warn: false 
    });
    
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
    if (confirm(`Clear all dots and warnings for ${currentClass}?`)) {
        students[currentClass].forEach(s => {
            s.dots = 0;
            s.warn = false;
        });
        saveAndRender();
    }
}

/**
 * Persistence & UI Rendering
 */
function saveAndRender() {
    // Save locally first for instant speed
    localStorage.setItem('classroomData', JSON.stringify(students));
    localStorage.setItem('lastSelectedClass', currentClass);
    renderStudents();
    
    // Save to Google Sheets in the background
    saveToCloud();
}

function renderStudents() {
    const container = document.getElementById('studentList');
    container.innerHTML = "";
    if (!students[currentClass]) return;

    const sortedList = [...students[currentClass]].sort((a, b) => a.name.localeCompare(b.name));

    sortedList.forEach((student) => {
        const card = document.createElement('div');
        
        let statusClass = '';
        if (student.dots > 0) {
            statusClass = 'danger'; 
        } else if (student.warn) {
            statusClass = 'warning'; 
        }

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

// Start the application
init();