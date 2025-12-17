import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DemoPage from './pages/DemoPage'
import KnowledgePage from './pages/KnowledgePage'
import WidgetChatPage from './pages/WidgetChatPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/demo/:company" element={<DemoPage />} />
      <Route path="/knowledge/:company" element={<KnowledgePage />} />
      <Route path="/widget/chat" element={<WidgetChatPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


