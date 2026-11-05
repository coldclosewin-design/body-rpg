import { Navigate, Route, Routes } from 'react-router'
import { AuthGate, LoginPage } from './auth'
import { WorldProvider } from './world'
import { Layout } from './Layout'
import { TodayPage } from '@/features/today/TodayPage'
import { CharacterPage } from '@/features/character/CharacterPage'
import { SkillsPage } from '@/features/skills/SkillsPage'
import { EditorLayout } from '@/features/editor/EditorLayout'
import { EditorDomains } from '@/features/editor/EditorDomains'
import { EditorSkills } from '@/features/editor/EditorSkills'
import { EditorSeasons } from '@/features/editor/EditorSeasons'
import { EditorCharacter } from '@/features/editor/EditorCharacter'
import { EditorData } from '@/features/editor/EditorData'
import { EditorGallery } from '@/features/editor/EditorGallery'
import { FriendsPage } from '@/features/friends/FriendsPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <AuthGate>
            <WorldProvider>
              <Layout />
            </WorldProvider>
          </AuthGate>
        }
      >
        <Route index element={<TodayPage />} />
        <Route path="character" element={<CharacterPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="edit" element={<EditorLayout />}>
          <Route index element={<Navigate to="skills" replace />} />
          <Route path="domains" element={<EditorDomains />} />
          <Route path="skills" element={<EditorSkills />} />
          <Route path="seasons" element={<EditorSeasons />} />
          <Route path="character" element={<EditorCharacter />} />
          <Route path="data" element={<EditorData />} />
          <Route path="gallery" element={<EditorGallery />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
