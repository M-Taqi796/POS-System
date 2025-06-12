import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Mock Firebase
vi.mock('../config/firebase', () => ({
  auth: {},
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));

// Wrapper component to provide router context
const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('Login Page (Sign In & Sign Up)', () => {
  const setUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login form with email and password fields', () => {
    renderWithRouter(<Login setUser={setUser} />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('successfully signs in with valid credentials', async () => {
    const user = userEvent.setup();
    const mockUser = { email: 'test@example.com' };
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
    
    renderWithRouter(<Login setUser={setUser} />);
    
    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
      expect(setUser).toHaveBeenCalledWith(mockUser);
    });
  });

  test('handles sign in error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Firebase: Error (auth/wrong-password).';
    signInWithEmailAndPassword.mockRejectedValueOnce({ message: errorMessage });
    
    renderWithRouter(<Login setUser={setUser} />);
    
    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('can toggle between sign in and sign up forms', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login setUser={setUser} />);
    
    // Initial state - Sign in form
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    
    // Toggle to sign up
    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign up" }));
    expect(screen.getByText('Create a new account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    
    // Toggle back to sign in
    await user.click(screen.getByRole('button', { name: 'Already have an account? Sign in' }));
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('successfully signs up with valid credentials', async () => {
    const user = userEvent.setup();
    const mockUser = { email: 'newuser@example.com' };
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
    
    renderWithRouter(<Login setUser={setUser} />);
    
    // Toggle to sign up
    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign up" }));
    
    await user.type(screen.getByPlaceholderText('Email address'), 'newuser@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'newpassword');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));
    
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'newuser@example.com', 'newpassword');
      expect(setUser).toHaveBeenCalledWith(mockUser);
    });
  });

  test('handles sign up error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Firebase: Error (auth/email-already-in-use).';
    createUserWithEmailAndPassword.mockRejectedValueOnce({ message: errorMessage });
    
    renderWithRouter(<Login setUser={setUser} />);
    
    // Toggle to sign up
    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign up" }));
    
    await user.type(screen.getByPlaceholderText('Email address'), 'existing@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
}); 