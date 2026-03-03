import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Platform from './pages/Platform.jsx';
import Analysis from './pages/Analysis.jsx';
import ExecutionTests from './pages/ExecutionTests.jsx';
import ExecutionProjectTests from './pages/ExecutionProjectTests.jsx';
import ExecutionPlans from './pages/ExecutionPlans.jsx';
import ExecutionPlanDetail from './pages/ExecutionPlanDetail.jsx';
import ExecutionRuns from './pages/ExecutionRuns.jsx';
import ExecutionRunDetail from './pages/ExecutionRunDetail.jsx';
import ExecutionResults from './pages/ExecutionResults.jsx';
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import Verified from './pages/Verified.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import ResetPasswordUpdate from './pages/ResetPasswordUpdate.jsx';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm.jsx';
import MfaChallenge from './pages/MfaChallenge.jsx';
import Logout from './pages/Logout.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import JoinOrganization from './pages/JoinOrganization.jsx';
import NoOrganization from './pages/NoOrganization.jsx';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { RequireOrgAccess } from './auth/RequireOrgAccess.jsx';

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
      <Route path="/auth/mfa" element={<MfaChallenge />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard/join/:token" element={<JoinOrganization />} />
      <Route path="/dashboard/no-org" element={<RequireAuth><NoOrganization /></RequireAuth>} />
      <Route path="/dashboard/:orgSlug" element={<RequireAuth><RequireOrgAccess section="dashboard"><Dashboard /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/profile" element={<RequireAuth><RequireOrgAccess section="profile"><Profile /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/settings" element={<RequireAuth><RequireOrgAccess section="settings"><Settings /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/platform" element={<RequireAuth><RequireOrgAccess section="platform"><Platform /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/platform/organizations" element={<RequireAuth><RequireOrgAccess section="platform"><Platform /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution" element={<Navigate to="../execution/tests" replace />} />
      <Route path="/dashboard/:orgSlug/execution/tests" element={<RequireAuth><RequireOrgAccess section="execution"><ExecutionTests /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution/tests/:projectId" element={<RequireAuth><RequireOrgAccess section="execution"><ExecutionProjectTests /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution/tests/:projectId/test-case/:testCaseId" element={<RequireAuth><RequireOrgAccess section="execution"><ExecutionProjectTests /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution/plans" element={<RequireAuth><RequireOrgAccess section="execution"><ExecutionPlans /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution/plans/:planId" element={<RequireAuth><RequireOrgAccess section="execution"><ExecutionPlanDetail /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution/runs" element={<RequireAuth><RequireOrgAccess section="execution"><ExecutionRuns /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution/runs/:runId" element={<RequireAuth><RequireOrgAccess section="execution"><ExecutionRunDetail /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/execution/results" element={<RequireAuth><RequireOrgAccess section="execution"><ExecutionResults /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/analysis" element={<Navigate to="../analysis/insights" replace />} />
      <Route path="/dashboard/:orgSlug/analysis/insights" element={<RequireAuth><RequireOrgAccess section="analysis"><Analysis /></RequireOrgAccess></RequireAuth>} />
      <Route path="/dashboard/:orgSlug/analysis/coverage" element={<RequireAuth><RequireOrgAccess section="analysis"><Analysis /></RequireOrgAccess></RequireAuth>} />
    </Routes>
  );
}

export default App;
