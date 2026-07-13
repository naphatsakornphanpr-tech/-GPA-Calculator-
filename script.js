/**
 * =========================================================================
 * เครื่องคำนวณเกรดเฉลี่ย (GPA Calculator) - JavaScript Core Logic
 * พัฒนาโดยคำนึงถึงหลัก Separation of Concerns (แยกส่วนการทำงานอย่างชัดเจน)
 * อธิบายโค้ดทุกบรรทัดอย่างละเอียดเป็นภาษาไทย เพื่อเตรียมตัวสำหรับการถาม-ตอบในคาบเรียน
 * =========================================================================
 */

// เกรดและค่าคะแนนประจำเกรด (Grade to Numeric Point Map)
// ใช้สำหรับแปลงเกรดที่เป็นตัวอักษรให้เป็นตัวเลขในการคำนวณ GPA
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
// ใช้สำหรับแสดงข้อมูลตัวอย่างทันทีที่เข้าเว็บครั้งแรก
const DEFAULT_CPE_COURSES = [
    { name: 'CPE101 Computer Programming', credits: '3.0', grade: '' },
    { name: 'CPE102 Digital Logic Design', credits: '3.0', grade: '' },
    { name: 'MTH101 Calculus I', credits: '3.0', grade: '' },
    { name: 'PHY101 Physics for Engineers', credits: '3.0', grade: '' }
];


// ค้นหา Element ต่างๆ จาก HTML เพื่อนำมาใช้งานใน JS (DOM Selection)
const courseListContainer = document.getElementById('course-list');
const addCourseBtn = document.getElementById('add-course-btn');
const resetBtn = document.getElementById('reset-btn');
const resultCard = document.getElementById('result-card');
const gpaDisplay = document.getElementById('gpa-display');
const totalCoursesDisplay = document.getElementById('total-courses-display');
const totalCreditsDisplay = document.getElementById('total-credits-display');
const statusBadgeContainer = document.getElementById('status-badge-container');

// ฟังก์ชันเริ่มต้น (Initial Function) - จะทำงานทันทีเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    // โหลดข้อมูลรายวิชาจาก LocalStorage (หากเคยมีบันทึกไว้) หรือถ้าไม่มีให้เพิ่ม 3 แถวเปล่าเป็นค่าเริ่มต้น
    const savedCourses = loadFromLocalStorage();
    
    if (savedCourses && savedCourses.length > 0) {
        // หากมีข้อมูลเดิมที่เซฟไว้ ให้สร้างแถวตามข้อมูลนั้น
        savedCourses.forEach(course => {
            addCourseRow(course.name, course.credits, course.grade);
        });
    } else {
        // หากไม่มีข้อมูล ให้เพิ่มวิชาพื้นฐานของวิศวกรรมคอมพิวเตอร์เป็นค่าเริ่มต้น
        DEFAULT_CPE_COURSES.forEach(course => {
            addCourseRow(course.name, course.credits, course.grade);
        });
    }
    
    // คำนวณ GPA ทันทีหลังจากสร้างแถวเริ่มต้นเสร็จ
    calculateGPA();
    
    // ผูก Event Listener (จับเหตุการณ์คลิก) เข้ากับปุ่มต่าง ๆ ตามมาตรฐานวิชา (ห้ามใช้ onclick ใน HTML)
    addCourseBtn.addEventListener('click', () => {
        addCourseRow();
        calculateGPA(); // คำนวณใหม่ทุกครั้งที่มีการเพิ่มแถว
        saveToLocalStorage(); // บันทึกข้อมูลลงเครื่องผู้ใช้
    });
    
    resetBtn.addEventListener('click', resetAll);
});

/**
 * ฟังก์ชันสร้างและเพิ่มแถวรายวิชาใหม่เข้าไปใน DOM
 * @param {string} name - ชื่อวิชา (ไม่บังคับ)
 * @param {string|number} credits - หน่วยกิตเริ่มต้น (ไม่บังคับ)
 * @param {string} grade - เกรดเริ่มต้น (ไม่บังคับ)
 */
