/* ============================================
   MCSS - Admin Panel Script
   Admin controls for managing data
   ============================================ */

class AdminController {
    constructor() {
        this.students = [];
        this.marks = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderAdminCards();
    }

    async loadData() {
        try {
            const studentsResult = await db.getAllStudents();
            if (studentsResult.success) this.students = studentsResult.data;

            const marksResult = await db.getAllMarks();
            if (marksResult.success) this.marks = marksResult.data;
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }

    setupEventListeners() {
        // Add Student Modal
        document.getElementById('btn-add-student')?.addEventListener('click', () => {
            this.openModal('add-student-modal');
        });

        // Add Marks Modal
        document.getElementById('btn-add-marks')?.addEventListener('click', () => {
            this.openModal('add-marks-modal');
            this.setupMarksForm();
        });

        // Manage Marks Modal
        document.getElementById('btn-manage-marks')?.addEventListener('click', () => {
            this.openModal('manage-marks-modal');
            this.renderMarksTable();
        });

        // Manage Students Modal
        document.getElementById('btn-manage-students')?.addEventListener('click', () => {
            this.openModal('manage-students-modal');
            this.renderStudentsTable();
        });

        // Backup Modal
        document.getElementById('btn-backup')?.addEventListener('click', () => {
            this.openModal('backup-modal');
        });

        // Reset Modal
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.openModal('reset-modal');
        });

        // Export Modal
        document.getElementById('btn-export')?.addEventListener('click', () => {
            this.openModal('export-modal');
        });

