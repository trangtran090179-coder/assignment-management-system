import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token from localStorage to every request if available
apiClient.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
    } catch (e) {
        // ignore
    }
    return config;
}, (error) => Promise.reject(error));

export const fetchUsers = async () => {
    const response = await apiClient.get('/users');
    return response.data;
};

export const fetchUserById = async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
};

export const createUser = async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
};

export const updateUser = async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
};

// Class APIs
export const getClasses = async (teacherId?: number) => {
    let url = '/classes';
    if (teacherId) {
        url += `?teacherId=${teacherId}`;
    }
    const response = await apiClient.get(url);
    return response.data;
};

export const getClassById = async (id: string) => {
    const response = await apiClient.get(`/classes/${id}`);
    return response.data;
};

export const createClass = async (classData) => {
    const response = await apiClient.post('/classes', classData);
    return response.data;
};

export const updateClass = async (id, classData) => {
    const response = await apiClient.put(`/classes/${id}`, classData);
    return response.data;
};

export const deleteClass = async (id) => {
    const response = await apiClient.delete(`/classes/${id}`);
    return response.data;
};

export const createAssignment = async (assignmentData, files?: FileList) => {
    console.log('[API] createAssignment called with:', assignmentData);
    if (files && files.length > 0) {
        // If files are provided, use Fetch API instead of axios
        const formData = new FormData();
        formData.append('classId', String(assignmentData.classId));
        formData.append('title', assignmentData.title);
        formData.append('description', assignmentData.description);
        formData.append('dueDate', assignmentData.dueDate);
        formData.append('teacherId', String(assignmentData.teacherId));
        formData.append('className', assignmentData.className);
        
        console.log('[API] FormData contents:', {
            classId: assignmentData.classId,
            title: assignmentData.title,
            dueDate: assignmentData.dueDate,
            className: assignmentData.className,
            filesCount: files.length
        });
        
        // Add all files
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        // Use Fetch API for FormData (axios has issues with multipart)
        console.log('[API] Sending POST to http://localhost:5000/api/assignments');
        const response = await fetch('http://localhost:5000/api/assignments', {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header, let browser set it with boundary
        });
        
        console.log('[API] Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[API] Assignment created:', data);
        return data;
    } else {
        // If no files, send as JSON with axios
        console.log('[API] No files provided, sending as JSON');
        const response = await apiClient.post('/assignments', assignmentData);
        console.log('[API] Assignment created:', response.data);
        return response.data;
    }
};

export const getClassAssignments = async (classId: string) => {
    try {
        console.log(`[API] Fetching assignments for classId: ${classId}`);
        const url = `/classes/${classId}/assignments`;
        console.log(`[API] Full request URL: http://localhost:5000/api${url}`);
        const response = await apiClient.get(url);
        console.log(`[API] Got response:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[API ERROR] Failed to fetch assignments for classId ${classId}:`, error);
        throw error;
    }
};

export const getAssignmentById = async (id: string) => {
    const response = await apiClient.get(`/assignments/${id}`);
    return response.data;
};

export const deleteAssignment = async (id: string) => {
    const response = await apiClient.delete(`/assignments/${id}`);
    return response.data;
};

// Student Enrollment APIs
export const joinClass = async (enrollmentData) => {
    const response = await apiClient.post('/enrollments', enrollmentData);
    return response.data;
};

export const getStudentClasses = async (studentId) => {
    const response = await apiClient.get(`/students/${studentId}/classes`);
    return response.data;
};

export const getStudentAssignments = async (studentId) => {
    const response = await apiClient.get(`/students/${studentId}/assignments`);
    return response.data;
};

// Submission APIs
export const getAssignmentSubmissions = async (assignmentId: string) => {
    const response = await apiClient.get(`/submissions/assignment/${assignmentId}`);
    return response.data;
};

export const getSubmissionById = async (id: string) => {
    const response = await apiClient.get(`/submissions/${id}`);
    return response.data;
};

export const createSubmission = async (submissionData, file?: File) => {
    if (file) {
        const formData = new FormData();
        formData.append('assignmentId', String(submissionData.assignmentId));
        formData.append('studentId', String(submissionData.studentId));
        formData.append('studentName', submissionData.studentName);
        formData.append('file', file);
        
        const response = await fetch('http://localhost:5000/api/submissions', {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } else {
        const response = await apiClient.post('/submissions', submissionData);
        return response.data;
    }
};

export const gradeSubmission = async (submissionId: string, gradeData: { score: number; feedback: string }) => {
    const response = await apiClient.put(`/submissions/${submissionId}/grade`, gradeData);
    return response.data;
};

export const getStudentSubmissions = async (studentId: string, assignmentId?: string) => {
    let url = `/submissions?studentId=${studentId}`;
    if (assignmentId) {
        url += `&assignmentId=${assignmentId}`;
    }
    const response = await apiClient.get(url);
    return response.data;
};

export const getClassStudents = async (classId: string) => {
    const response = await apiClient.get(`/classes/${classId}/students`);
    return response.data;
};

// Quiz APIs
export const getQuizzes = async () => {
    const response = await apiClient.get('/quizzes');
    return response.data;
};

export const getClassQuizzes = async (classId: string) => {
    const response = await apiClient.get(`/quizzes/class/${classId}`);
    return response.data;
};

export const getQuizById = async (id: string) => {
    const response = await apiClient.get(`/quizzes/${id}`);
    return response.data;
};

export const getQuizForStudent = async (id: string) => {
    const response = await apiClient.get(`/quizzes/${id}/student`);
    return response.data;
};

export const createQuiz = async (quizData: any) => {
    const response = await apiClient.post('/quizzes', quizData);
    return response.data;
};

export const updateQuiz = async (id: string, quizData: any) => {
    const response = await apiClient.put(`/quizzes/${id}`, quizData);
    return response.data;
};

export const deleteQuiz = async (id: string) => {
    const response = await apiClient.delete(`/quizzes/${id}`);
    return response.data;
};

export const submitQuiz = async (id: string, submissionData: any) => {
    const response = await apiClient.post(`/quizzes/${id}/submit`, submissionData);
    return response.data;
};

export const getQuizResult = async (id: string, studentId: string) => {
    const response = await apiClient.get(`/quizzes/${id}/result/${studentId}`);
    return response.data;
};

export const getQuizAttempts = async (id: string) => {
    const response = await apiClient.get(`/quizzes/${id}/attempts`);
    return response.data;
};

export default apiClient;