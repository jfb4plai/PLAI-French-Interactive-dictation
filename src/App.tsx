import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherResults from './pages/TeacherResults';
import StudentEntry from './pages/StudentEntry';
import StudentGame from './pages/StudentGame';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/enseignant" element={<TeacherDashboard />} />
        <Route path="/enseignant/resultats/:sessionId" element={<TeacherResults />} />
        <Route path="/eleve" element={<StudentEntry />} />
        <Route path="/eleve/jeu" element={<StudentGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
