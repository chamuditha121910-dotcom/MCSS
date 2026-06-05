/* ============================================
   MCSS - Firebase Operations
   Database interactions and real-time updates
   ============================================ */

class MCSSDatabase {
    constructor() {
        this.db = firebase.firestore();
        this.studentsCollection = this.db.collection('students');
        this.marksCollection = this.db.collection('marks');
        this.listeners = [];
    }

    // ===== STUDENT OPERATIONS =====

    async addStudent(studentData) {
        try {
            const docRef = await this.studentsCollection.add({
                ...studentData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding student:', error);
            return { success: false, error: error.message };
        }
    }

    async updateStudent(studentId, data) {
        try {
            await this.studentsCollection.doc(studentId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating student:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteStudent(studentId) {
        try {
            // Delete all marks for this student first
            const marksSnapshot = await this.marksCollection
                .where('studentId', '==', studentId)
                .get();

            const batch = this.db.batch();
            marksSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            batch.delete(this.studentsCollection.doc(studentId));

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error deleting student:', error);
            return { success: false, error: error.message };
        }
    }

    async getStudentById(studentId) {
        try {
            const doc = await this.studentsCollection.doc(studentId).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            }
            return { success: false, error: 'Student not found' };
        } catch (error) {
            console.error('Error getting student:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllStudents() {
        try {
            const snapshot = await this.studentsCollection
                .orderBy('name')
                .get();

            const students = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, data: students };
        } catch (error) {
            console.error('Error getting students:', error);
            return { success: false, error: error.message };
        }
    }

    async searchStudents(query) {
        try {
            const snapshot = await this.studentsCollection
                .orderBy('name')
                .startAt(query)
                .endAt(query + '\uf8ff')
                .limit(10)
                .get();

            const students = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, data: students };
        } catch (error) {
            console.error('Error searching students:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== MARKS OPERATIONS =====

    async addMark(markData) {
        try {
            // Calculate total
            const subjects = markData.subjects;
            const total = Object.values(subjects).reduce((a, b) => a + (parseFloat(b) || 0), 0);

            const docRef = await this.marksCollection.add({
                ...markData,
                total: total,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Recalculate rankings
            await this.recalculateRankings(markData.section);

            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding mark:', error);
            return { success: false, error: error.message };
        }
    }

    async updateMark(markId, markData) {
        try {
            const subjects = markData.subjects;
            const total = Object.values(subjects).reduce((a, b) => a + (parseFloat(b) || 0), 0);

            await this.marksCollection.doc(markId).update({
                ...markData,
                total: total,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Recalculate rankings
            await this.recalculateRankings(markData.section);

            return { success: true };
        } catch (error) {
            console.error('Error updating mark:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteMark(markId, section) {
        try {
            await this.marksCollection.doc(markId).delete();

            // Recalculate rankings
            await this.recalculateRankings(section);

            return { success: true };
        } catch (error) {
            console.error('Error deleting mark:', error);
            return { success: false, error: error.message };
        }
    }

    async getMarksByStudent(studentId) {
        try {
            const snapshot = await this.marksCollection
                .where('studentId', '==', studentId)
                .orderBy('term')
                .get();

            const marks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, data: marks };
        } catch (error) {
            console.error('Error getting marks:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllMarks() {
        try {
            const snapshot = await this.marksCollection.get();

            const marks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, data: marks };
        } catch (error) {
            console.error('Error getting all marks:', error);
            return { success: false, error: error.message };
        }
    }

    async getMarksBySection(section) {
        try {
            const snapshot = await this.marksCollection
                .where('section', '==', section)
                .get();

            const marks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return { success: true, data: marks };
        } catch (error) {
            console.error('Error getting section marks:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== RANKING & Z-SCORE CALCULATIONS =====

    async recalculateRankings(section) {
        try {
            // Get all marks for the section
            const marksResult = await this.getMarksBySection(section);
            if (!marksResult.success) return;

            const marks = marksResult.data;

            // Group by class
            const classGroups = {};
            const sectionTotals = [];

            marks.forEach(mark => {
                if (!classGroups[mark.class]) {
                    classGroups[mark.class] = [];
                }
                classGroups[mark.class].push(mark);
                sectionTotals.push(mark.total);
            });

            // Calculate section statistics
            const sectionMean = Utils.mean(sectionTotals);
            const sectionStdDev = Utils.stdDev(sectionTotals);

            // Calculate class ranks and section z-scores
            for (const [className, classMarks] of Object.entries(classGroups)) {
                // Sort by total for class rank
                const sortedClassMarks = [...classMarks].sort((a, b) => b.total - a.total);

                sortedClassMarks.forEach((mark, index) => {
                    const classRank = index + 1;
                    const zScore = Utils.zScore(mark.total, sectionMean, sectionStdDev);

                    // Update the mark document
                    this.marksCollection.doc(mark.id).update({
                        classRank: classRank,
                        sectionZScore: zScore,
                        sectionMean: sectionMean,
                        sectionStdDev: sectionStdDev
                    });
                });
            }

            // Calculate section ranks
            const allSectionMarks = [...marks].sort((a, b) => b.total - a.total);
            allSectionMarks.forEach((mark, index) => {
                this.marksCollection.doc(mark.id).update({
                    sectionRank: index + 1
                });
            });

        } catch (error) {
            console.error('Error recalculating rankings:', error);
        }
    }

    // ===== REAL-TIME LISTENERS =====

    onStudentsChange(callback) {
        const unsubscribe = this.studentsCollection
            .orderBy('name')
            .onSnapshot(snapshot => {
                const students = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(students);
            }, error => {
                console.error('Students listener error:', error);
            });

        this.listeners.push(unsubscribe);
        return unsubscribe;
    }

    onMarksChange(callback) {
        const unsubscribe = this.marksCollection
            .onSnapshot(snapshot => {
                const marks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(marks);
            }, error => {
                console.error('Marks listener error:', error);
            });

        this.listeners.push(unsubscribe);
        return unsubscribe;
    }

    // ===== AGGREGATE DATA =====

    async getDashboardStats() {
        try {
            const studentsResult = await this.getAllStudents();
            const marksResult = await this.getAllMarks();

            if (!studentsResult.success || !marksResult.success) {
                return { success: false, error: 'Failed to fetch data' };
            }

            const students = studentsResult.data;
            const marks = marksResult.data;

            const physicalStudents = students.filter(s => 
                CONSTANTS.CLASSES.PHYSICAL.includes(s.class)
            ).length;

            const bioStudents = students.filter(s => 
                CONSTANTS.CLASSES.BIO.includes(s.class)
            ).length;

            // Calculate highest average
            let highestAvg = 0;
            const studentAvgs = {};

            marks.forEach(mark => {
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

            // Get latest term
            const terms = [...new Set(marks.map(m => m.term))].sort();
            const latestTerm = terms.length > 0 ? terms[terms.length - 1] : 'N/A';

            return {
                success: true,
                data: {
                    totalStudents: students.length,
                    physicalStudents,
                    bioStudents,
                    highestAverage: highestAvg,
                    latestTerm,
                    totalMarks: marks.length
                }
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return { success: false, error: error.message };
        }
    }

    async getTopRankers(section, limit = 10) {
        try {
            const marksResult = await this.getMarksBySection(section);
            if (!marksResult.success) return marksResult;

            const marks = marksResult.data;

            // Group by student and calculate average z-score
            const studentScores = {};

            marks.forEach(mark => {
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

            // Calculate average z-score for each student
            const rankedStudents = Object.values(studentScores).map(student => ({
                ...student,
                avgZScore: Utils.mean(student.zScores),
                highestTotal: Math.max(...student.totals)
            }));

            // Sort by average z-score
            rankedStudents.sort((a, b) => b.avgZScore - a.avgZScore);

            return { success: true, data: rankedStudents.slice(0, limit) };
        } catch (error) {
            console.error('Error getting top rankers:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== EXPORT FUNCTIONS =====

    async exportToExcel(data, filename) {
        // This will be implemented using SheetJS in the respective page scripts
        return { success: true };
    }

    async exportToPDF(data, filename) {
        // This will be implemented using jsPDF in the respective page scripts
        return { success: true };
    }

    // ===== CLEANUP =====

    cleanup() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Initialize database instance
const db = new MCSSDatabase();
window.db = db;
