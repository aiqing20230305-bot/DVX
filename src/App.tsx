import React, { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell.js'
import { ToastContainer } from './components/shared/ToastContainer.js'
import { ErrorBoundary } from './components/shared/ErrorBoundary.js'
import { TestingTrackerProvider } from './components/testing/TestingTracker.js'
import { ProtectedRoute } from './components/auth/ProtectedRoute.js'
import { PublicRoute } from './components/auth/PublicRoute.js'
import { ThemeProvider } from './contexts/ThemeContext.js'
import { useProjectStore } from './store/project.store.js'
import { useAuthStore } from './store/auth.store.js'
import { useUIStore } from './store/ui.store.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import './styles/print.css'

// Lazy load page components for code splitting
// Auth pages
const Login = lazy(() => import('./pages/Login.js').then(m => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Register.js').then(m => ({ default: m.Register })))

// App pages
const Workbench = lazy(() => import('./pages/Workbench.js').then(m => ({ default: m.Workbench })))
const Insights = lazy(() => import('./pages/Insights.js').then(m => ({ default: m.Insights })))
const Topics = lazy(() => import('./pages/Topics.js').then(m => ({ default: m.Topics })))
const Scripts = lazy(() => import('./pages/Scripts.js').then(m => ({ default: m.Scripts })))
const Report = lazy(() => import('./pages/Report.js').then(m => ({ default: m.Report })))
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase.js').then(m => ({ default: m.KnowledgeBase })))
const Projects = lazy(() => import('./pages/Projects.js').then(m => ({ default: m.Projects })))
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard.js').then(m => ({ default: m.ProjectDashboard })))
const ProjectSettings = lazy(() => import('./pages/ProjectSettings.js'))
const Approvals = lazy(() => import('./pages/Approvals.js'))
const Notifications = lazy(() => import('./pages/Notifications.js').then(m => ({ default: m.Notifications })))
const TestingSessions = lazy(() => import('./pages/Testing/TestingSessions.js').then(m => ({ default: m.TestingSessions })))
const SessionDetail = lazy(() => import('./pages/Testing/SessionDetail.js').then(m => ({ default: m.SessionDetail })))
const StartTestSession = lazy(() => import('./pages/Testing/StartTestSession.js').then(m => ({ default: m.StartTestSession })))
const Questionnaires = lazy(() => import('./pages/Testing/Questionnaires.js').then(m => ({ default: m.Questionnaires })))
const QuestionnaireEditor = lazy(() => import('./pages/Testing/QuestionnaireEditor.js').then(m => ({ default: m.QuestionnaireEditor })))
const QuestionnaireStats = lazy(() => import('./pages/Testing/QuestionnaireStats.js').then(m => ({ default: m.QuestionnaireStats })))
const QuestionnaireTriggers = lazy(() => import('./pages/Testing/QuestionnaireTriggers.js').then(m => ({ default: m.QuestionnaireTriggers })))
const TestingReport = lazy(() => import('./pages/Testing/TestingReport.js').then(m => ({ default: m.TestingReport })))

// Loading component for Suspense fallback
function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}

export function App() {
  const { fetchProjects } = useProjectStore()
  const { isAuthenticated, fetchCurrentUser } = useAuthStore()
  const { theme, setTheme } = useUIStore()

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // v2.2.0: Initialize theme on mount (sync UIStore with DOM)
  useEffect(() => {
    // Ensure data-theme attribute is set on initial load
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Try to restore auth state on mount
  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects()
    }
  }, [isAuthenticated])

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastContainer />
        <Suspense fallback={<PageLoading />}>
          <Routes>
          {/* Public routes (login/register) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes (require authentication) */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <TestingTrackerProvider>
                  <Shell>
                    <Routes>
                      <Route path="/" element={<Workbench />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/project/:id" element={<ProjectDashboard />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/topics" element={<Topics />} />
                      <Route path="/scripts" element={<Scripts />} />
                      <Route path="/report" element={<Report />} />
                      <Route path="/kb" element={<KnowledgeBase />} />
                      <Route path="/approvals" element={<Approvals />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/settings" element={<ProjectSettings />} />
                      <Route path="/testing" element={<TestingSessions />} />
                      <Route path="/testing/start" element={<StartTestSession />} />
                      <Route path="/testing/session/:id" element={<SessionDetail />} />
                      <Route path="/testing/questionnaires" element={<Questionnaires />} />
                      <Route path="/testing/questionnaire/:id/edit" element={<QuestionnaireEditor />} />
                      <Route path="/testing/questionnaire/:id/stats" element={<QuestionnaireStats />} />
                      <Route path="/testing/questionnaire/:id/triggers" element={<QuestionnaireTriggers />} />
                      <Route path="/testing/report" element={<TestingReport />} />
                    </Routes>
                  </Shell>
                </TestingTrackerProvider>
              </ProtectedRoute>
            }
          />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
