import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Platform from './pages/Platform.jsx';
import Execution from './pages/Execution.jsx';
import Analysis from './pages/Analysis.jsx';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import Verified from './pages/Verified.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import ResetPasswordUpdate from './pages/ResetPasswordUpdate.jsx';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm.jsx';
import Logout from './pages/Logout.jsx';
import { RequireAuth } from './auth/RequireAuth.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verified" element={<Verified />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password/update" element={<ResetPasswordUpdate />} />
      <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/dashboard/:orgSlug" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/platform" element={<RequireAuth><Platform /></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution" element={<RequireAuth><Execution /></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/analysis" element={<RequireAuth><Analysis /></RequireAuth>} />
    </Routes>
  );
}

export default App;
