// Load data or set defaults
let students = JSON.parse(localStorage.getItem('classroomData')) || { "Default Class": [] };
let currentClass = localStorage.getItem('lastSelectedClass') || Object.keys(students)[0];

const classSelector = document.getElementById('classSelector');

function init() {
    updateClassDropdown();
    renderStudents();
}

function updateClassDropdown() {
    classSelector.innerHTML = "";
    Object.keys(students).forEach(className => {
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
    const newClassName = prompt("Enter the name of the new class (e.g., 9th Grade History):");
    if (newClassName && !students[newClassName]) {
        students[newClassName] = [];
        currentClass = newClassName;
        saveAndRender();
        updateClassDropdown();
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
        saveAndRender();
        updateClassDropdown();
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

function updateDots(index, change) {
    students[currentClass][index].dots = Math.max(0, students[currentClass][index].dots + change);
    saveAndRender();
}

function deleteStudent(index) {
    if (confirm(`Remove ${students[currentClass][index].name}?`)) {
        students[currentClass].splice(index, 1);
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

    students[currentClass].forEach((student, index) => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h3>${student.name}</h3>
            <div class="dot-display">${student.dots} Dots</div>
            <div class="verse-display">${student.dots * 10} Verses to Copy</div>
            <button class="dot-btn" onclick="updateDots(${index}, 1)">+ Add Dot</button>
            <button class="minus-btn" onclick="updateDots(${index}, -1)">-</button>
            <br>
            <button class="delete-btn" onclick="deleteStudent(${index})">Remove Student</button>
        `;
        container.appendChild(card);
    });
}

init();