import { Request, Response } from 'express';
import path from 'path';
import { convertDocxToHtml } from '../utils/docxConverter';
import fs from 'fs';

let submissions: any[] = [];
let submissionIdCounter = 1;

// Export function để lấy submissions của student
export function getSubmissionsByStudent(studentId: number): any[] {
    return submissions.filter(s => s.studentId === studentId);
}

// Export function để lấy submissions của assignment
export function getSubmissionsByAssignment(assignmentId: number): any[] {
    return submissions.filter(s => s.assignmentId == assignmentId);
}

// Export hàm để thêm submission
export function addSubmission(submission: any): void {
    submissions.push(submission);
}

// Export hàm để lấy tất cả submissions
export function getAllSubmissions(): any[] {
    return submissions;
}

export class SubmissionController {
    // Get all submissions for an assignment
    public async getAssignmentSubmissions(req: Request, res: Response) {
        try {
            const { assignmentId } = req.params;
            console.log(`[DEBUG] getAssignmentSubmissions called with assignmentId=${assignmentId}`);
            console.log(`[DEBUG] Total submissions in database: ${submissions.length}`);
            const assignmentSubmissions = submissions.filter(s => {
                const match = s.assignmentId == assignmentId;
                console.log(`[DEBUG] Checking submission ${s.id}: assignmentId=${s.assignmentId} vs requested=${assignmentId} -> ${match}`);
                return match;
            });
            console.log(`[DEBUG] Found ${assignmentSubmissions.length} submissions for assignment ${assignmentId}`);
            res.json(assignmentSubmissions);
        } catch (error) {
            console.error('[ERROR] getAssignmentSubmissions error:', error);
            res.status(500).json({ message: 'Lỗi khi tải danh sách nộp bài', error });
        }
    }

    // Preview file (DOC/DOCX -> HTML, or return file URL)
    public async previewFile(req: Request, res: Response) {
        try {
            const { filename } = req.params;
            if (!filename) return res.status(400).json({ message: 'Filename is required' });

            const uploadsDir = path.join(__dirname, '../../uploads');
            const filePath = path.join(uploadsDir, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'File not found' });
            }

            const ext = path.extname(filename).toLowerCase();
            if (ext === '.docx' || ext === '.doc') {
                const html = await convertDocxToHtml(filePath);
                return res.json({ html });
            }

            return res.json({ url: `/uploads/${filename}` });
        } catch (error) {
            console.error('[ERROR] previewFile error:', error);
            res.status(500).json({ message: 'Lỗi khi xem trước file', error });
        }
    }

    // Get submission by id
    public async getSubmissionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const submission = submissions.find(s => s.id == id);
            if (!submission) {
                return res.status(404).json({ message: 'Không tìm thấy bài nộp' });
            }
            res.json(submission);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải bài nộp', error });
        }
    }

    // Create submission
    public async createSubmission(req: Request, res: Response) {
        try {
            const { assignmentId, studentId, studentName } = req.body;
            const file = req.file as Express.Multer.File | undefined;

            console.log('[DEBUG] createSubmission called with:', { assignmentId, studentId, studentName, hasFile: !!file });

            if (!assignmentId || !studentId || !studentName) {
                console.log('[ERROR] Missing required fields in submission');
                return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
            }

            // Get the uploaded file
            const filePath = file ? `/uploads/${file.filename}` : '';
            console.log('[DEBUG] File path for submission:', filePath);

            const newSubmission = {
                id: submissionIdCounter++,
                assignmentId: Number(assignmentId),
                studentId: Number(studentId),
                studentName: studentName.trim(),
                submissionDate: new Date().toISOString(),
                file: filePath,
                status: 'pending',
                score: undefined,
                feedback: undefined
            };

            submissions.push(newSubmission);
            console.log('[DEBUG] Submission created successfully:', newSubmission);
            console.log('[DEBUG] Total submissions now:', submissions.length);
            res.status(201).json(newSubmission);
        } catch (error) {
            console.error('[ERROR] createSubmission error:', error);
            res.status(500).json({ message: 'Lỗi khi tạo bài nộp', error });
        }
    }

    // Grade submission
    public async gradeSubmission(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { score, feedback } = req.body;

            if (score === undefined || !feedback) {
                return res.status(400).json({ message: 'Vui lòng cung cấp điểm và nhận xét' });
            }

            const submissionIndex = submissions.findIndex(s => s.id == id);
            if (submissionIndex === -1) {
                return res.status(404).json({ message: 'Không tìm thấy bài nộp' });
            }

            submissions[submissionIndex] = {
                ...submissions[submissionIndex],
                status: 'graded',
                score: Number(score),
                feedback: feedback
            };

            res.json(submissions[submissionIndex]);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi chấm điểm', error });
        }
    }

    // Get all submissions for a student in a class
    public async getStudentSubmissions(req: Request, res: Response) {
        try {
            const { studentId, assignmentId } = req.query;
            
            let filtered = submissions;
            if (studentId) {
                filtered = filtered.filter(s => s.studentId == studentId);
            }
            if (assignmentId) {
                filtered = filtered.filter(s => s.assignmentId == assignmentId);
            }
            
            res.json(filtered);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải bài nộp', error });
        }
    }
}