function addCourseRow(name = '', credits = '3.0', grade = '') {
    // สร้าง div element สำหรับเป็นแถวเก็บข้อมูล
    const row = document.createElement('div');
    row.className = 'course-row';
    
    // ใช้ Template Literal ในการสร้างโครงสร้าง HTML ด้านในแถว เพื่อหลีกเลี่ยง Inline Event/Style
    row.innerHTML = `
        <!-- คอลัมน์กรอกชื่อวิชา -->
        <div class="input-group">
            <span class="mobile-label">ชื่อวิชา (ไม่บังคับ)</span>
            <input type="text" class="input-field course-name" placeholder="เช่น ENG101, Math II" value="${escapeHtml(name)}">
        </div>
        
        <!-- คอลัมน์เลือกหน่วยกิต -->
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
        
        <!-- คอลัมน์เลือกเกรดที่ได้ -->
        <div class="input-group">
            <span class="mobile-label">เกรด</span>
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
        
        <!-- ปุ่มสำหรับลบแถววิชานี้ออก -->
        <button type="button" class="btn-delete" title="ลบวิชานี้">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
    `;
    
    // ใส่แถวใหม่ลงไปในคอนเทนเนอร์รายการวิชา
    courseListContainer.appendChild(row);
    
    // ค้นหา Element ย่อยภายในแถวที่สร้างขึ้นใหม่เพื่อผูก Event เพิ่มเติม
    const deleteBtn = row.querySelector('.btn-delete');
    const inputs = row.querySelectorAll('.input-field');
    
    // ผูก Event ให้ปุ่มลบทำงานแบบ Dynamic (เมื่อคลิกจะลบแถวตัวเองออก แล้วคำนวณเกรดใหม่)
    deleteBtn.addEventListener('click', () => {
        row.style.animation = 'slideIn 0.2s ease-out reverse'; // สลับแอนิเมชันให้หายไปสวยๆ
        setTimeout(() => {
            row.remove(); // ลบแถวออกจากหน้าจอจริง
            calculateGPA(); // คำนวณเกรดใหม่
            saveToLocalStorage(); // อัปเดตข้อมูลที่เซฟไว้ในเครื่อง
        }, 180);
    });
    
    // เมื่อมีการเปลี่ยนค่าใน Input หรือ Select ภายในแถวนี้ ให้คำนวณเกรดใหม่และเซฟแบบ Real-time
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            calculateGPA();
            saveToLocalStorage();
        });
        input.addEventListener('input', () => {
            // ดักจับการพิมพ์ชื่อวิชาด้วย เพื่อเซฟข้อมูล
            saveToLocalStorage();
        });
    });
}

/**
 * ฟังก์ชันหลักในการคำนวณเกรดเฉลี่ย (GPA Calculation Logic)
 * สูตรการหาเกรดเฉลี่ยสะสม: GPA = ผลรวมของ (หน่วยกิต x คะแนนเกรด) / ผลรวมหน่วยกิตทั้งหมด
 */
function calculateGPA() {
    // ดึงรายการแถววิชาทั้งหมดที่อยู่ในหน้าจอในขณะนั้น
    const rows = courseListContainer.querySelectorAll('.course-row');
    
    let totalPoints = 0;      // ตัวแปรสะสมผลคูณ (หน่วยกิต * คะแนนเกรด)
    let totalCredits = 0;     // ตัวแปรสะสมหน่วยกิตทั้งหมด
    let validCoursesCount = 0; // ตัวแปรนับจำนวนวิชาที่มีการกรอกเกรดถูกต้องสมบูรณ์
    
    // วนลูปผ่านทุกๆ แถววิชาเพื่อรวบรวมค่ามาคำนวณ
    rows.forEach(row => {
        const creditsSelect = row.querySelector('.course-credits');
        const gradeSelect = row.querySelector('.course-grade');
        
        const credits = parseFloat(creditsSelect.value); // แปลงหน่วยกิตจาก string เป็นทศนิยม
        const gradeValue = gradeSelect.value;            // รับค่าเกรดที่เลือก (เช่น "A", "B+", "")
        
        // ตรวจสอบเงื่อนไข: ต้องมีการเลือกเกรดแล้วเท่านั้น (ไม่ใช่ค่าว่าง) ถึงจะนำมาคำนวณ
        if (gradeValue !== '') {
            const gradePoint = GRADE_POINTS[gradeValue]; // แปลงเกรดเป็นตัวเลขคะแนนสะสม (เช่น A = 4.0)
            totalPoints += (credits * gradePoint);       // (หน่วยกิต x คะแนนเกรด)
            totalCredits += credits;                     // บวกสะสมหน่วยกิต
            validCoursesCount++;                         // นับจำนวนวิชาสะสม
        }
    });
    
    // อัปเดต UI ผลลัพธ์โดยใช้การทำงานร่วมกับ CSS (.hidden) และการแทรกข้อความด้วย Template Literals
    if (validCoursesCount > 0 && totalCredits > 0) {
        // คำนวณเกรดเฉลี่ย ปัดเศษทศนิยมเป็น 2 ตำแหน่ง
        const gpa = (totalPoints / totalCredits).toFixed(2);
        
        // นำค่าที่คำนวณได้ไปแสดงผลบนหน้าเว็บ
        gpaDisplay.textContent = gpa;
        totalCoursesDisplay.textContent = `${validCoursesCount} วิชา`;
        totalCreditsDisplay.textContent = `${totalCredits.toFixed(1)} หน่วยกิต`;
        
        // สร้าง Badge ประเมินผลการเรียนตามช่วงเกรดเฉลี่ยที่ได้
        renderStatusBadge(parseFloat(gpa));
        
        // แสดงการ์ดสรุปผลการเรียน (เอาคลาส hidden ออกเพื่อให้การ์ดผลลัพธ์ปรากฏขึ้น)
        resultCard.classList.remove('hidden');
    } else {
        // หากไม่มีข้อมูลวิชาที่เลือกเกรดเลย ให้ซ่อนการ์ดสรุปผลการเรียนไว้ก่อน
        resultCard.classList.add('hidden');
    }
}

