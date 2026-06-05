/* ============================================
   MCSS - Student Profile Script
   Detailed student profile with charts and analysis
   ============================================ */

class StudentProfileController {
    constructor() {
        this.studentId = new URLSearchParams(window.location.search).get('id');
        this.student = null;
        this.marks = [];
        this.charts = {};
        this.init();
    }

    async init() {
        if (!this.studentId) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadStudentData();
        this.renderProfile();
        this.renderCharts();
        this.renderTermTable();
        this.renderPredictions();
    }

    async loadStudentData() {
        try {
            // Load student
            const studentResult = await db.getStudentById(this.studentId);
            if (studentResult.success) {
                this.student = studentResult.data;
            } else {
                Toast.show('Student not found', 'error');
                window.location.href = 'index.html';
                return;
            }

            // Load marks
            const marksResult = await db.getMarksByStudent(this.studentId);
            if (marksResult.success) {
                this.marks = marksResult.data;
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            Toast.show('Error loading student data', 'error');
        }
    }

    renderProfile() {
        if (!this.student) return;

        const section = Utils.getSection(this.student.class);
        const isPhysical = section === CONSTANTS.SECTIONS.PHYSICAL;

        // Update header
        const profileHeader = document.getElementById('profile-header');
        if (profileHeader) {
            const zScores = this.marks.map(m => m.sectionZScore || 0);
            const avgZScore = zScores.length > 0 ? Utils.mean(zScores) : 0;

            // Get best section rank
            const ranks = this.marks.map(m => m.sectionRank).filter(r => r);
            const bestRank = ranks.length > 0 ? Math.min(...ranks) : '-';

            profileHeader.innerHTML = `
                <div class="student-card" style="cursor: default;">
                    <div class="student-card-header">
                        <div class="student-avatar" style="width: 72px; height: 72px; font-size: 1.5rem;">
                            ${Utils.getInitials(this.student.name)}
                        </div>
                        <div class="student-meta">
                            <div class="student-name" style="font-size: 1.4rem;">${this.student.name}</div>
                            <div class="student-class" style="font-size: 0.95rem;">
                                ${this.student.class}
                                <span class="student-class-badge ${isPhysical ? 'badge-physical' : 'badge-bio'}">
                                    ${isPhysical ? 'Physical Science' : 'Bio Science'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="student-stats" style="grid-template-columns: repeat(4, 1fr);">
                        <div class="student-stat">
                            <div class="student-stat-value">${avgZScore.toFixed(2)}</div>
                            <div class="student-stat-label">Avg Z-Score</div>
                        </div>
                        <div class="student-stat">
                            <div class="student-stat-value">${bestRank}</div>
                            <div class="student-stat-label">Best Rank</div>
                        </div>
                        <div class="student-stat">
                            <div class="student-stat-value">${this.marks.length}</div>
                            <div class="student-stat-label">Terms</div>
                        </div>
                        <div class="student-stat">
                            <div class="student-stat-value">${section}</div>
                            <div class="student-stat-label">Section</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Highest subject marks
        const subjects = Utils.getSubjects(this.student.class);
        const highestMarks = {};

        subjects.forEach(subject => {
            highestMarks[subject] = 0;
        });

        this.marks.forEach(mark => {
            subjects.forEach(subject => {
                if (mark.subjects && mark.subjects[subject] > highestMarks[subject]) {
                    highestMarks[subject] = mark.subjects[subject];
                }
            });
        });

        const highestContainer = document.getElementById('highest-marks');
        if (highestContainer) {
            highestContainer.innerHTML = `
                <h2 class="section-title">
                    <span class="title-icon"></span>
                    Highest Subject Marks
                </h2>
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    ${subjects.map((subject, index) => `
                        <div class="stat-card animate-in stagger-${index + 1}">
                            <div class="stat-icon ${['gold', 'blue', 'green'][index]}">
                                ${['📐', '⚛️', '⚗️'][index]}
                            </div>
                            <div class="stat-info">
                                <h3>${subject}</h3>
                                <div class="stat-value">${highestMarks[subject]}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    renderCharts() {
        const subjects = Utils.getSubjects(this.student.class);
        const terms = ['Term 1', 'Term 2', 'Term 3'];

        // Prepare chart data
        const datasets = subjects.map((subject, index) => {
            const data = terms.map(term => {
                const mark = this.marks.find(m => m.term === term);
                return mark && mark.subjects ? (mark.subjects[subject] || 0) : null;
            });

            const colors = [
                { border: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' },
                { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
                { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' }
            ];

            return {
                label: subject,
                data: data,
                borderColor: colors[index].border,
                backgroundColor: colors[index].bg,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: colors[index].border,
                pointBorderColor: '#000',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            };
        });

        const ctx = document.getElementById('performance-chart');
        if (ctx) {
            if (this.charts.performance) {
                this.charts.performance.destroy();
            }

            this.charts.performance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: terms,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                                font: { family: 'Poppins', size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: { family: 'Poppins', size: 13 },
                            bodyFont: { family: 'Poppins', size: 12 },
                            padding: 12,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                                font: { family: 'Poppins' }
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                                font: { family: 'Poppins' }
                            }
                        }
                    }
                }
            });
        }
    }

    renderTermTable() {
        const subjects = Utils.getSubjects(this.student.class);
        const tableContainer = document.getElementById('term-table');

        if (!tableContainer) return;

        if (this.marks.length === 0) {
            tableContainer.innerHTML = `
                <h2 class="section-title">
                    <span class="title-icon"></span>
                    Term Analysis
                </h2>
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>No marks recorded yet</h3>
                </div>
            `;
            return;
        }

        const sortedMarks = [...this.marks].sort((a, b) => {
            const termOrder = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
            return termOrder[a.term] - termOrder[b.term];
        });

        tableContainer.innerHTML = `
            <h2 class="section-title">
                <span class="title-icon"></span>
                Term Analysis
            </h2>
            <div class="glass-card" style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Term</th>
                            ${subjects.map(s => `<th>${s}</th>`).join('')}
                            <th>Total</th>
                            <th>Z-Score</th>
                            <th>Class Rank</th>
                            <th>Section Rank</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedMarks.map(mark => `
                            <tr>
                                <td><strong>${mark.term}</strong></td>
                                ${subjects.map(subject => `
                                    <td>${mark.subjects?.[subject] || '-'}</td>
                                `).join('')}
                                <td><strong style="color: var(--gold);">${mark.total}</strong></td>
                                <td>${mark.sectionZScore?.toFixed(2) || '-'}</td>
                                <td>${mark.classRank || '-'}</td>
                                <td>${mark.sectionRank || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderPredictions() {
        const predictionContainer = document.getElementById('predictions');
        if (!predictionContainer) return;

        if (this.marks.length === 0) {
            predictionContainer.innerHTML = '';
            return;
        }

        // Prepare data for prediction
        const terms = [...this.marks].sort((a, b) => {
            const order = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
            return order[a.term] - order[b.term];
        });

        const zScores = terms.map(m => m.sectionZScore || 0);
        const avgZScore = Utils.mean(zScores);

        // Determine trend
        let trend = 'stable';
        if (terms.length >= 2) {
            const first = terms[0].total;
            const last = terms[terms.length - 1].total;
            if (last > first * 1.05) trend = 'improving';
            else if (last < first * 0.95) trend = 'declining';
        }

        const predictions = PredictionEngine.predict({
            terms: terms.map(t => ({ total: t.total })),
            avgZScore,
            trend
        });

        predictionContainer.innerHTML = `
            <h2 class="section-title">
                <span class="title-icon"></span>
                A/L Exam Prediction
            </h2>
            <div class="glass-card">
                ${predictions.map((pred, index) => `
                    <div class="prediction-item">
                        <div class="prediction-label">
                            <span class="prediction-grade">${pred.grade}</span>
                            <span class="prediction-percent">${pred.probability}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: 0%;" data-width="${pred.probability}%"></div>
                        </div>
                    </div>
                `).join('')}
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); font-size: 0.8rem; color: var(--text-muted);">
                    Based on ${terms.length} term test(s) • Z-Score: ${avgZScore.toFixed(2)} • Trend: ${trend}
                </div>
            </div>
        `;

        // Animate progress bars
        setTimeout(() => {
            document.querySelectorAll('.progress-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        }, 300);
    }
}

// Initialize student profile
let studentController;
document.addEventListener('DOMContentLoaded', () => {
    studentController = new StudentProfileController();
});
