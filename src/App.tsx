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
import NutritionistDashboard from './pages/NutritionistDashboard';
import Checkout from './pages/Checkout';
import { UpdateNotification } from './components/UpdateNotification';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
import { CookieConsent } from './components/CookieConsent';

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <UpdateNotification />
        <IOSInstallPrompt />
        <CookieConsent />
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/nutritionist" element={<NutritionistDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </Router>
      </UserProvider>
    </ErrorBoundary>
  );
}
