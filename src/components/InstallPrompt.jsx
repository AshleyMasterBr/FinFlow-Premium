import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If already installed, hide it
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="install-prompt-overlay" onClick={() => setIsVisible(false)}>
      <div className="install-prompt-card animate-fadeInUp" onClick={e => e.stopPropagation()}>
        <button className="install-close" onClick={() => setIsVisible(false)}>×</button>
        <div className="install-icon">📲</div>
        <div className="install-content">
          <h3 className="install-title">Instale o FinFlow</h3>
          <p className="install-desc">Adicione à tela inicial do seu celular para acesso rápido e melhor experiência.</p>
        </div>
        <button className="btn btn-primary install-btn" onClick={handleInstallClick} id="install-pwa-btn">
          Instalar app
        </button>
      </div>
    </div>
  );
}
