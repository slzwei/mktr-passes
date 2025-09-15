import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { Header } from './components/Header';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:templateId" element={<Editor />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
