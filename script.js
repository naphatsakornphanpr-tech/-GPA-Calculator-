/**
 * =========================================================================
 * เครื่องคำนวณเกรดสะสมหลายเทอม (GPA & GPax Calculator) - JavaScript Core Logic
 * พัฒนาโดยคำนึงถึงหลัก Separation of Concerns (แยกส่วนการทำงานอย่างชัดเจน)
 * อธิบายโค้ดทุกบรรทัดอย่างละเอียดเป็นภาษาไทย เพื่อเตรียมตัวสำหรับการถาม-ตอบในคาบเรียน
 * =========================================================================
 */

// เกรดและค่าคะแนนประจำเกรด (Grade to Numeric Point Map)
// ใช้สำหรับแปลงเกรดที่เป็นตัวอักษรให้เป็นตัวเลขในการคำนวณ GPA / GPax
const GRADE_POINTS = {
    'A': 4.0,
    'B+': 3.5,
    'B': 3.0,
    'C+': 2.5,
    'C': 2.0,
    'D+': 1.5,
    'D': 1.0,
    'F': 0.0
};

// รายวิชาเริ่มต้นสำหรับสาขาวิศวกรรมคอมพิวเตอร์ (Default Computer Engineering Courses)
// ใช้สำหรับสร้างเป็นเทอมตัวอย่างแรกเมื่อผู้ใช้งานเข้าเว็บครั้งแรก
const DEFAULT_CPE_COURSES = [
    { name: 'CPE101 Computer Programming', credits: '3.0', grade: '' },
    { name: 'CPE102 Digital Logic Design', credits: '3.0', grade: '' },
    { name: 'MTH101 Calculus I', credits: '3.0', grade: '' },
    { name: 'PHY101 Physics for Engineers', credits: '3.0', grade: '' }
];

// ค้นหา DOM Elements หลักจาก HTML
const semestersContainer = document.getElementById('semesters-container');
const addSemesterBtn = document.getElementById('add-semester-btn');
const resetBtn = document.getElementById('reset-btn');
const gpaxDashboard = document.getElementById('gpax-dashboard');
const gpaxDisplay = document.getElementById('gpax-display');
const totalCoursesDisplay = document.getElementById('total-courses-display');
const totalCreditsDisplay = document.getElementById('total-credits-display');
const overallStatusBadge = document.getElementById('overall-status-badge');
const emptyState = document.getElementById('empty-state');

// ฟังก์ชันเริ่มต้น (Initial Function) - ทำงานเมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    // โหลดข้อมูลเทอมเรียนจาก LocalStorage
    initApp();
    
    // ผูกเหตุการณ์คลิกปุ่มควบคุมระดับบนสุด (ห้ามใช้ onclick ใน HTML)
    addSemesterBtn.addEventListener('click', () => {
        // นับจำนวนการ์ดเทอมปัจจุบันเพื่อตั้งชื่อเทอมใหม่โดยอัตโนมัติ
        const semesterCount = semestersContainer.querySelectorAll('.semester-card').length;
        const newTitle = `ภาคเรียนที่ ${semesterCount + 1}`;
        
        // สร้างการ์ดเทอมใหม่พร้อมใส่ 3 แถววิชาเปล่าเริ่มต้น
        const newCard = addSemesterCard(newTitle, [
            { name: '', credits: '3.0', grade: '' },
            { name: '', credits: '3.0', grade: '' },
            { name: '', credits: '3.0', grade: '' }
        ]);
        
        // เลื่อนหน้าจอลงไปยังเทอมที่เพิ่มเข้ามาใหม่ให้สวยงาม
        newCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
        
        calculateAll();
        saveToLocalStorage();
    });
    
    // ปุ่มรีเซ็ตข้อมูลทั้งหมด
    resetBtn.addEventListener('click', resetAll);
});

/**
 * ฟังก์ชันเริ่มต้นดาวน์โหลดข้อมูลและทำการย้ายข้อมูล (Data Migration & Initialization)
 */
