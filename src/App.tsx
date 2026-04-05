import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Shell } from './components/layout/Shell.js'
import { Workbench } from './pages/Workbench.js'
import { Insights } from './pages/Insights.js'
import { Topics } from './pages/Topics.js'
import { Scripts } from './pages/Scripts.js'
import { Report } from './pages/Report.js'
import { KnowledgeBase } from './pages/KnowledgeBase.js'
import { Projects } from './pages/Projects.js'
import { ProjectDashboard } from './pages/ProjectDashboard.js'
import { ToastContainer } from './components/shared/ToastContainer.js'
import { useProjectStore } from './store/project.store.js'
import { useUIStore } from './store/ui.store.js'

export function App() {
  const { fetchProjects } = useProjectStore()
  const { theme } = useUIStore()

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <>
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
        </Routes>
      </Shell>
      <ToastContainer />
    </>
  )
}
