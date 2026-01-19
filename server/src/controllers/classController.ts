import { Request, Response } from 'express';
import { deleteClassEnrollments } from './enrollmentController';

// Tạm thời lưu dữ liệu trong memory (sau này thay bằng database thực)
let classes: any[] = [];
let classIdCounter = 1;

// Import để đếm assignments
let getAssignmentsCount: ((classId: number) => number) | null = null;
let getAssignmentsList: ((classId: number) => any[]) | null = null;

export function setAssignmentsCountGetter(getter: (classId: number) => number) {
    getAssignmentsCount = getter;
}

export function setAssignmentsListGetter(getter: (classId: number) => any[]) {
    getAssignmentsList = getter;
}

// Export function để tìm class theo code
export function getClassByCode(code: string): any {
    const classData = classes.find(c => c.code === code);
    if (!classData) return null;
    
    return {
        ...classData,
        assignments: getAssignmentsCount ? getAssignmentsCount(classData.id) : 0
    };
}

export class ClassController {
    public async getClasses(req: Request, res: Response) {
        try {
            // Lấy teacherId từ query hoặc params
            const teacherId = req.query.teacherId || req.body.teacherId;
            
            // Filter classes by teacherId nếu có
            let filteredClasses = classes;
            if (teacherId) {
                filteredClasses = classes.filter(cls => cls.teacherId == teacherId);
                console.log(`[DEBUG] Filtering classes for teacherId ${teacherId}: found ${filteredClasses.length} classes`);
            }
            
            // Cập nhật số lượng assignments cho mỗi lớp
            const classesWithCount = filteredClasses.map(cls => {
                const assignments_list = getAssignmentsList ? getAssignmentsList(cls.id) : [];
                console.log(`Class ${cls.id} - assignments_list:`, assignments_list);
                return {
                    ...cls,
                    assignments: getAssignmentsCount ? getAssignmentsCount(cls.id) : 0,
                    assignments_list: assignments_list
                };
            });
            console.log('Response classes:', classesWithCount);
            res.json(classesWithCount);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải lớp học', error });
        }
    }

    public async getClassById(req: Request, res: Response) {
        try {
            const classData = classes.find(c => c.id === Number(req.params.id));
            if (!classData) {
                return res.status(404).json({ message: 'Lớp học không tồn tại' });
            }
            // Cập nhật số lượng assignments
            const classWithCount = {
                ...classData,
                assignments: getAssignmentsCount ? getAssignmentsCount(classData.id) : 0,
                assignments_list: getAssignmentsList ? getAssignmentsList(classData.id) : []
            };
            res.json(classWithCount);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải lớp học', error });
        }
    }

    public async createClass(req: Request, res: Response) {
        try {
            const { name, teacherId, code, teacherName } = req.body;
            
            if (!name || !teacherId) {
                return res.status(400).json({ message: 'Vui lòng cung cấp tên lớp và mã giáo viên' });
            }

            const newClass = {
                id: classIdCounter++,
                name,
                teacherId,
                teacherName: teacherName || 'Giáo viên',
                code,
                students: 0,
                assignments: 0,
                createdAt: new Date().toISOString()
            };

            classes.push(newClass);
            res.status(201).json(newClass);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tạo lớp học', error });
        }
    }

    public async updateClass(req: Request, res: Response) {
        try {
            const classIndex = classes.findIndex(c => c.id === Number(req.params.id));
            if (classIndex === -1) {
                return res.status(404).json({ message: 'Lớp học không tồn tại' });
            }

            classes[classIndex] = { ...classes[classIndex], ...req.body, id: Number(req.params.id) };
            res.json(classes[classIndex]);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi cập nhật lớp học', error });
        }
    }

    public async deleteClass(req: Request, res: Response) {
        try {
            const classId = Number(req.params.id);
            const classIndex = classes.findIndex(c => c.id === classId);
            if (classIndex === -1) {
                return res.status(404).json({ message: 'Lớp học không tồn tại' });
            }

            // Xóa lớp
            classes.splice(classIndex, 1);
            
            // Xóa tất cả enrollment của lớp này
            deleteClassEnrollments(classId);
            
            res.json({ message: 'Xóa lớp học thành công' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi xóa lớp học', error });
        }
    }
}