function initApp() {
    const savedSemesters = localStorage.getItem('gpa_calculator_semesters');
    const oldSingleTermCourses = localStorage.getItem('gpa_calculator_courses');
    
    if (savedSemesters) {
        // กรณีมีข้อมูลเทอมการศึกษาหลายเทอมเซฟอยู่
        const semestersData = JSON.parse(savedSemesters);
        if (semestersData.length > 0) {
            semestersData.forEach(sem => {
                addSemesterCard(sem.title, sem.courses);
            });
        } else {
            showEmptyState(true);
        }
    } else if (oldSingleTermCourses) {
        // ส่วนการย้ายข้อมูล (Data Migration): หากมีข้อมูลเก่าวางอยู่จากเวอร์ชันก่อนหน้า
        // นำมาปรับรูปแบบเป็นโครงสร้างหลายเทอมโดยใช้อันเก่าเป็นเทอมแรก
        const oldCourses = JSON.parse(oldSingleTermCourses);
        addSemesterCard('ภาคเรียนที่ 1 (นำเข้าจากข้อมูลเก่า)', oldCourses);
        
        // ลบแคชรุ่นเก่าออกเพื่อป้องกันการวนซ้ำ
        localStorage.removeItem('gpa_calculator_courses');
        saveToLocalStorage();
    } else {
        // ถ้าเป็นการเข้าชมครั้งแรก ไม่มีข้อมูลเซฟเลย ให้สร้างเทอมเริ่มต้น (เทอม 1) พร้อมวิชา CPE
        addSemesterCard('ภาคเรียนที่ 1/2568', DEFAULT_CPE_COURSES);
        saveToLocalStorage();
    }
    
    calculateAll();
}

/**
 * ฟังก์ชันสร้างการ์ดเทอมการศึกษาใหม่ (Semester Card Creator)
 * @param {string} title - ชื่อเทอมการศึกษา
 * @param {Array} courses - อาร์เรย์ของออบเจกต์รายวิชา
 * @returns {HTMLElement} - คืนค่า HTML element ของการ์ดที่สร้าง
 */
function addSemesterCard(title = 'ภาคเรียนใหม่', courses = []) {
    showEmptyState(false);
    
    // สร้าง DIV การ์ดเทอม
    const card = document.createElement('section');
    card.className = 'semester-card';
    
    // กำหนดโครงสร้างภายในการ์ดด้วย Template Literal ตามกติกา Separation of Concerns
    card.innerHTML = `
        <div class="semester-header">
            <!-- ฟิลด์พิมพ์ชื่อเทอม ปรับแก้ง่ายๆ ได้เลย -->
            <input type="text" class="semester-title-input" value="${escapeHtml(title)}" title="คลิกเพื่อแก้ไขชื่อภาคเรียน">
            <!-- ปุ่มลบเทอมการศึกษานี้ออกทั้งหมด -->
            <button type="button" class="btn-delete-semester" title="ลบเทอมการศึกษานี้">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
        
        <!-- หัวแถวคอลัมน์วิชาภายในเทอม -->
        <div class="row-header">
            <span class="header-col col-name">ชื่อวิชา (ไม่บังคับ)</span>
            <span class="header-col col-credits">หน่วยกิต</span>
            <span class="header-col col-grade">เกรด</span>
            <span class="header-col col-action">จัดการ</span>
        </div>
        
        <!-- กล่องเก็บรายวิชาในเทอม -->
        <div class="course-list"></div>
        
        <!-- ปุ่มเพิ่มรายวิชาเฉพาะเทอมนี้ -->
        <button type="button" class="btn-add-course">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            เพิ่มวิชาเรียน
        </button>
        
        <!-- ส่วนสรุปท้ายเทอมของใบเกรดนี้ -->
        <div class="semester-footer">
            <div class="term-stat">หน่วยกิตเทอมนี้: <span class="term-credits-val">0.0</span></div>
            <div class="term-gpa-badge">GPA เทอมนี้: <span class="term-gpa-val">0.00</span></div>
        </div>
    `;
    
    // แทรกการ์ดเทอมเข้าไปในคอนเทนเนอร์ใหญ่บนเว็บ
    semestersContainer.appendChild(card);
    
    const courseList = card.querySelector('.course-list');
    const addCourseBtn = card.querySelector('.btn-add-course');
    const deleteSemesterBtn = card.querySelector('.btn-delete-semester');
    const titleInput = card.querySelector('.semester-title-input');
    
    // สร้างวิชาในเทอมนี้ตามที่ส่งมาในพารามิเตอร์
    if (courses.length > 0) {
        courses.forEach(c => addCourseRowToSemester(card, c.name, c.credits, c.grade));
    } else {
        // หากไม่มีข้อมูลวิชาเลย ให้สร้าง 3 แถวเปล่าไว้ก่อน
        for (let i = 0; i < 3; i++) {
            addCourseRowToSemester(card);
        }
    }
    
    // ดักฟังเหตุการณ์กรอกชื่อเทอมการศึกษา ให้เซฟลงฐานข้อมูลแบบเรียลไทม์
    titleInput.addEventListener('input', () => {
        saveToLocalStorage();
    });
    
    // ดักฟังเหตุการณ์การกดเพิ่มวิชาใหม่เฉพาะเทอมนี้
    addCourseBtn.addEventListener('click', () => {
        addCourseRowToSemester(card);
        calculateAll();
        saveToLocalStorage();
    });
    
    // ลบเทอมการศึกษานี้
    deleteSemesterBtn.addEventListener('click', () => {
        if (confirm(`คุณต้องการลบ "${titleInput.value}" และวิชาเรียนทั้งหมดในเทอมนี้ใช่หรือไม่?`)) {
            card.style.animation = 'popIn 0.25s ease-in reverse'; // รันภาพค่อยๆ ย่อหายไป
            setTimeout(() => {
                card.remove(); // ลบการ์ดเทอมออกจากเว็บ
                calculateAll();
                saveToLocalStorage();
            }, 230);
        }
    });
    
    return card;
}

