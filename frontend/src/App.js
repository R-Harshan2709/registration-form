import React, { useEffect } from 'react';
import AttractiveRegistrationForm from './components/AttractiveRegistrationForm';
import './App.css';

function App() {
  useEffect(() => {
    // Add dynamic particles effect
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: fixed;
        width: ${Math.random() * 6 + 2}px;
        height: ${Math.random() * 6 + 2}px;
        background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${Math.random() * 100}vw;
        top: 100vh;
        animation: floatUp ${Math.random() * 10 + 15}s linear infinite;
      `;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (document.body.contains(particle)) {
          document.body.removeChild(particle);
        }
      }, 25000);
    };

    // Create particles periodically
    const particleInterval = setInterval(createParticle, 300);
    
    // Initial burst of particles
    for (let i = 0; i < 10; i++) {
      setTimeout(createParticle, i * 100);
    }

    return () => {
      clearInterval(particleInterval);
    };
  }, []);

  return (
    <div className="App">
      <AttractiveRegistrationForm />
    </div>
  );
}

export default App;
