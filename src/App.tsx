import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import WishlistDetail from './pages/WishlistDetail';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/list/:id" element={<WishlistDetail />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
