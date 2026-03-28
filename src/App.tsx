import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import DNAHub from './pages/DNAHub';
import DiscoveryHub from './pages/DiscoveryHub';
import ReferralDesk from './pages/ReferralDesk';
import VerificationDesk from './pages/VerificationDesk';
import DashboardAnalytics from './pages/DashboardAnalytics';
import ProfilePage from './pages/ProfilePage';
import ApplicationTracker from './pages/ApplicationTracker';
import CareerAdvisor from './pages/CareerAdvisor';
import DashboardLayout from './components/DashboardLayout';
import ToastContainer from './components/ToastContainer';

function App() {
  const { user, isLoading } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-2xl tracking-widest text-primary">InternHub Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex">
        <Routes>
          <Route path="/" element={!user ? <LandingPage toggleTheme={toggleTheme} theme={theme} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <DashboardLayout toggleTheme={toggleTheme} theme={theme} /> : <Navigate to="/" />}>
            {user?.role === 'student' ? (
              <>
                <Route index element={<DNAHub />} />
                <Route path="discovery" element={user.hasResume ? <DiscoveryHub /> : <Navigate to="/dashboard" />} />
                <Route path="tracker" element={user.hasResume ? <ApplicationTracker /> : <Navigate to="/dashboard" />} />
                <Route path="advisor" element={user.hasResume ? <CareerAdvisor /> : <Navigate to="/dashboard" />} />
                <Route path="analytics" element={<DashboardAnalytics />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            ) : user?.role === 'alumnus' ? (
              <>
                <Route index element={<VerificationDesk />} />
                <Route path="referrals" element={user.isVerified ? <ReferralDesk /> : <Navigate to="/dashboard" />} />
                <Route path="analytics" element={<DashboardAnalytics />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            ) : (
              <>
                <Route index element={<div>Select Role in Landing</div>} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            )}
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
