import { useState, useRef } from "react";
import "../styled/contact.css";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^\d{10,}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Form Data Submitted:", formData);

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact-wrapper">
      <div className="contact-container">
        <section className="contact-header">
          <h1 className="contact-title">Get In Touch</h1>
          <p className="contact-subtitle">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </section>

        <div className="contact-content">
          <section className="contact-info">
            <div className="info-card">
              <div className="info-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M391.7 330.3c-18.8-18.8-49.2-18.8-68 0l-35.1 35.1c-5.4 5.4-13 8.4-20.9 8.4-5.3 0-10.7-1.2-15.6-3.7C206 353.7 158.3 325.8 121.1 288.6c-37.2-37.2-65.1-84.8-75.8-132.8-2.5-4.9-3.7-10.3-3.7-15.6 0-7.9 3-15.5 8.4-20.9l35.1-35.1c18.8-18.8 18.8-49.2 0-68L87 32.3c-9.4-9.4-24.6-12.4-37.4-7.2C24.4 32.6 0 57 0 87.2c0 88.8 35.8 172.2 93.5 229.9 57.7 57.7 141.1 93.5 229.9 93.5 30.2 0 54.6-24.4 62.2-49.6 5.2-12.8 2.2-28-7.2-37.4l-48.7-48.7z"/>
                </svg>
              </div>
              <h3>Call Us</h3>
              <p><a href="tel:+1234567890">+1 (234) 567-890</a></p>
              <p>Available Monday - Friday, 9AM - 6PM</p>
            </div>
            <div className="info-card">
              <div className="info-icon">✉️</div>
              <h3>Email Us</h3>
              <p><a href="mailto:support@mealify.com">support@mealify.com</a></p>
              <p>We'll get back to you within 24 hours</p>
            </div>
          </section>

          <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
            {submitted && (
              <div className="success-message">
                <span className="success-icon">✓</span>
                <div>
                  <h4>Message Sent Successfully!</h4>
                  <p>Thank you for reaching out. We'll contact you soon.</p>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`form-input ${errors.name ? "input-error" : ""}`}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`form-input ${errors.email ? "input-error" : ""}`}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (234) 567-8900"
                  className={`form-input ${errors.phone ? "input-error" : ""}`}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject" className="form-label">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help?"
                className={`form-input ${errors.subject ? "input-error" : ""}`}
              />
              {errors.subject && <span className="error-message">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please share your message or feedback..."
                rows="6"
                className={`form-textarea ${errors.message ? "input-error" : ""}`}
              />
              {errors.message && <span className="error-message">{errors.message}</span>}
            </div>

            <button
              type="submit"
              className={`submit-btn ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}