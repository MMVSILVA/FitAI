/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './store/userStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import Checkout from './pages/Checkout';
import { UpdateNotification } from './components/UpdateNotification';

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <UpdateNotification />
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </Router>
      </UserProvider>
    </ErrorBoundary>
  );
}
