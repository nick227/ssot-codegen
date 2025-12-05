import { Routes, Route } from 'react-router-dom'
import MobileLayout from './components/layout/MobileLayout'
import HomePage from './pages/HomePage'
import DiscoveryPage from './pages/DiscoveryPage'
import MatchesPage from './pages/MatchesPage'
import ProfilePage from './pages/ProfilePage'
import MessagesPage from './pages/MessagesPage'
import QuizListPage from './pages/QuizListPage'
import QuizPage from './pages/QuizPage'

function App() {
  return (
    <MobileLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discovery" element={<DiscoveryPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/quizzes" element={<QuizListPage />} />
        <Route path="/quiz/:quizId" element={<QuizPage />} />
      </Routes>
    </MobileLayout>
  )
}

export default App

