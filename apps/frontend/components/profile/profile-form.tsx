'use client';

import { useState, useEffect } from 'react';
import { Input, Button, Alert } from '../ui';
import { User } from '@/lib/types';
import { UpdateProfileDto } from '@/lib/profile';

interface ProfileFormProps {
  user: User;
  onSubmit: (data: UpdateProfileDto) => Promise<void>;
  isLoading?: boolean;
}

export default function ProfileForm({ user, onSubmit, isLoading = false }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters long';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters long';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
      });
      setSuccessMessage('Profile updated successfully');
      setErrors({});
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          type="text"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          error={errors.firstName}
          required
          disabled={isSubmitting || isLoading}
          placeholder="Enter your first name"
        />

        <Input
          label="Last Name"
          type="text"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          error={errors.lastName}
          required
          disabled={isSubmitting || isLoading}
          placeholder="Enter your last name"
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        required
        readOnly={true}
        disabled={isSubmitting || isLoading}
        placeholder="Enter your email address"
      />

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            });
            setErrors({});
            setSuccessMessage('');
            setErrorMessage('');
          }}
          disabled={isSubmitting || isLoading}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting || isLoading}
          disabled={isSubmitting || isLoading}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
