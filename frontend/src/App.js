import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import Messages from './pages/Messages';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import OfflineIndicator from './components/OfflineIndicator';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CommunityForum from './pages/CommunityForum';
import ForumPost from './pages/ForumPost';
import LoyaltyRewards from './pages/LoyaltyRewards';
import Wishlist from './pages/Wishlist';
import HarvestCalendar from './pages/HarvestCalendar';
import PriceComparison from './pages/PriceComparison';

import { setupConnectivityListeners, getQueuedOrders, clearQueuedOrders } from './services/offlineStorage';
import setupNotifications from './services/notifications';
import { ordersAPI, authAPI } from './services/api';

function AdminHotkey({ isAdmin }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdmin) {
          navigate('/admin');
        } else {
          toast.error('Admin access only');
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAdmin, navigate]);

  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileRes = await authAPI.getProfile();
          setIsAdmin(profileRes.data.role === 'admin');
          await setupNotifications();
        } catch {}
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Setup connectivity listeners
    const cleanup = setupConnectivityListeners(
      async () => {
        setIsOnline(true);
        toast.success('You are back online!', { position: 'bottom-center' });
        try {
          const queued = await getQueuedOrders();
          if (queued.length > 0) {
            for (const q of queued) {
              try {
                await ordersAPI.create(q);
              } catch {}
            }
            await clearQueuedOrders();
            toast.success('Queued orders synced successfully', { position: 'bottom-center' });
          }
        } catch {}
      },
      () => {
        setIsOnline(false);
        toast.warning('You are offline. Some features may be limited.', { 
          position: 'bottom-center',
          autoClose: false,
        });
      }
    );

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')


    }

    return () => {
      unsubscribe();
      cleanup();
    };
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} />
        {!isOnline && <OfflineIndicator />}
        <AdminHotkey isAdmin={isAdmin} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/marketplace" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/marketplace" /> : <Register />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/listing/:id" element={<ListingDetail user={user} />} />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/create-listing" 
            element={user ? <CreateListing /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/messages" 
            element={user ? <Messages user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user ? (isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/analytics" 
            element={user ? (isAdmin ? <AnalyticsDashboard /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} 
          />
          <Route 
            path="/forum" 
            element={<CommunityForum />} 
          />
          <Route 
            path="/forum/:postId" 
            element={<ForumPost />} 
          />
          <Route 
            path="/rewards" 
            element={user ? <LoyaltyRewards /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/wishlist" 
            element={user ? <Wishlist /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/harvest-calendar" 
            element={user ? <HarvestCalendar /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/price-comparison" 
            element={<PriceComparison />} 
          />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