/**
 * ฟังก์ชันสร้างป้ายประเมินผลการเรียน (Dynamic Status Badge Generator)
 * @param {number} gpa - เกรดเฉลี่ยสะสม
 */
function renderStatusBadge(gpa) {
    let text = '';
    let className = '';
    
    // วิเคราะห์ระดับเกรดเฉลี่ยและกำหนดสี CSS ให้ตรงกัน
    if (gpa >= 3.60) {
        text = '🏆 เกียรตินิยมอันดับ 1 / ดีเยี่ยม';
        className = 'status-excellent';
    } else if (gpa >= 3.25) {
        text = '🥈 เกียรตินิยมอันดับ 2 / ดีมาก';
        className = 'status-good';
    } else if (gpa >= 2.00) {
        text = '🟢 ผ่านเกณฑ์ตามมาตรฐาน';
        className = 'status-average';
    } else {
        text = '⚠️ ต่ำกว่าเกณฑ์มาตรฐาน (ควรปรับปรุง)';
        className = 'status-poor';
    }
    
    // แทรก Badge เข้าไปใน HTML ด้วย Template Literal ตามกติกาวิชา
    statusBadgeContainer.innerHTML = `<span class="status-badge ${className}">${text}</span>`;
}

/**
 * ฟังก์ชันล้างข้อมูลวิชาทั้งหมด (Reset App State)
 */
function resetAll() {
    // ยืนยันกับผู้ใช้งานก่อนดำเนินการเพื่อป้องกันการกดพลาด
    if (confirm('คุณต้องการลบวิชาทั้งหมดและเริ่มคำนวณใหม่ใช่หรือไม่?')) {
        // ล้างแถวข้อมูลทั้งหมดในกล่องรายการวิชาออก
        courseListContainer.innerHTML = '';
        
        // ล้างข้อมูลที่เซฟไว้ใน LocalStorage
        localStorage.removeItem('gpa_calculator_courses');
        
        // สร้างแถวรายวิชาวิศวกรรมคอมพิวเตอร์เริ่มต้นขึ้นมาใหม่
        DEFAULT_CPE_COURSES.forEach(course => {
            addCourseRow(course.name, course.credits, course.grade);
        });
        
        // คำนวณและอัปเดตหน้าจอใหม่
        calculateGPA();
    }
}

/**
 * ฟังก์ชันความปลอดภัย (Security Helper) - ป้องกันการโจมตีประเภท XSS
 * ใช้แปลงตัวอักษรพิเศษในการกรอกชื่อวิชา ป้องกันคนนำโค้ดแปลกปลอมมาใส่ใน input
 * @param {string} string - ข้อความดิบจากผู้กรอก
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

/**
 * =========================================================================
 * LOCAL STORAGE STORAGE FUNCTIONS (ฟังก์ชันจัดเก็บข้อมูลบนบราวเซอร์ของผู้ใช้)
 * =========================================================================
 */

// ฟังก์ชันเก็บสถานะปัจจุบันลงฐานข้อมูลภายในเครื่อง (LocalStorage)
function saveToLocalStorage() {
    const rows = courseListContainer.querySelectorAll('.course-row');
    const coursesData = [];
    
    // รวบรวมข้อมูลแต่ละแถวใส่ใน Array
    rows.forEach(row => {
        const nameInput = row.querySelector('.course-name');
        const creditsSelect = row.querySelector('.course-credits');
        const gradeSelect = row.querySelector('.course-grade');
        
        coursesData.push({
            name: nameInput.value,
            credits: creditsSelect.value,
            grade: gradeSelect.value
        });
    });
    
    // แปลงอาร์เรย์ข้อมูลเป็น JSON string แล้วเซฟลงบราวเซอร์
    localStorage.setItem('gpa_calculator_courses', JSON.stringify(coursesData));
}

// ฟังก์ชันโหลดข้อมูลกลับคืนมาจาก LocalStorage เมื่อเข้าเว็บใหม่
function loadFromLocalStorage() {
    const data = localStorage.getItem('gpa_calculator_courses');
    // หากมีข้อมูล ให้แปลงกลับจาก JSON string เป็น Object/Array
    return data ? JSON.parse(data) : null;
}