        // Close modals
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.classList.remove('active');
            });
        });

        // Add Student Form
        document.getElementById('add-student-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addStudent();
        });

        // Add Marks Form
        document.getElementById('add-marks-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addMarks();
        });

        // Reset confirmation
        document.getElementById('confirm-reset')?.addEventListener('click', async () => {
            await this.resetData();
        });

        // Backup buttons
        document.getElementById('btn-export-json')?.addEventListener('click', () => {
            this.exportToJSON();
        });

        document.getElementById('btn-export-excel')?.addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
            this.exportToPDF();
        });

        // Class select for marks form
        document.getElementById('admin-mark-class')?.addEventListener('change', (e) => {
            this.updateMarksSubjects(e.target.value);
        });
    }

    openModal(modalId) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    renderAdminCards() {
        const grid = document.getElementById('admin-grid');
        if (!grid) return;

        const cards = [
            { id: 'btn-add-student', icon: '👤', title: 'Add Student', desc: 'Register a new student', color: 'gold' },
            { id: 'btn-add-marks', icon: '📝', title: 'Add Marks', desc: 'Enter term test marks', color: 'blue' },
            { id: 'btn-manage-marks', icon: '📊', title: 'Manage Marks', desc: 'Edit or delete marks', color: 'green' },
            { id: 'btn-manage-students', icon: '👥', title: 'Manage Students', desc: 'Edit or remove students', color: 'purple' },
            { id: 'btn-export', icon: '📤', title: 'Export Data', desc: 'Export to PDF or Excel', color: 'gold' },
            { id: 'btn-backup', icon: '💾', title: 'Backup', desc: 'Create data backup', color: 'blue' },
            { id: 'btn-reset', icon: '🗑️', title: 'Reset Data', desc: 'Clear all data', color: 'red' }
        ];

        grid.innerHTML = cards.map(card => `
            <div class="admin-card animate-in" id="${card.id}">
                <div class="admin-card-icon" style="background: linear-gradient(135deg, var(--${card.color === 'gold' ? 'gold' : card.color === 'blue' ? 'blue' : card.color === 'green' ? 'green' : card.color === 'purple' ? 'purple' : 'red'}-light, transparent); color: ${card.color === 'gold' ? '#FFD700' : card.color === 'blue' ? '#3B82F6' : card.color === 'green' ? '#22C55E' : card.color === 'purple' ? '#A855F7' : '#EF4444'};">
                    ${card.icon}
                </div>
                <h3>${card.title}</h3>
                <p>${card.desc}</p>
            </div>
        `).join('');

        // Re-attach listeners after rendering
        this.setupEventListeners();
    }

    async addStudent() {
        const form = document.getElementById('add-student-form');
        const formData = new FormData(form);

        const name = formData.get('name');
        const className = formData.get('class');
        const section = Utils.getSection(className);

        const result = await db.addStudent({ name, class: className, section });

        if (result.success) {
            Toast.show('Student added successfully!', 'success');
            form.reset();
            document.getElementById('add-student-modal')?.classList.remove('active');
            await this.loadData();
        } else {
            Toast.show('Error adding student: ' + result.error, 'error');
        }
    }

    setupMarksForm() {
        const classSelect = document.getElementById('admin-mark-class');
        const studentSelect = document.getElementById('admin-mark-student');

        // Populate student dropdown based on class
        classSelect?.addEventListener('change', (e) => {
            const selectedClass = e.target.value;
            const classStudents = this.students.filter(s => s.class === selectedClass);

            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">Select Student</option>' +
                    classStudents.map(s => `<option value="${s.id}" data-name="${s.name}">${s.name}</option>`).join('');
            }

            this.updateMarksSubjects(selectedClass);
        });
    }

    updateMarksSubjects(className) {
        const subjects = Utils.getSubjects(className);
        const container = document.getElementById('admin-mark-subjects');

        if (container) {
            container.innerHTML = subjects.map((subject, index) => `
                <div class="form-group">
                    <label class="form-label">${subject}</label>
                    <input type="number" class="form-input admin-subject-mark" 
                           name="subject_${index}" placeholder="Enter marks"
                           min="0" max="100" required
                           data-subject="${subject}">
                </div>
            `).join('');
        }
    }

    async addMarks() {
        const form = document.getElementById('add-marks-form');
        const formData = new FormData(form);

        const studentId = formData.get('student');
        const studentSelect = document.getElementById('admin-mark-student');
        const studentName = studentSelect?.options[studentSelect.selectedIndex]?.dataset?.name || '';
        const className = formData.get('class');
        const term = formData.get('term');
        const section = Utils.getSection(className);

        const subjects = {};
        const subjectInputs = form.querySelectorAll('.admin-subject-mark');
        subjectInputs.forEach(input => {
            subjects[input.dataset.subject] = parseFloat(input.value) || 0;
        });

        const result = await db.addMark({
            studentId,
            studentName,
            class: className,
            section,
            term,
            subjects
        });

        if (result.success) {
            Toast.show('Marks added successfully!', 'success');
            form.reset();
            document.getElementById('add-marks-modal')?.classList.remove('active');
            await this.loadData();
        } else {
            Toast.show('Error adding marks: ' + result.error, 'error');
        }
    }

    renderMarksTable() {
        const container = document.getElementById('marks-table-container');
        if (!container) return;

        if (this.marks.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No marks found</h3></div>';
            return;
        }

        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Term</th>
                            <th>Total</th>
                            <th>Z-Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.marks.map(mark => `
                            <tr>
                                <td>${mark.studentName}</td>
                                <td>${mark.class}</td>
                                <td>${mark.term}</td>
                                <td><strong style="color: var(--gold);">${mark.total}</strong></td>
                                <td>${mark.sectionZScore?.toFixed(2) || '-'}</td>
                                <td>
                                    <button class="btn-icon" onclick="adminController.editMark('${mark.id}')" title="Edit">✏️</button>
                                    <button class="btn-icon" onclick="adminController.deleteMark('${mark.id}', '${mark.section}')" title="Delete" style="color: #ef4444;">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderStudentsTable() {
        const container = document.getElementById('students-table-container');
        if (!container) return;

        if (this.students.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><h3>No students found</h3></div>';
            return;
        }

        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.students.map(student => `
                            <tr>
                                <td><strong>${student.name}</strong></td>
                                <td>${student.class}</td>
                                <td>${student.section}</td>
                                <td>
                                    <button class="btn-icon" onclick="adminController.deleteStudent('${student.id}')" title="Delete" style="color: #ef4444;">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async deleteMark(markId, section) {
        if (!confirm('Are you sure you want to delete this mark entry?')) return;

        const result = await db.deleteMark(markId, section);
        if (result.success) {
            Toast.show('Mark deleted successfully', 'success');
            await this.loadData();
            this.renderMarksTable();
        } else {
            Toast.show('Error deleting mark', 'error');
        }
    }

    async deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student? All associated marks will also be deleted.')) return;

        const result = await db.deleteStudent(studentId);
        if (result.success) {
            Toast.show('Student deleted successfully', 'success');
            await this.loadData();
            this.renderStudentsTable();
        } else {
            Toast.show('Error deleting student', 'error');
        }
    }

    async resetData() {
        if (!confirm('WARNING: This will delete ALL data. Are you absolutely sure?')) return;

        try {
            // Delete all marks
            const marksSnapshot = await db.marksCollection.get();
            const marksBatch = db.db.batch();
            marksSnapshot.docs.forEach(doc => marksBatch.delete(doc.ref));
            await marksBatch.commit();

            // Delete all students
            const studentsSnapshot = await db.studentsCollection.get();
            const studentsBatch = db.db.batch();
            studentsSnapshot.docs.forEach(doc => studentsBatch.delete(doc.ref));
            await studentsBatch.commit();

            Toast.show('All data has been reset', 'success');
            document.getElementById('reset-modal')?.classList.remove('active');
            await this.loadData();
        } catch (error) {
            Toast.show('Error resetting data', 'error');
        }
    }

    exportToJSON() {
        const data = {
            students: this.students,
            marks: this.marks,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mcss-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Toast.show('Backup downloaded successfully', 'success');
    }

    exportToExcel() {
        // Simple CSV export as fallback
        let csv = 'Student Name,Class,Section,Term,';
        const allSubjects = ['Combined Mathematics', 'Physics', 'Chemistry', 'Biology'];
        csv += allSubjects.join(',') + ',Total,Z-Score,Class Rank,Section Rank\n';

        this.marks.forEach(mark => {
            csv += `"${mark.studentName}","${mark.class}","${mark.section}","${mark.term}",`;
            allSubjects.forEach(subject => {
                csv += `${mark.subjects?.[subject] || ''},`;
            });
            csv += `${mark.total},${mark.sectionZScore?.toFixed(2) || ''},${mark.classRank || ''},${mark.sectionRank || ''}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mcss-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        Toast.show('Excel export downloaded', 'success');
    }

    exportToPDF() {
        // Use jsPDF for PDF generation
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('MCSS - Student Marks Report', 20, 20);

        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Total Students: ${this.students.length}`, 20, 40);
        doc.text(`Total Mark Entries: ${this.marks.length}`, 20, 50);

        // Add marks table
        let y = 70;
        doc.setFontSize(10);

        this.marks.slice(0, 50).forEach((mark, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(`${index + 1}. ${mark.studentName} | ${mark.class} | ${mark.term} | Total: ${mark.total} | Z: ${mark.sectionZScore?.toFixed(2) || '-'}`, 20, y);
            y += 8;
        });

        doc.save(`mcss-report-${new Date().toISOString().split('T')[0]}.pdf`);
        Toast.show('PDF report downloaded', 'success');
    }
}

// Initialize admin
let adminController;
document.addEventListener('DOMContentLoaded', () => {
    adminController = new AdminController();
});
