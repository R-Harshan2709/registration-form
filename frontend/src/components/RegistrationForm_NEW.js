import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
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

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[0-9\s\-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate date of birth if provided
    if (formData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date_of_birth)) {
      newErrors.date_of_birth = 'Please enter a valid date (YYYY-MM-DD)';
    }

    // Validate website if provided
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    // Validate emergency contact phone if provided
    if (formData.emergency_contact_phone && !/^[+]?[0-9\s\-()]{10,}$/.test(formData.emergency_contact_phone)) {
      newErrors.emergency_contact_phone = 'Please enter a valid emergency contact phone';
    }

    // Terms acceptance validation
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
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('Submitting to:', `${config.API_BASE_URL}/register.php`);
      console.log('Form data:', formData);
      
      const response = await axios.post(
        `${config.API_BASE_URL}/register.php`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('Response:', response);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Registration successful! Welcome aboard!'
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
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
        setErrors({});
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please ensure XAMPP is running and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
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
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    formCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      padding: '40px',
      width: '100%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '30px',
      color: '#1f2937',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    inputRow: {
      display: 'flex',
      gap: '16px',
    },
    inputHalf: {
      flex: 1,
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'border-color 0.2s ease',
      outline: 'none',
    },
    select: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'border-color 0.2s ease',
      outline: 'none',
      backgroundColor: 'white',
    },
    textarea: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'border-color 0.2s ease',
      outline: 'none',
      resize: 'vertical',
      minHeight: '80px',
    },
    checkbox: {
      marginRight: '8px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'flex-start',
      fontSize: '14px',
      color: '#374151',
      gap: '8px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      marginTop: '20px',
      marginBottom: '10px',
      borderBottom: '2px solid #e5e7eb',
      paddingBottom: '8px',
    },
    inputError: {
      borderColor: '#ef4444',
    },
    error: {
      color: '#ef4444',
      fontSize: '14px',
      marginTop: '4px',
    },
    button: {
      padding: '14px 20px',
      backgroundColor: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      marginTop: '10px',
    },
    buttonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: '20px',
    },
    messageSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
    },
    messageError: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h1 style={styles.title}>Create Account</h1>
        
        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Basic Information Section */}
          <div style={styles.sectionTitle}>Basic Information</div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="name" style={styles.label}>
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {})
              }}
              placeholder="Enter your full name"
            />
            {errors.name && <span style={styles.error}>{errors.name}</span>}
          </div>

          <div style={styles.inputRow}>
            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="email" style={styles.label}>
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.email ? styles.inputError : {})
                }}
                placeholder="Enter your email address"
              />
              {errors.email && <span style={styles.error}>{errors.email}</span>}
            </div>

            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="phone" style={styles.label}>
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.phone ? styles.inputError : {})
                }}
                placeholder="Enter your phone number"
              />
              {errors.phone && <span style={styles.error}>{errors.phone}</span>}
            </div>
          </div>

          <div style={styles.inputRow}>
            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="password" style={styles.label}>
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.password ? styles.inputError : {})
                }}
                placeholder="Enter your password"
              />
              {errors.password && <span style={styles.error}>{errors.password}</span>}
            </div>

            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="date_of_birth" style={styles.label}>
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.date_of_birth ? styles.inputError : {})
                }}
              />
              {errors.date_of_birth && <span style={styles.error}>{errors.date_of_birth}</span>}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="gender" style={styles.label}>
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={{
                ...styles.select,
                ...(errors.gender ? styles.inputError : {})
              }}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            {errors.gender && <span style={styles.error}>{errors.gender}</span>}
          </div>

          {/* Address Information Section */}
          <div style={styles.sectionTitle}>Address Information</div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="address" style={styles.label}>
              Street Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={{
                ...styles.textarea,
                ...(errors.address ? styles.inputError : {})
              }}
              placeholder="Enter your street address"
            />
            {errors.address && <span style={styles.error}>{errors.address}</span>}
          </div>

          <div style={styles.inputRow}>
            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="city" style={styles.label}>
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.city ? styles.inputError : {})
                }}
                placeholder="Enter your city"
              />
              {errors.city && <span style={styles.error}>{errors.city}</span>}
            </div>

            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="state" style={styles.label}>
                State/Province
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.state ? styles.inputError : {})
                }}
                placeholder="Enter your state/province"
              />
              {errors.state && <span style={styles.error}>{errors.state}</span>}
            </div>
          </div>

          <div style={styles.inputRow}>
            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="postal_code" style={styles.label}>
                Postal Code
              </label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.postal_code ? styles.inputError : {})
                }}
                placeholder="Enter your postal code"
              />
              {errors.postal_code && <span style={styles.error}>{errors.postal_code}</span>}
            </div>

            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="country" style={styles.label}>
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.country ? styles.inputError : {})
                }}
                placeholder="Enter your country"
              />
              {errors.country && <span style={styles.error}>{errors.country}</span>}
            </div>
          </div>

          {/* Professional Information Section */}
          <div style={styles.sectionTitle}>Professional Information</div>
          
          <div style={styles.inputRow}>
            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="occupation" style={styles.label}>
                Occupation
              </label>
              <input
                type="text"
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.occupation ? styles.inputError : {})
                }}
                placeholder="Enter your occupation"
              />
              {errors.occupation && <span style={styles.error}>{errors.occupation}</span>}
            </div>

            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="company" style={styles.label}>
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.company ? styles.inputError : {})
                }}
                placeholder="Enter your company name"
              />
              {errors.company && <span style={styles.error}>{errors.company}</span>}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="website" style={styles.label}>
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.website ? styles.inputError : {})
              }}
              placeholder="https://www.example.com"
            />
            {errors.website && <span style={styles.error}>{errors.website}</span>}
          </div>

          {/* Emergency Contact Section */}
          <div style={styles.sectionTitle}>Emergency Contact</div>
          
          <div style={styles.inputRow}>
            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="emergency_contact_name" style={styles.label}>
                Emergency Contact Name
              </label>
              <input
                type="text"
                id="emergency_contact_name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.emergency_contact_name ? styles.inputError : {})
                }}
                placeholder="Enter emergency contact name"
              />
              {errors.emergency_contact_name && <span style={styles.error}>{errors.emergency_contact_name}</span>}
            </div>

            <div style={{...styles.inputGroup, ...styles.inputHalf}}>
              <label htmlFor="emergency_contact_phone" style={styles.label}>
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.emergency_contact_phone ? styles.inputError : {})
                }}
                placeholder="Enter emergency contact phone"
              />
              {errors.emergency_contact_phone && <span style={styles.error}>{errors.emergency_contact_phone}</span>}
            </div>
          </div>

          {/* Preferences Section */}
          <div style={styles.sectionTitle}>Preferences</div>
          
          <div style={styles.inputGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="newsletter_subscription"
                checked={formData.newsletter_subscription}
                onChange={handleChange}
                style={styles.checkbox}
              />
              Subscribe to newsletter and updates
            </label>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="terms_accepted"
                checked={formData.terms_accepted}
                onChange={handleChange}
                style={styles.checkbox}
              />
              I accept the terms and conditions *
            </label>
            {errors.terms_accepted && <span style={styles.error}>{errors.terms_accepted}</span>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.button,
              ...(isSubmitting ? styles.buttonDisabled : {})
            }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
