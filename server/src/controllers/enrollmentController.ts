import { Request, Response } from 'express';

// Dữ liệu enrollment tạm thời (sau này replace bằng database)
let enrollments: any[] = [];

// Import để lấy thông tin classes
let getClassByCode: ((code: string) => any) | null = null;
let getAssignmentsList: ((classId: number) => any[]) | null = null;
let getSubmissionsList: ((studentId: number) => any[]) | null = null;

export function setClassGetter(getter: (code: string) => any) {
    getClassByCode = getter;
}

export function setAssignmentsListGetter(getter: (classId: number) => any[]) {
    getAssignmentsList = getter;
}

export function setSubmissionsListGetter(getter: (studentId: number) => any[]) {
    getSubmissionsList = getter;
}

// Function để xóa enrollments của một lớp (khi lớp bị xóa)
export function deleteClassEnrollments(classId: number) {
    const initialLength = enrollments.length;
    enrollments = enrollments.filter(e => e.classId !== classId);
    console.log(`[DEBUG] Deleted ${initialLength - enrollments.length} enrollments for class ${classId}`);
}

export class EnrollmentController {
    public async joinClass(req: Request, res: Response) {
        try {
            const { studentId, classCode, studentName } = req.body;

            if (!studentId || !classCode) {
                return res.status(400).json({ message: 'Vui lòng cung cấp studentId và classCode' });
            }

            // Tìm lớp học từ classCode
            const classData = getClassByCode ? getClassByCode(classCode) : null;
            
            if (!classData) {
                return res.status(404).json({ message: 'Mã lớp không tồn tại!' });
            }

            // Kiểm tra xem học sinh đã tham gia lớp này chưa
            const existing = enrollments.find(
                e => e.studentId === studentId && e.classId === classData.id
            );

            if (existing) {
                return res.status(400).json({ message: 'Bạn đã tham gia lớp này rồi!' });
            }

            const enrollment = {
                id: enrollments.length + 1,
                studentId,
                studentName: studentName || `Student ${studentId}`, // Add studentName
                classId: classData.id,
                classCode,
                enrolledAt: new Date().toISOString()
            };

            enrollments.push(enrollment);
            res.status(201).json(enrollment);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tham gia lớp', error });
        }
    }

    public async getStudentClasses(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            
            // Lấy danh sách lớp mà học sinh đã tham gia
            const studentEnrollments = enrollments.filter(e => e.studentId == studentId);
            
            // Map với thông tin lớp thực
            const classes = studentEnrollments.map(e => {
                const classData = getClassByCode ? getClassByCode(e.classCode) : null;
                
                // Đếm số học sinh trong lớp
                const classStudentsCount = enrollments.filter(en => en.classId === e.classId).length;
                
                return {
                    id: classData?.id || e.classId,
                    name: classData?.name || `Lớp ${e.classCode}`,
                    code: e.classCode,
                    teacherId: classData?.teacherId,
                    teacherName: classData?.teacherName || 'N/A',
                    students: classStudentsCount,
                    assignments: classData?.assignments || 0
                };
            });

            res.json(classes);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải lớp học', error });
        }
    }

    public async getStudentAssignments(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            
            // Lấy danh sách lớp mà học sinh đã tham gia
            const studentEnrollments = enrollments.filter(e => e.studentId == studentId);
            
            // Lấy danh sách assignments từ các lớp đó
            let studentAssignments: any[] = [];
            for (const enrollment of studentEnrollments) {
                // Lấy assignments từ classId
                if (getAssignmentsList) {
                    const classAssignments = getAssignmentsList(enrollment.classId);
                    studentAssignments = [...studentAssignments, ...classAssignments];
                }
            }
            
            // Thêm status của submission cho mỗi assignment
            if (getSubmissionsList) {
                const studentSubmissions = getSubmissionsList(Number(studentId));
                console.log(`[DEBUG] Student ${studentId} has ${studentSubmissions.length} submissions`);
                studentAssignments = studentAssignments.map(assignment => {
                    const submission = studentSubmissions.find(s => s.assignmentId === assignment.id);
                    const enrichedAssignment = {
                        ...assignment,
                        status: submission ? submission.status : 'unpublished',
                        score: submission ? submission.score : undefined,
                        feedback: submission ? submission.feedback : undefined,
                        submissionDate: submission ? submission.submissionDate : undefined
                    };
                    console.log(`[DEBUG] Assignment ${assignment.id}: status=${enrichedAssignment.status} (has submission: ${!!submission})`);
                    return enrichedAssignment;
                });
            } else {
                console.log('[DEBUG] getSubmissionsList is not set!');
            }
            
            // Sắp xếp theo hạn nộp
            studentAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            
            console.log(`[DEBUG] Returning ${studentAssignments.length} assignments for student ${studentId}`);
            res.json(studentAssignments);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải bài tập', error });
        }
    }

    public async getClassStudents(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            
            // Lấy danh sách học sinh trong lớp
            const classStudents = enrollments.filter(e => e.classId == classId);
            
            res.json(classStudents);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi tải danh sách học sinh', error });
        }
    }
}
