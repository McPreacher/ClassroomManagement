// Load data or set defaults
let students = JSON.parse(localStorage.getItem('classroomData')) || { "8th Grade": [] };
let currentClass = localStorage.getItem('lastSelectedClass') || Object.keys(students)[0];

const classSelector = document.getElementById('classSelector');

function init() {
    updateClassDropdown();
    renderStudents();
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

function manageClasses() {
    const newClassName = prompt("Enter the name of the new class:");
    if (newClassName && !students[newClassName]) {
        students[newClassName] = [];
        currentClass = newClassName;
        updateClassDropdown();
        saveAndRender();
    }
}

function deleteCurrentClass() {
    if (Object.keys(students).length <= 1) return alert("You must have at least one class.");
    if (confirm(`Delete the entire ${currentClass} class?`)) {
        delete students[currentClass];
        currentClass = Object.keys(students)[0];
        updateClassDropdown();
        saveAndRender();
    }
}

function addStudent() {
    const input = document.getElementById('studentName');
    const name = input.value.trim();
    if (!name) return;
    
    students[currentClass].push({ name: name, dots: 0 });
    input.value = "";
    saveAndRender();
}

function updateDots(studentName, change) {
    // We find by name now because sorting changes the index position
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
    if (confirm(`Clear all dots for ${currentClass}?`)) {
        students[currentClass].forEach(s => s.dots = 0);
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('classroomData', JSON.stringify(students));
    localStorage.setItem('lastSelectedClass', currentClass);
    renderStudents();
}

function renderStudents() {
    const container = document.getElementById('studentList');
    container.innerHTML = "";
    if (!students[currentClass]) return;

    // SORTING LOGIC: Alphabetical A-Z
    const sortedList = [...students[currentClass]].sort((a, b) => a.name.localeCompare(b.name));

    sortedList.forEach((student) => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h3>${student.name}</h3>
            <div class="dot-display">${student.dots}</div>
            <div class="verse-display">${student.dots * 10} Verses</div>
            <button class="dot-btn" onclick="updateDots('${student.name}', 1)">+ Dot</button>
            <button class="minus-btn" onclick="updateDots('${student.name}', -1)">-</button>
            <br>
            <button class="delete-btn" onclick="deleteStudent('${student.name}')">Remove</button>
        `;
        container.appendChild(card);
    });
}

init();