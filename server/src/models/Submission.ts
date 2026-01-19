export class Submission {
    id: number;
    assignmentId: number;
    studentId: number;
    studentName: string;
    submissionDate: string;
    file: string; // Path to uploaded file
    status: 'pending' | 'graded'; // pending, graded
    score?: number; // 0-10
    feedback?: string;

    constructor(
        id: number,
        assignmentId: number,
        studentId: number,
        studentName: string,
        submissionDate: string,
        file: string,
        status: 'pending' | 'graded' = 'pending',
        score?: number,
        feedback?: string
    ) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.submissionDate = submissionDate;
        this.file = file;
        this.status = status;
        this.score = score;
        this.feedback = feedback;
    }
}
