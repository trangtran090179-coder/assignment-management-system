import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ClassDetail from './pages/ClassDetail';
import AssignmentDetail from './pages/AssignmentDetail';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import StartQuiz from './pages/StartQuiz';
import QuizResult from './pages/QuizResult';
import './styles/main.css';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <ThemeProvider>
      <Router>
        <Header user={user} onLogout={handleLogout} />
        <div className="app-container">
          <Routes>
            <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} /> : <Register onRegister={handleLogin} />} />
            <Route path="/teacher/dashboard" element={user && user.role === 'teacher' ? <TeacherDashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/student/dashboard" element={user && user.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/class/:id" element={user ? <ClassDetail user={user} /> : <Navigate to="/login" />} />
            <Route path="/assignment/:id" element={user ? <AssignmentDetail user={user} /> : <Navigate to="/login" />} />
            <Route path="/quiz/create/:classId" element={user && user.role === 'teacher' ? <CreateQuiz classId={0} teacherId={user.id} /> : <Navigate to="/login" />} />
            <Route path="/quiz/:quizId/take" element={user && user.role === 'student' ? <TakeQuiz user={user} /> : <Navigate to="/login" />} />
            <Route path="/quiz/:quizId/start" element={user && user.role === 'student' ? <StartQuiz /> : <Navigate to="/login" />} />
            <Route path="/quiz/:quizId/result/:studentId" element={user ? <QuizResult user={user} /> : <Navigate to="/login" />} />
            <Route path="/" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} /> : <Navigate to="/login" />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </ThemeProvider>
  );
};

export default App;