import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import HomePage from '../pages/HomePage';
import ProgrammesPage from '../pages/ProgrammesPage';
import ProgrammeDetailPage from '../pages/ProgrammeDetailPage';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';
import CalculatorPage from '../pages/CalculatorPage';
import BudgetPlannerPage from '../pages/BudgetPlannerPage';
import PlansPage from '../pages/PlansPage';
import InfoPage from '../pages/InfoPage';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/UI/Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size={40} /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size={40} /></div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="programmes" element={<ProgrammesPage />} />
        <Route path="programmes/:id" element={<ProgrammeDetailPage />} />
        <Route path="calculator" element={<CalculatorPage />} />
        <Route path="budget" element={<BudgetPlannerPage />} />
        
        <Route path="login" element={
          <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
        } />
        <Route path="register" element={
          <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>
        } />
        
        <Route path="dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />

        <Route path="plans" element={
          <ProtectedRoute><PlansPage /></ProtectedRoute>
        } />

        <Route path="documentation" element={
          <ProtectedRoute><InfoPage /></ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
