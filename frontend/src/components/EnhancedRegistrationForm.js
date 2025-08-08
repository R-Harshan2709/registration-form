import React, { useState, useRef } from 'react';
import axios from 'axios';

const EnhancedRegistrationForm = () => {
  const [formData, setFormData] = useState({
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

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

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

      console.log('Submitting registration data...');

      const response = await axios.post(
        'http://localhost/registration-form/backend/register.php',
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
        // Create detailed success message
        const successDetails = response.data.details;
        const successMessage = `
          🎉 SUCCESSFULLY REGISTERED! 🎉
          
          👤 Name: ${successDetails.name}
          📧 Email: ${successDetails.email}
          🆔 User ID: ${successDetails.user_id}
          📅 Registration Date: ${successDetails.registration_date}
          💾 ${successDetails.database_status}
          🔒 ${successDetails.password_status}
          ${successDetails.profile_photo_url ? '📸 Profile photo uploaded successfully!' : ''}
        `;
        
        setMessage({
          type: 'success',
          text: successMessage.trim()
        });
        
        // Reset form
        setFormData({
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
        
        removePhoto();
        setErrors({});
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Registration failed'
        });
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timeout. Please try again.';
      } else if (error.response) {
        errorMessage += error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'Network error. Please ensure XAMPP is running and try again.';
      } else {
        errorMessage += error.message;
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
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    title: {
      textAlign: 'center',
      color: '#333',
      marginBottom: '30px',
      fontSize: '28px',
      fontWeight: 'bold'
    },
    form: {
      backgroundColor: '#f9f9f9',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    section: {
      marginBottom: '25px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#555',
      marginBottom: '15px',
      paddingBottom: '8px',
      borderBottom: '2px solid #007bff'
    },
    row: {
      display: 'flex',
      gap: '15px',
      marginBottom: '15px',
      flexWrap: 'wrap'
    },
    inputGroup: {
      flex: 1,
      minWidth: '250px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#555'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '2px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      transition: 'border-color 0.3s',
      boxSizing: 'border-box'
    },
    inputFocus: {
      borderColor: '#007bff',
      outline: 'none'
    },
    inputError: {
      borderColor: '#dc3545'
    },
    select: {
      width: '100%',
      padding: '12px',
      border: '2px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '2px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
      boxSizing: 'border-box'
    },
    photoSection: {
      textAlign: 'center',
      padding: '20px',
      border: '2px dashed #ddd',
      borderRadius: '8px',
      backgroundColor: '#fafafa'
    },
    photoPreview: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #007bff',
      marginBottom: '15px'
    },
    photoButton: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      marginRight: '10px'
    },
    removeButton: {
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '15px'
    },
    checkbox: {
      width: '18px',
      height: '18px'
    },
    error: {
      color: '#dc3545',
      fontSize: '12px',
      marginTop: '5px'
    },
    message: {
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '20px',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    successMessage: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb',
      whiteSpace: 'pre-line',
      textAlign: 'left',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    },
    submitButton: {
      width: '100%',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '15px',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.3s'
    },
    submitButtonDisabled: {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed'
    },
    hiddenInput: {
      display: 'none'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Enhanced Registration Form</h1>
      
      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Profile Photo Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Profile Photo</h3>
          <div style={styles.photoSection}>
            {profilePhotoPreview ? (
              <div>
                <img src={profilePhotoPreview} alt="Profile Preview" style={styles.photoPreview} />
                <br />
                <button type="button" onClick={removePhoto} style={styles.removeButton}>
                  Remove Photo
                </button>
              </div>
            ) : (
              <div>
                <p>Upload your profile photo (optional)</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.photoButton}
                >
                  Choose Photo
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
            {errors.profile_photo && <div style={styles.error}>{errors.profile_photo}</div>}
          </div>
        </div>

        {/* Personal Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Personal Information</h3>
          
          <div style={styles.row}>
            <div style={styles.inputGroup}>
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
              {errors.name && <div style={styles.error}>{errors.name}</div>}
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.email ? styles.inputError : {})
                }}
                placeholder="Enter your email"
              />
              {errors.email && <div style={styles.error}>{errors.email}</div>}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
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
                placeholder="Enter password (min 6 characters)"
              />
              {errors.password && <div style={styles.error}>{errors.password}</div>}
            </div>
            
            <div style={styles.inputGroup}>
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
              {errors.confirmPassword && <div style={styles.error}>{errors.confirmPassword}</div>}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone *</label>
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
              {errors.phone && <div style={styles.error}>{errors.phone}</div>}
            </div>
            
            <div style={styles.inputGroup}>
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

          <div style={styles.row}>
            <div style={styles.inputGroup}>
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
          <h3 style={styles.sectionTitle}>Address Information</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={styles.label}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Enter your full address"
            />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
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
            
            <div style={styles.inputGroup}>
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

          <div style={styles.row}>
            <div style={styles.inputGroup}>
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
            
            <div style={styles.inputGroup}>
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
          <h3 style={styles.sectionTitle}>Professional Information</h3>
          
          <div style={styles.row}>
            <div style={styles.inputGroup}>
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
            
            <div style={styles.inputGroup}>
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

          <div style={{ marginBottom: '15px' }}>
            <label style={styles.label}>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your website URL"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Emergency Contact</h3>
          
          <div style={styles.row}>
            <div style={styles.inputGroup}>
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
            
            <div style={styles.inputGroup}>
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
          <h3 style={styles.sectionTitle}>Preferences</h3>
          
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              name="newsletter_subscription"
              checked={formData.newsletter_subscription}
              onChange={handleChange}
              style={styles.checkbox}
            />
            <label>Subscribe to newsletter for updates and promotions</label>
          </div>

          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              name="terms_accepted"
              checked={formData.terms_accepted}
              onChange={handleChange}
              style={styles.checkbox}
            />
            <label>I accept the terms and conditions *</label>
          </div>
          {errors.terms_accepted && <div style={styles.error}>{errors.terms_accepted}</div>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            ...styles.submitButton,
            ...(isSubmitting ? styles.submitButtonDisabled : {})
          }}
        >
          {isSubmitting ? 'Registering...' : 'Register Now'}
        </button>
      </form>
    </div>
  );
};

export default EnhancedRegistrationForm;
