import React, { useState, useRef } from 'react';
import axios from 'axios';

const EnhancedRegistrationForm = () => {
  // Initial empty form state - completely fresh data
  const getInitialFormData = () => ({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    occupation: '',
    company: '',
    website: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    newsletter_subscription: false,
    terms_accepted: false
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Complete form reset function
  const resetForm = () => {
    setFormData(getInitialFormData());
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    setErrors({});
    setMessage({ type: '', text: '' });
    setIsSubmitting(false);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear message
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  // Handle profile photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          profile_photo: 'Only JPEG, PNG, GIF, and WebP files are allowed'
        }));
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profile_photo: 'File size must be less than 5MB'
        }));
        return;
      }
      
      setProfilePhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous error
      setErrors(prev => ({
        ...prev,
        profile_photo: ''
      }));
    }
  };

  // Remove profile photo
  const removePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Password confirmation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    // Terms acceptance
    if (!formData.terms_accepted) {
      newErrors.terms_accepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({
        type: 'error',
        text: 'Please fix the errors below and try again.'
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add profile photo if selected
      if (profilePhoto) {
        submitData.append('profile_photo', profilePhoto);
      }

      console.log('🚀 Submitting registration data...');
      console.log('📍 API URL:', 'http://localhost:5000/api/users/register');
      console.log('📦 Form Data keys:', Array.from(submitData.keys()));

      const response = await axios.post(
        'http://localhost:5000/api/users/register',
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 15000
        }
      );

      console.log('Registration response:', response.data);

      if (response.data.success) {
        // Create detailed success message for Express backend
        const userData = response.data.data;
        const successMessage = `
          🎉 SUCCESSFULLY REGISTERED! 🎉
          
          👤 Name: ${userData.name}
          📧 Email: ${userData.email}
          🆔 User ID: ${userData.user_id}
          📅 Registration Date: ${new Date(userData.registration_date).toLocaleString()}
          💾 Stored in MongoDB database
          🔒 Password encrypted with bcrypt
          ${userData.profile_photo_url ? '📸 Profile photo uploaded successfully!' : ''}
          ✨ Status: ${userData.status}
        `;
        
        setMessage({
          type: 'success',
          text: successMessage.trim()
        });
        
        // Complete form reset - fresh clean form
        resetForm();
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Registration failed'
        });
      }

    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      if (error.response) {
        console.error('📊 Response status:', error.response.status);
        console.error('📝 Response data:', error.response.data);
        console.error('🔧 Response headers:', error.response.headers);
      }
      
      if (error.request) {
        console.error('📡 Request details:', error.request);
      }
      
      let errorMessage = 'Registration failed. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timeout. Please try again.';
        console.error('⏰ REQUEST TIMEOUT - Server took too long to respond');
      } else if (error.response) {
        errorMessage += error.response.data?.message || `Server error: ${error.response.status}`;
        console.error('🔴 SERVER ERROR - Got response but with error status');
      } else if (error.request) {
        errorMessage += 'Network error. Please ensure XAMPP is running and try again.';
        console.error('🌐 NETWORK ERROR - No response received from server');
        console.error('💡 This could be: XAMPP not running, firewall blocking, wrong URL, or CORS issue');
      } else {
        errorMessage += error.message;
        console.error('⚠️ OTHER ERROR - Something else went wrong');
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    pageWrapper: {
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, 
          rgba(74, 144, 226, 0.9) 0%, 
          rgba(142, 68, 173, 0.9) 25%, 
          rgba(52, 152, 219, 0.9) 50%, 
          rgba(155, 89, 182, 0.9) 75%, 
          rgba(26, 188, 156, 0.9) 100%
        ),
        url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>')
      `,
      backgroundSize: 'cover, 50px 50px',
      backgroundAttachment: 'fixed',
      padding: '40px 20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      position: 'relative'
    },
    title: {
      textAlign: 'center',
      color: '#ffffff',
      marginBottom: '40px',
      fontSize: '3.5rem',
      fontWeight: '700',
      textShadow: '0 4px 8px rgba(0,0,0,0.3)',
      letterSpacing: '2px',
      background: 'linear-gradient(45deg, #fff, #e0e0e0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      animation: 'titleGlow 3s ease-in-out infinite alternate'
    },
    subtitle: {
      textAlign: 'center',
      color: 'rgba(255,255,255,0.9)',
      marginBottom: '50px',
      fontSize: '1.3rem',
      fontWeight: '300',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    form: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: '50px',
      borderRadius: '25px',
      boxShadow: `
        0 25px 50px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.6)
      `,
      border: '1px solid rgba(255, 255, 255, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    },
    formBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(circle at 20% 20%, rgba(74, 144, 226, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(142, 68, 173, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 60%, rgba(26, 188, 156, 0.1) 0%, transparent 50%)
      `,
      zIndex: -1
    },
    section: {
      marginBottom: '35px',
      position: 'relative'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: '3px solid',
      borderImage: 'linear-gradient(90deg, #4a90e2, #8e44ad, #1abc9c) 1',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    row: {
      display: 'flex',
      gap: '25px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    inputGroup: {
      flex: 1,
      minWidth: '280px',
      position: 'relative'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#34495e',
      fontSize: '0.95rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '15px 20px',
      border: '2px solid #e0e6ed',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxSizing: 'border-box',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      zIndex: 1
    },
    inputFocus: {
      borderColor: '#4a90e2',
      outline: 'none',
      boxShadow: '0 0 0 4px rgba(74, 144, 226, 0.1), 0 8px 25px rgba(74, 144, 226, 0.15)',
      transform: 'translateY(-2px)'
    },
    inputError: {
      borderColor: '#e74c3c',
      backgroundColor: 'rgba(231, 76, 60, 0.05)'
    },
    select: {
      width: '100%',
      padding: '15px 20px',
      border: '2px solid #e0e6ed',
      borderRadius: '12px',
      fontSize: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '15px 20px',
      border: '2px solid #e0e6ed',
      borderRadius: '12px',
      fontSize: '16px',
      minHeight: '100px',
      resize: 'vertical',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    photoSection: {
      textAlign: 'center',
      padding: '40px',
      border: '3px dashed #bdc3c7',
      borderRadius: '20px',
      backgroundColor: 'rgba(236, 240, 241, 0.5)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    photoSectionHover: {
      borderColor: '#4a90e2',
      backgroundColor: 'rgba(74, 144, 226, 0.05)',
      transform: 'scale(1.02)'
    },
    photoPreview: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '5px solid #4a90e2',
      marginBottom: '20px',
      boxShadow: '0 10px 30px rgba(74, 144, 226, 0.3)',
      transition: 'all 0.3s ease'
    },
    photoButton: {
      background: 'linear-gradient(135deg, #4a90e2, #357abd)',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '50px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      marginRight: '15px',
      transition: 'all 0.3s ease',
      boxShadow: '0 5px 15px rgba(74, 144, 226, 0.4)',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    removeButton: {
      background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '50px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 5px 15px rgba(231, 76, 60, 0.4)',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: '10px',
      border: '1px solid rgba(0,0,0,0.1)'
    },
    checkbox: {
      width: '20px',
      height: '20px',
      accentColor: '#4a90e2'
    },
    error: {
      color: '#e74c3c',
      fontSize: '14px',
      marginTop: '8px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    message: {
      padding: '20px',
      borderRadius: '15px',
      marginBottom: '30px',
      textAlign: 'center',
      fontWeight: '600',
      fontSize: '16px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(10px)'
    },
    successMessage: {
      backgroundColor: 'rgba(39, 174, 96, 0.15)',
      color: '#27ae60',
      border: '2px solid rgba(39, 174, 96, 0.3)',
      whiteSpace: 'pre-line',
      textAlign: 'left',
      fontSize: '14px',
      lineHeight: '1.6'
    },
    errorMessage: {
      backgroundColor: 'rgba(231, 76, 60, 0.15)',
      color: '#e74c3c',
      border: '2px solid rgba(231, 76, 60, 0.3)'
    },
    submitButton: {
      flex: '1',
      background: 'linear-gradient(135deg, #4a90e2, #357abd, #1abc9c)',
      color: 'white',
      border: 'none',
      padding: '20px',
      borderRadius: '15px',
      fontSize: '18px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(74, 144, 226, 0.4)'
    },
    submitButtonHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 15px 40px rgba(74, 144, 226, 0.6)'
    },
    submitButtonDisabled: {
      background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: '0 5px 15px rgba(149, 165, 166, 0.3)'
    },
    buttonContainer: {
      display: 'flex',
      gap: '15px',
      width: '100%'
    },
    clearButton: {
      flex: '0 0 auto',
      background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
      color: 'white',
      border: 'none',
      padding: '20px 30px',
      borderRadius: '15px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      boxShadow: '0 5px 15px rgba(231, 76, 60, 0.3)',
      whiteSpace: 'nowrap'
    },
    hiddenInput: {
      display: 'none'
    },
    floatingElements: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: -1
    },
    floatingCircle: {
      position: 'absolute',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.1)',
      animation: 'float 6s ease-in-out infinite'
    }
  };

  // Add CSS animations
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @keyframes titleGlow {
      0% { text-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2); }
      100% { text-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 30px rgba(255,255,255,0.4); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-20px) rotate(120deg); }
      66% { transform: translateY(10px) rotate(240deg); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .submit-button:hover {
      animation: pulse 1s infinite;
    }
    
    @media (max-width: 768px) {
      .form-container {
        padding: 20px !important;
        margin: 20px !important;
      }
      
      .title {
        font-size: 2.5rem !important;
      }
      
      .row {
        flex-direction: column !important;
      }
      
      .input-group {
        min-width: 100% !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div style={styles.pageWrapper}>
      {/* Floating Background Elements */}
      <div style={styles.floatingElements}>
        <div style={{
          ...styles.floatingCircle,
          width: '100px',
          height: '100px',
          top: '10%',
          left: '10%',
          animationDelay: '0s'
        }}></div>
        <div style={{
          ...styles.floatingCircle,
          width: '150px',
          height: '150px',
          top: '60%',
          right: '10%',
          animationDelay: '2s'
        }}></div>
        <div style={{
          ...styles.floatingCircle,
          width: '80px',
          height: '80px',
          bottom: '20%',
          left: '20%',
          animationDelay: '4s'
        }}></div>
      </div>

      <div style={styles.container}>
        <h1 style={styles.title}>✨ PREMIUM REGISTRATION ✨</h1>
        <p style={styles.subtitle}>
          Join our exclusive community with enhanced profile features and secure data management
        </p>
        
        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
          }}>
            {message.text}
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          style={styles.form} 
          className="form-container"
          autoComplete="off"
          noValidate
        >
          <div style={styles.formBackground}></div>
          
          {/* Profile Photo Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              📸 Profile Photo
            </h3>
            <div style={styles.photoSection}>
              {profilePhotoPreview ? (
                <div>
                  <img src={profilePhotoPreview} alt="Profile Preview" style={styles.photoPreview} />
                  <br />
                  <button type="button" onClick={removePhoto} style={styles.removeButton}>
                    🗑️ Remove Photo
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📷</div>
                  <p style={{ fontSize: '1.1rem', color: '#7f8c8d', margin: '10px 0' }}>
                    Upload your profile photo to personalize your account
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={styles.photoButton}
                  >
                    📁 Choose Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={styles.hiddenInput}
                  />
                </div>
              )}
              {errors.profile_photo && <div style={styles.error}>⚠️ {errors.profile_photo}</div>}
            </div>
          </div>

          {/* Personal Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              👤 Personal Information
            </h3>
            
            <div style={styles.row} className="row">
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.name ? styles.inputError : {})
                  }}
                  placeholder="Enter your full name"
                />
                {errors.name && <div style={styles.error}>⚠️ {errors.name}</div>}
              </div>
              
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.email ? styles.inputError : {})
                  }}
                  placeholder="Enter your email address"
                />
                {errors.email && <div style={styles.error}>⚠️ {errors.email}</div>}
              </div>
            </div>

            <div style={styles.row} className="row">
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.password ? styles.inputError : {})
                  }}
                  placeholder="Create a secure password (min 6 characters)"
                />
                {errors.password && <div style={styles.error}>⚠️ {errors.password}</div>}
              </div>
              
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.confirmPassword ? styles.inputError : {})
                  }}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <div style={styles.error}>⚠️ {errors.confirmPassword}</div>}
              </div>
            </div>

            <div style={styles.row} className="row">
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(errors.phone ? styles.inputError : {})
                  }}
                  placeholder="Enter your phone number"
                />
                {errors.phone && <div style={styles.error}>⚠️ {errors.phone}</div>}
              </div>
              
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row} className="row">
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              🏠 Address Information
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Full Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Enter your complete address"
              />
            </div>

            <div style={styles.row} className="row">
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your city"
                />
              </div>
              
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your state/province"
                />
              </div>
            </div>

            <div style={styles.row} className="row">
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter postal code"
                />
              </div>
              
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your country"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              💼 Professional Information
            </h3>
            
            <div style={styles.row} className="row">
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your occupation"
                />
              </div>
              
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your company name"
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your website URL (https://example.com)"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              🚨 Emergency Contact
            </h3>
            
            <div style={styles.row} className="row">
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter emergency contact name"
                />
              </div>
              
              <div style={styles.inputGroup} className="input-group">
                <label style={styles.label}>Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter emergency contact phone"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              ⚙️ Preferences
            </h3>
            
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="newsletter_subscription"
                checked={formData.newsletter_subscription}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <label>📧 Subscribe to newsletter for updates and exclusive offers</label>
            </div>

            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="terms_accepted"
                checked={formData.terms_accepted}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <label>📋 I accept the terms and conditions *</label>
            </div>
            {errors.terms_accepted && <div style={styles.error}>⚠️ {errors.terms_accepted}</div>}
          </div>

          <div style={styles.buttonContainer}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-button"
              style={{
                ...styles.submitButton,
                ...(isSubmitting ? styles.submitButtonDisabled : {})
              }}
            >
              {isSubmitting ? '⏳ REGISTERING...' : '🚀 REGISTER NOW'}
            </button>
            
            <button
              type="button"
              onClick={resetForm}
              className="clear-button"
              style={styles.clearButton}
              disabled={isSubmitting}
            >
              🧹 CLEAR FORM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedRegistrationForm;
