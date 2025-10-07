import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import TeacherAuth from './pages/TeacherAuth';
import TeacherDashboard from './pages/TeacherDashboard';
import SessionDetails from './pages/SessionDetails';
import TeacherResults from './pages/TeacherResults';
import StudentEntry from './pages/StudentEntry';
import StudentGame from './pages/StudentGame';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/enseignant/auth" element={<TeacherAuth />} />
          <Route path="/enseignant" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/enseignant/dashboard" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/enseignant/session/:sessionId" element={<ProtectedRoute><SessionDetails /></ProtectedRoute>} />
          <Route path="/enseignant/resultats/:sessionId" element={<ProtectedRoute><TeacherResults /></ProtectedRoute>} />
          <Route path="/eleve" element={<StudentEntry />} />
          <Route path="/eleve/jeu" element={<StudentGame />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
