/* ============================================
   MCSS - Dashboard Script
   Homepage with statistics, search, and rankings
   ============================================ */

class DashboardController {
    constructor() {
        this.students = [];
        this.marks = [];
        this.filteredStudents = [];
        this.charts = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupShortcutListener();
        await this.loadData();
        this.setupRealtimeListeners();
    }

    setupEventListeners() {
        // Search functionality
        const searchBar = document.getElementById('student-search');
        if (searchBar) {
            searchBar.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));

            // Close suggestions on click outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    document.getElementById('search-suggestions')?.classList.remove('active');
                }
            });
        }
    }

    setupShortcutListener() {
        const keys = new Set();

        document.addEventListener('keydown', (e) => {
            keys.add(e.key.toLowerCase());

            // Check for Ctrl + Shift + A + M
            if (e.ctrlKey && e.shiftKey && keys.has('a') && keys.has('m')) {
                e.preventDefault();
                this.openMarkEntryModal();
            }
        });

        document.addEventListener('keyup', (e) => {
            keys.delete(e.key.toLowerCase());
        });
    }

    setupRealtimeListeners() {
        // Listen for real-time updates
        db.onStudentsChange((students) => {
            this.students = students;
            this.updateDashboard();
        });

        db.onMarksChange((marks) => {
            this.marks = marks;
            this.updateDashboard();
        });
    }

    async loadData() {
        try {
            // Load students
            const studentsResult = await db.getAllStudents();
            if (studentsResult.success) {
                this.students = studentsResult.data;
            }

            // Load marks
            const marksResult = await db.getAllMarks();
            if (marksResult.success) {
                this.marks = marksResult.data;
            }

            this.updateDashboard();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Toast.show('Error loading data', 'error');
        }
    }

    updateDashboard() {
        this.updateStats();
        this.updateTopRankers();
        this.updateStudentCards();
    }

    updateStats() {
        const physicalStudents = this.students.filter(s => 
            CONSTANTS.CLASSES.PHYSICAL.includes(s.class)
        ).length;

        const bioStudents = this.students.filter(s => 
            CONSTANTS.CLASSES.BIO.includes(s.class)
        ).length;

        // Calculate highest average
        let highestAvg = 0;
        const studentAvgs = {};

        this.marks.forEach(mark => {
            if (!studentAvgs[mark.studentId]) {
                studentAvgs[mark.studentId] = { total: 0, count: 0 };
            }
            studentAvgs[mark.studentId].total += mark.total;
            studentAvgs[mark.studentId].count += 1;
        });

        Object.values(studentAvgs).forEach(avg => {
            const average = avg.total / avg.count;
            if (average > highestAvg) highestAvg = average;
        });

        const terms = [...new Set(this.marks.map(m => m.term))].sort();
        const latestTerm = terms.length > 0 ? terms[terms.length - 1] : 'N/A';

        // Update DOM
        const statsContainer = document.getElementById('stats-container');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card animate-in stagger-1">
                    <div class="stat-icon gold">👥</div>
                    <div class="stat-info">
                        <h3>Total Students</h3>
                        <div class="stat-value">${this.students.length}</div>
                    </div>
                </div>
                <div class="stat-card animate-in stagger-2">
                    <div class="stat-icon blue">⚛️</div>
                    <div class="stat-info">
                        <h3>Physical Science</h3>
                        <div class="stat-value">${physicalStudents}</div>
                    </div>
                </div>
                <div class="stat-card animate-in stagger-3">
                    <div class="stat-icon green">🧬</div>
                    <div class="stat-info">
                        <h3>Bio Science</h3>
                        <div class="stat-value">${bioStudents}</div>
                    </div>
                </div>
                <div class="stat-card animate-in stagger-4">
                    <div class="stat-icon purple">🏆</div>
                    <div class="stat-info">
                        <h3>Highest Average</h3>
                        <div class="stat-value">${highestAvg > 0 ? highestAvg.toFixed(1) : 'N/A'}</div>
                    </div>
                </div>
                <div class="stat-card animate-in stagger-5">
                    <div class="stat-icon gold">📅</div>
                    <div class="stat-info">
                        <h3>Latest Term</h3>
                        <div class="stat-value">${latestTerm}</div>
                    </div>
                </div>
            `;
        }
    }

    async updateTopRankers() {
        // Physical Science Top Rankers
        const physicalRankers = await this.getTopRankersBySection(CONSTANTS.SECTIONS.PHYSICAL, 5);
        const physicalContainer = document.getElementById('physical-rankers');
        if (physicalContainer) {
            physicalContainer.innerHTML = physicalRankers.map((student, index) => `
                <div class="ranker-card animate-in" style="animation-delay: ${index * 0.1}s">
                    <div class="ranker-rank ${index < 3 ? 'rank-' + (index + 1) : 'rank-other'}">${index + 1}</div>
                    <div class="ranker-info">
                        <div class="ranker-name">${student.name}</div>
                        <div class="ranker-class">${student.class}</div>
                    </div>
                    <div class="ranker-zscore">${student.avgZScore.toFixed(2)}</div>
                </div>
            `).join('');
        }

        // Bio Science Top Rankers
        const bioRankers = await this.getTopRankersBySection(CONSTANTS.SECTIONS.BIO, 5);
        const bioContainer = document.getElementById('bio-rankers');
        if (bioContainer) {
            bioContainer.innerHTML = bioRankers.map((student, index) => `
                <div class="ranker-card animate-in" style="animation-delay: ${index * 0.1}s">
                    <div class="ranker-rank ${index < 3 ? 'rank-' + (index + 1) : 'rank-other'}">${index + 1}</div>
                    <div class="ranker-info">
                        <div class="ranker-name">${student.name}</div>
                        <div class="ranker-class">${student.class}</div>
                    </div>
                    <div class="ranker-zscore">${student.avgZScore.toFixed(2)}</div>
                </div>
            `).join('');
        }
    }

    async getTopRankersBySection(section, limit) {
        const sectionMarks = this.marks.filter(m => m.section === section);

        const studentScores = {};
        sectionMarks.forEach(mark => {
            if (!studentScores[mark.studentId]) {
                studentScores[mark.studentId] = {
                    studentId: mark.studentId,
                    name: mark.studentName,
                    class: mark.class,
                    zScores: [],
                    totals: []
                };
            }
            studentScores[mark.studentId].zScores.push(mark.sectionZScore || 0);
            studentScores[mark.studentId].totals.push(mark.total);
        });

        const rankedStudents = Object.values(studentScores).map(student => ({
            ...student,
            avgZScore: Utils.mean(student.zScores),
            highestTotal: student.totals.length > 0 ? Math.max(...student.totals) : 0
        }));

        rankedStudents.sort((a, b) => b.avgZScore - a.avgZScore);
        return rankedStudents.slice(0, limit);
    }

    updateStudentCards() {
        const container = document.getElementById('students-grid');
        if (!container) return;

        if (this.students.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📚</div>
                    <h3>No Students Found</h3>
                    <p>Add students using the admin panel or mark entry form</p>
                </div>
            `;
            return;
        }

        const displayStudents = this.filteredStudents.length > 0 ? this.filteredStudents : this.students;

        container.innerHTML = displayStudents.map((student, index) => {
            const studentMarks = this.marks.filter(m => m.studentId === student.id);
            const section = Utils.getSection(student.class);
            const isPhysical = section === CONSTANTS.SECTIONS.PHYSICAL;

            // Calculate stats
            const zScores = studentMarks.map(m => m.sectionZScore || 0);
            const avgZScore = zScores.length > 0 ? Utils.mean(zScores) : 0;
            const totals = studentMarks.map(m => m.total);
            const highestTotal = totals.length > 0 ? Math.max(...totals) : 0;

            // Get best rank
            const ranks = studentMarks.map(m => m.sectionRank).filter(r => r);
            const bestRank = ranks.length > 0 ? Math.min(...ranks) : '-';

            return `
                <div class="student-card animate-in" 
                     style="animation-delay: ${index * 0.05}s"
                     onclick="dashboardController.viewStudentProfile('${student.id}')">
                    <div class="student-rank">${bestRank !== '-' ? bestRank : '-'}</div>
                    <div class="student-card-header">
                        <div class="student-avatar">${Utils.getInitials(student.name)}</div>
                        <div class="student-meta">
                            <div class="student-name">${student.name}</div>
                            <div class="student-class">
                                ${student.class}
                                <span class="student-class-badge ${isPhysical ? 'badge-physical' : 'badge-bio'}">
                                    ${isPhysical ? 'Physical' : 'Bio'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="student-stats">
                        <div class="student-stat">
                            <div class="student-stat-value">${avgZScore.toFixed(2)}</div>
                            <div class="student-stat-label">Avg Z-Score</div>
                        </div>
                        <div class="student-stat">
                            <div class="student-stat-value">${highestTotal}</div>
                            <div class="student-stat-label">Highest</div>
                        </div>
                        <div class="student-stat">
                            <div class="student-stat-value">${studentMarks.length}</div>
                            <div class="student-stat-label">Terms</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    handleSearch(query) {
        const suggestionsContainer = document.getElementById('search-suggestions');

        if (!query.trim()) {
            this.filteredStudents = [];
            suggestionsContainer?.classList.remove('active');
            this.updateStudentCards();
            return;
        }

        const lowerQuery = query.toLowerCase();
        this.filteredStudents = this.students.filter(s => 
            s.name.toLowerCase().includes(lowerQuery) ||
            s.class.toLowerCase().includes(lowerQuery)
        );

        // Show suggestions
        if (suggestionsContainer) {
            if (this.filteredStudents.length > 0) {
                suggestionsContainer.innerHTML = this.filteredStudents.slice(0, 8).map(student => {
                    const studentMarks = this.marks.filter(m => m.studentId === student.id);
                    const zScores = studentMarks.map(m => m.sectionZScore || 0);
                    const avgZScore = zScores.length > 0 ? Utils.mean(zScores) : 0;

                    return `
                        <div class="suggestion-item" onclick="dashboardController.selectStudent('${student.id}')">
                            <div class="sugg-avatar">${Utils.getInitials(student.name)}</div>
                            <div class="sugg-info">
                                <div class="sugg-name">${student.name}</div>
                                <div class="sugg-class">${student.class}</div>
                            </div>
                            <div class="sugg-zscore">${avgZScore.toFixed(2)}</div>
                        </div>
                    `;
                }).join('');
                suggestionsContainer.classList.add('active');
            } else {
                suggestionsContainer.innerHTML = `
                    <div class="suggestion-item" style="justify-content: center; color: var(--text-muted);">
                        No students found
                    </div>
                `;
                suggestionsContainer.classList.add('active');
            }
        }

        this.updateStudentCards();
    }

    selectStudent(studentId) {
        document.getElementById('search-suggestions')?.classList.remove('active');
        this.viewStudentProfile(studentId);
    }

    viewStudentProfile(studentId) {
        window.location.href = `student.html?id=${studentId}`;
    }

    // ===== MARK ENTRY MODAL =====

    openMarkEntryModal() {
        const modal = document.getElementById('mark-entry-modal');
        if (modal) {
            modal.classList.add('active');
            this.setupMarkEntryForm();
        }
    }

    closeMarkEntryModal() {
        const modal = document.getElementById('mark-entry-modal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('mark-entry-form')?.reset();
        }
    }

    setupMarkEntryForm() {
        const form = document.getElementById('mark-entry-form');
        const classSelect = document.getElementById('mark-class');
        const sectionInput = document.getElementById('mark-section');
        const subjectsContainer = document.getElementById('mark-subjects');
        const nameInput = document.getElementById('mark-student-name');
        const suggestionsContainer = document.getElementById('name-suggestions');

        if (!form) return;

        // Class change handler
        classSelect?.addEventListener('change', (e) => {
            const selectedClass = e.target.value;
            const section = Utils.getSection(selectedClass);
            const subjects = Utils.getSubjects(selectedClass);

            if (sectionInput) sectionInput.value = section;

            if (subjectsContainer) {
                subjectsContainer.innerHTML = subjects.map((subject, index) => `
                    <div class="form-group">
                        <label class="form-label">${subject}</label>
                        <input type="number" class="form-input subject-mark" 
                               name="subject_${index}" placeholder="Enter marks"
                               min="0" max="100" required
                               data-subject="${subject}">
                    </div>
                `).join('');
            }
        });

        // Student name autocomplete
        nameInput?.addEventListener('input', Utils.debounce((e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                suggestionsContainer?.classList.remove('active');
                return;
            }

            const matches = this.students.filter(s => 
                s.name.toLowerCase().includes(query)
            ).slice(0, 5);

            if (suggestionsContainer) {
                if (matches.length > 0) {
                    suggestionsContainer.innerHTML = matches.map(s => `
                        <div class="suggestion-item" onclick="dashboardController.selectExistingStudent('${s.id}', '${s.name}', '${s.class}')">
                            <div class="sugg-avatar">${Utils.getInitials(s.name)}</div>
                            <div class="sugg-info">
                                <div class="sugg-name">${s.name}</div>
                                <div class="sugg-class">${s.class}</div>
                            </div>
                        </div>
                    `).join('');
                    suggestionsContainer.classList.add('active');
                } else {
                    suggestionsContainer.classList.remove('active');
                }
            }
        }, 200));

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveMarkEntry();
        });
    }

    selectExistingStudent(id, name, className) {
        document.getElementById('mark-student-name').value = name;
        document.getElementById('mark-student-id').value = id;
        document.getElementById('mark-class').value = className;

        // Trigger class change
        document.getElementById('mark-class').dispatchEvent(new Event('change'));

        document.getElementById('name-suggestions')?.classList.remove('active');
    }

    async saveMarkEntry() {
        const form = document.getElementById('mark-entry-form');
        const formData = new FormData(form);

        const studentName = formData.get('studentName');
        const studentId = document.getElementById('mark-student-id')?.value;
        const className = formData.get('class');
        const term = formData.get('term');
        const section = Utils.getSection(className);

        // Get subjects and marks
        const subjects = {};
        const subjectInputs = form.querySelectorAll('.subject-mark');
        subjectInputs.forEach(input => {
            subjects[input.dataset.subject] = parseFloat(input.value) || 0;
        });

        // Check if student exists, if not create
        let actualStudentId = studentId;
        if (!actualStudentId) {
            const studentResult = await db.addStudent({
                name: studentName,
                class: className,
                section: section
            });

            if (studentResult.success) {
                actualStudentId = studentResult.id;
            } else {
                Toast.show('Error creating student', 'error');
                return;
            }
        }

        // Save mark
        const markResult = await db.addMark({
            studentId: actualStudentId,
            studentName: studentName,
            class: className,
            section: section,
            term: term,
            subjects: subjects
        });

        if (markResult.success) {
            Toast.show('Marks saved successfully!', 'success');
            this.closeMarkEntryModal();
            await this.loadData();
        } else {
            Toast.show('Error saving marks', 'error');
        }
    }
}

// Initialize dashboard
let dashboardController;
document.addEventListener('DOMContentLoaded', () => {
    dashboardController = new DashboardController();
});