/**
 * ฟังก์ชันสร้างและผูกเหตุการณ์แถวรายวิชาเฉพาะเทอมเรียน
 * @param {HTMLElement} semesterCard - การ์ดเทอมที่วิชานี้สังกัดอยู่
 * @param {string} name - ชื่อรายวิชา
 * @param {string|number} credits - หน่วยกิต
 * @param {string} grade - เกรด
 */
function addCourseRowToSemester(semesterCard, name = '', credits = '3.0', grade = '') {
    const courseList = semesterCard.querySelector('.course-list');
    const row = document.createElement('div');
    row.className = 'course-row';
    
    // ใส่ HTML แถวผ่าน Template Literal เพื่อหลีกเลี่ยง Inline Event ใน HTML ตามกติกา
    row.innerHTML = `
        <div class="input-group">
            <span class="mobile-label">ชื่อวิชา (ไม่บังคับ)</span>
            <input type="text" class="input-field course-name" placeholder="เช่น CPE102, Math" value="${escapeHtml(name)}">
        </div>
        <div class="input-group">
            <span class="mobile-label">หน่วยกิต</span>
            <select class="input-field course-credits">
                <option value="0.5" ${credits === '0.5' ? 'selected' : ''}>0.5</option>
                <option value="1.0" ${credits === '1.0' ? 'selected' : ''}>1.0</option>
                <option value="1.5" ${credits === '1.5' ? 'selected' : ''}>1.5</option>
                <option value="2.0" ${credits === '2.0' ? 'selected' : ''}>2.0</option>
                <option value="2.5" ${credits === '2.5' ? 'selected' : ''}>2.5</option>
                <option value="3.0" ${credits === '3.0' ? 'selected' : ''}>3.0</option>
                <option value="4.0" ${credits === '4.0' ? 'selected' : ''}>4.0</option>
            </select>
        </div>
        <div class="input-group">
            <span class="mobile-label">เกรดที่ได้</span>
            <select class="input-field course-grade">
                <option value="" ${grade === '' ? 'selected' : ''}>-- เลือกเกรด --</option>
                <option value="A" ${grade === 'A' ? 'selected' : ''}>A</option>
                <option value="B+" ${grade === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B" ${grade === 'B' ? 'selected' : ''}>B</option>
                <option value="C+" ${grade === 'C+' ? 'selected' : ''}>C+</option>
                <option value="C" ${grade === 'C' ? 'selected' : ''}>C</option>
                <option value="D+" ${grade === 'D+' ? 'selected' : ''}>D+</option>
                <option value="D" ${grade === 'D' ? 'selected' : ''}>D</option>
                <option value="F" ${grade === 'F' ? 'selected' : ''}>F</option>
            </select>
        </div>
        <button type="button" class="btn-delete" title="ลบวิชานี้">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;
    
    courseList.appendChild(row);
    
    const deleteBtn = row.querySelector('.btn-delete');
    const inputs = row.querySelectorAll('.input-field');
    
    // ลบรายวิชานี้ออก
    deleteBtn.addEventListener('click', () => {
        row.style.animation = 'slideIn 0.2s ease-out reverse';
        setTimeout(() => {
            row.remove();
            calculateAll();
            saveToLocalStorage();
        }, 180);
    });
    
    // คำนวณใหม่และจัดเก็บสถานะความเปลี่ยนแปลงแบบเรียลไทม์
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            calculateAll();
            saveToLocalStorage();
        });
        input.addEventListener('input', () => {
            saveToLocalStorage(); // จัดเก็บเฉพาะชื่อวิชาตอนกำลังพิมพ์ ไม่จำเป็นต้องรีโหลดคำนวณใหม่ในทุกอักขระ
        });
    });
}

/**
 * ฟังก์ชันประมวลคำนวณเกรดหลักทั้งหมด (Master GPA & GPax Calculation)
 * วนรอบตรวจสอบเพื่อคำนวณค่าเฉพาะเทอมรายใบ และรวบรวมเข้าสรุปเป็นภาพรวมของเกรดสะสม (GPax) ทั้งหมด
 */
function calculateAll() {
    const semesterCards = semestersContainer.querySelectorAll('.semester-card');
    
    // หากไม่มีการ์ดภาคเรียนเหลืออยู่ในคอนเทนเนอร์เลย
    if (semesterCards.length === 0) {
        showEmptyState(true);
        gpaxDashboard.classList.add('hidden');
        return;
    }
    
    showEmptyState(false);
    
    let grandTotalPoints = 0;      // คะแนนคูณหน่วยกิตสะสมทุกเทอม
    let grandTotalCredits = 0;     // หน่วยกิตสะสมทุกเทอม
    let grandTotalCourses = 0;     // จำนวนวิชากรอกเกรดจริงสะสมรวมทุกเทอม
    
    // วนลูปประมวลผลคำนวณแยกทีละการ์ดเทอมการศึกษา
    semesterCards.forEach(card => {
        const courseRows = card.querySelectorAll('.course-row');
        
        let termTotalPoints = 0;      // คะแนนคูณหน่วยกิตเฉพาะเทอมนี้
        let termTotalCredits = 0;     // หน่วยกิตเฉพาะเทอมนี้
        let termValidCourses = 0;     // จำนวนวิชาที่กรอกเกรดเฉพาะเทอมนี้
        
        // วนเช็ครวมรายวิชาในการ์ดเทอมนี้
        courseRows.forEach(row => {
            const creditsVal = parseFloat(row.querySelector('.course-credits').value);
            const gradeVal = row.querySelector('.course-grade').value;
            
            // เช็คว่ามีเกรดถูกกรอกเลือกไว้แล้ว
            if (gradeVal !== '') {
                const pointVal = GRADE_POINTS[gradeVal];
                termTotalPoints += (creditsVal * pointVal);
                termTotalCredits += creditsVal;
                termValidCourses++;
                
                // บวกสะสมเข้ากับเกรดรวมสะสมทุกเทอม (GPax)
                grandTotalPoints += (creditsVal * pointVal);
                grandTotalCredits += creditsVal;
                grandTotalCourses++;
            }
        });
        
        // คำนวณ GPA เฉพาะเทอมเรียนและอัปเดตลงท้ายการ์ด
        const termCreditsSpan = card.querySelector('.term-credits-val');
        const termGpaSpan = card.querySelector('.term-gpa-val');
        
        if (termValidCourses > 0 && termTotalCredits > 0) {
            const termGPA = (termTotalPoints / termTotalCredits).toFixed(2);
            termCreditsSpan.textContent = termTotalCredits.toFixed(1);
            termGpaSpan.textContent = termGPA;
        } else {
            termCreditsSpan.textContent = '0.0';
            termGpaSpan.textContent = '0.00';
        }
    });
    
    // อัปเดตข้อมูลรวมสะสมของแดชบอร์ดสรุปผลบนสุด (GPax)
    if (grandTotalCourses > 0 && grandTotalCredits > 0) {
        const gpax = (grandTotalPoints / grandTotalCredits).toFixed(2);
        
        gpaxDisplay.textContent = gpax;
        totalCoursesDisplay.textContent = `${grandTotalCourses} วิชา`;
        totalCreditsDisplay.textContent = `${grandTotalCredits.toFixed(1)} หน่วยกิต`;
        
        // แสดงตราสัญลักษณ์ความพรีเมียมของผลรวมการเรียน
        renderOverallStatusBadge(parseFloat(gpax));
        gpaxDashboard.classList.remove('hidden');
    } else {
        // กรณีไม่มีข้อมูลวิชาที่ระบุเกรดเลย
        gpaxDisplay.textContent = '0.00';
        totalCoursesDisplay.textContent = '0 วิชา';
        totalCreditsDisplay.textContent = '0.0 หน่วยกิต';
        overallStatusBadge.innerHTML = `<span class="status-badge">รอข้อมูลเพื่อประมวลเกรดสะสม</span>`;
        gpaxDashboard.classList.remove('hidden');
    }
}

/**
 * สร้าง Badge แสดงผลรวมประเมินระดับเกรดสะสม (GPax Rating Badge)
 * @param {number} gpax - เกรดสะสมรวม
 */
function renderOverallStatusBadge(gpax) {
    let text = '';
    let className = '';
    
    if (gpax >= 3.60) {
        text = '🏆 ผลการเรียนดีเยี่ยม (เกียรตินิยมอันดับ 1)';
        className = 'status-excellent';
    } else if (gpax >= 3.25) {
        text = '🥈 ผลการเรียนดีมาก (เกียรตินิยมอันดับ 2)';
        className = 'status-good';
    } else if (gpax >= 2.00) {
        text = '🟢 ผลการเรียนอยู่ในเกณฑ์มาตรฐาน';
        className = 'status-average';
    } else {
        text = '⚠️ ควรปรับปรุงผลการเรียนด่วน';
        className = 'status-poor';
    }
    
    overallStatusBadge.innerHTML = `<span class="status-badge ${className}">${text}</span>`;
}

/**
 * จัดเก็บข้อมูลของทุกเทอมพร้อมรายวิชาลง LocalStorage ในรูปแบบโครงสร้าง JSON Array
 */
function saveToLocalStorage() {
    const cards = semestersContainer.querySelectorAll('.semester-card');
    const semestersData = [];
    
    cards.forEach(card => {
        const titleVal = card.querySelector('.semester-title-input').value;
        const rows = card.querySelectorAll('.course-row');
        const courses = [];
        
        rows.forEach(row => {
            courses.push({
                name: row.querySelector('.course-name').value,
                credits: row.querySelector('.course-credits').value,
                grade: row.querySelector('.course-grade').value
            });
        });
        
        semestersData.push({
            title: titleVal,
            courses: courses
        });
    });
    
    localStorage.setItem('gpa_calculator_semesters', JSON.stringify(semestersData));
}

/**
 * แสดง/ซ่อนหน้าต่างกรณีว่างไม่มีข้อมูลภาคเรียน
 * @param {boolean} show - ส่งค่า true เพื่อแสดงหน้าว่างเปล่า
 */
function showEmptyState(show) {
    if (show) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

/**
 * ล้างระบบแอปเพื่อตั้งค่าระบบเริ่มต้นใหม่หมด (Reset Multi-Semester System)
 */
function resetAll() {
    if (confirm('คุณต้องการล้างข้อมูลเกรดทุกภาคเรียนเรียน และเริ่มนับใหม่ทั้งหมดใช่หรือไม่?')) {
        semestersContainer.innerHTML = '';
        
        // ล้างความจำในบราวเซอร์ทั้งหมดของโปรเจกต์นี้
        localStorage.removeItem('gpa_calculator_semesters');
        localStorage.removeItem('gpa_calculator_courses');
        
        // โหลดหน้าจอเซ็ตตั้งต้นใหม่หมดจด
        addSemesterCard('ภาคเรียนที่ 1/2568', DEFAULT_CPE_COURSES);
        saveToLocalStorage();
        calculateAll();
    }
}

/**
 * ฟังก์ชันความปลอดภัย (Security Helper) - ป้องกันการโจมตีประเภท XSS
 * @param {string} string - ข้อความดิบจากกล่องพิมพ์ข้อมูล
 */
function escapeHtml(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return string.replace(/[&<>"']/g, function(m) { return map[m]; });
}
