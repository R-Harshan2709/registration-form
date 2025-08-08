import React from 'react';
import EnhancedRegistrationForm from './components/EnhancedRegistrationForm';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Registration System</h1>
        <p>Complete your registration with profile photo upload</p>
      </header>
      <main>
        <EnhancedRegistrationForm />
      </main>
    </div>
  );
}

export default App;
