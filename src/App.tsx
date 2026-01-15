import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppBridgeProvider } from './providers/AppBridgeProvider';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { WaitlistPage } from './pages/WaitlistPage';

function App() {
  return (
    <BrowserRouter>
      <AppBridgeProvider>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/waitlist/:productId" element={<WaitlistPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppBridgeProvider>
    </BrowserRouter>
  );
}

export default App;

