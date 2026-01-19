import { Request, Response } from 'express';
import { getDocxPreview } from '../utils/docxConverter';
import { getSubmissionsByAssignment } from './submissionController';
import * as path from 'path';

let assignments: any[] = [];
let assignmentIdCounter = 1;

console.log('[INIT] Assignment Controller initialized');

// Export function để các controller khác có thể đếm assignments
export function getAssignmentsCountByClass(classId: number): number {
    const count = assignments.filter(a => a.classId == classId).length;
    console.log(`[DEBUG] getAssignmentsCountByClass(${classId}) = ${count}`);
    return count;
}

// Export function để lấy assignments của class (sắp xếp theo ngày tạo mới nhất trước)
export function getAssignmentsByClass(classId: number): any[] {
    const filtered = assignments
        .filter(a => a.classId == classId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log(`[DEBUG] getAssignmentsByClass(${classId}) returned ${filtered.length} assignments`);
    return filtered;
}

export class AssignmentController {
    public async getAssignments(req: Request, res: Response) {
        try {
            res.json(assignments);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải bài tập', error });
        }
    }

    public async createAssignment(req: Request, res: Response) {
        try {
            const { classId, title, description, dueDate, teacherId, className } = req.body;
            const files = (req.files as Express.Multer.File[]) || [];

            console.log('\n===== CREATE ASSIGNMENT =====');
            console.log('Body:', { classId, title, dueDate, className });
            console.log('Files count:', files.length);

            if (!classId || !title || !dueDate) {
                console.log('ERROR: Missing required fields');
                return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin bài tập' });
            }

            // Store image paths
            const imageFiles = files.map(file => `/uploads/${file.filename}`);

            const newAssignment = {
                id: assignmentIdCounter++,
                classId: Number(classId),
                className: className || 'Lớp học',
                title: String(title).trim(),
                description: description ? String(description).trim() : '',
                dueDate: String(dueDate),
                teacherId: Number(teacherId),
                files: imageFiles,
                submitted: 0,
                total: 0,
                createdAt: new Date().toISOString()
            };

            assignments.push(newAssignment);
            
            console.log('CREATED:', newAssignment.id, newAssignment.classId, newAssignment.title);
            console.log('Total in storage:', assignments.length);
            console.log('==============================\n');

            res.status(201).json(newAssignment);
        } catch (error) {
            console.error('[CREATE ERROR]', error);
            res.status(500).json({ message: 'Lỗi khi tạo bài tập', error });
        }
    }

    public async getClassAssignments(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const classIdNum = Number(classId);

            console.log('\n===== GET CLASS ASSIGNMENTS =====');
            console.log('Requested classId: ' + classId + ' (as Number: ' + classIdNum + ')');
            console.log('Total in storage:', assignments.length);
            
            assignments.forEach(a => {
                console.log('  - Assignment ' + a.id + ': classId=' + a.classId + ' title=' + a.title);
            });

            const classAssignments = assignments
                .filter(a => Number(a.classId) === classIdNum)
                .map(a => {
                    const assignmentSubmissions = getSubmissionsByAssignment(a.id);
                    return {
                        ...a,
                        submitted: assignmentSubmissions.length,
                        total: 0 // This would be the total number of students in the class
                    };
                });

            console.log('RESULT: Found ' + classAssignments.length + ' assignments for class ' + classIdNum);
            console.log('==================================\n');

            res.json(classAssignments);
        } catch (error) {
            console.error('[GET ERROR]', error);
            res.status(500).json({ message: 'Lỗi khi tải bài tập', error });
        }
    }

    public async getAssignmentById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const assignment = assignments.find(a => a.id == id);
            if (!assignment) {
                return res.status(404).json({ message: 'Bài tập không tồn tại' });
            }
            res.json(assignment);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải bài tập', error });
        }
    }

    public async updateAssignment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const assignmentIndex = assignments.findIndex(a => a.id == id);
            if (assignmentIndex === -1) {
                return res.status(404).json({ message: 'Bài tập không tồn tại' });
            }

            assignments[assignmentIndex] = { ...assignments[assignmentIndex], ...req.body, id: Number(id) };
            res.json(assignments[assignmentIndex]);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi cập nhật bài tập', error });
        }
    }

    public async deleteAssignment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const assignmentIndex = assignments.findIndex(a => a.id == id);
            if (assignmentIndex === -1) {
                return res.status(404).json({ message: 'Bài tập không tồn tại' });
            }

            assignments.splice(assignmentIndex, 1);
            res.json({ message: 'Xóa bài tập thành công' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi xóa bài tập', error });
        }
    }

    public async getDocxPreview(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { fileName } = req.query;

            if (!fileName) {
                return res.status(400).json({ message: 'Vui lòng cung cấp tên file' });
            }

            const assignment = assignments.find(a => a.id == id);
            if (!assignment) {
                return res.status(404).json({ message: 'Bài tập không tồn tại' });
            }

            // Build file path from uploads directory
            const filePath = path.join(__dirname, '../../uploads', String(fileName));
            
            // Security check - ensure file path is within uploads directory
            const uploadsDir = path.resolve(path.join(__dirname, '../../uploads'));
            const resolvedPath = path.resolve(filePath);
            
            if (!resolvedPath.startsWith(uploadsDir)) {
                return res.status(403).json({ message: 'Truy cập bị từ chối' });
            }

            const htmlContent = await getDocxPreview(filePath);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(htmlContent);
        } catch (error: any) {
            console.error('Error in getDocxPreview:', error);
            res.status(500).json({ message: error.message || 'Lỗi khi xem trước file' });
        }
    }
}
