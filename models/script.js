// DOM Elements
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const switchText = document.getElementById('switchText');
const switchLink = document.getElementById('switchLink');

const loginPasswordToggle = document.getElementById('loginPasswordToggle');
const signupPasswordToggle = document.getElementById('signupPasswordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

const signupPassword = document.getElementById('signupPassword');
const confirmPassword = document.getElementById('confirmPassword');
const passwordStrength = document.getElementById('passwordStrength');

let isLoginMode = true;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updatePasswordStrength();
});

function setupEventListeners() {
    loginTab.addEventListener('click', () => switchToLogin());
    signupTab.addEventListener('click', () => switchToSignup());
    switchLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode ? switchToSignup() : switchToLogin();
    });

    loginPasswordToggle?.addEventListener('click', () => togglePassword('loginPassword', loginPasswordToggle));
    signupPasswordToggle?.addEventListener('click', () => togglePassword('signupPassword', signupPasswordToggle));
    confirmPasswordToggle?.addEventListener('click', () => togglePassword('confirmPassword', confirmPasswordToggle));

    loginForm.addEventListener('submit', handleLoginSubmit);
    signupForm.addEventListener('submit', handleSignupSubmit);

    signupPassword?.addEventListener('input', updatePasswordStrength);
    confirmPassword?.addEventListener('input', validatePasswordMatch);

    setupRealTimeValidation();
}

function switchToLogin() {
    isLoginMode = true;
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    switchText.textContent = "Don't have an account?";
    switchLink.textContent = "Sign up here";
    resetForms();
}

function switchToSignup() {
    isLoginMode = false;
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    switchText.textContent = "Already have an account?";
    switchLink.textContent = "Sign in here";
    resetForms();
}

function togglePassword(inputId, toggleBtn) {
    const input = document.getElementById(inputId);
    const eyeIcon = toggleBtn.querySelector('.eye-icon');
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
    } else {
        input.type = 'password';
        eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
}

function updatePasswordStrength() {
    const password = signupPassword.value;
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    if (!password) {
        strengthFill.className = 'strength-fill';
        strengthText.textContent = 'Password strength';
        return;
    }
    const strength = calculatePasswordStrength(password);
    strengthFill.className = `strength-fill ${strength.class}`;
    strengthText.textContent = strength.text;
}

function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { class: 'weak', text: 'Weak password' };
    if (score <= 3) return { class: 'fair', text: 'Fair password' };
    if (score <= 4) return { class: 'good', text: 'Good password' };
    return { class: 'strong', text: 'Strong password' };
}

function validatePasswordMatch() {
    const password = signupPassword.value;
    const confirm = confirmPassword.value;
    if (confirm && password !== confirm) {
        showError('confirmPassword', 'Passwords do not match');
        return false;
    } else if (confirm) {
        clearError('confirmPassword');
        return true;
    }
    return true;
}

function setupRealTimeValidation() {
    ['loginEmail', 'loginPassword', 'signupEmail', 'signupPassword', 'confirmPassword', 'firstName', 'lastName'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', () => validateField(id));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) validateField(id);
            });
        }
    });
}

function validateField(id) {
    const input = document.getElementById(id);
    const value = input.value.trim();
    clearError(id);
    switch (id) {
        case 'loginEmail':
        case 'signupEmail':
            if (!value) return showError(id, 'Email is required');
            if (!isValidEmail(value)) return showError(id, 'Invalid email');
            break;
        case 'loginPassword':
        case 'signupPassword':
            if (!value) return showError(id, 'Password is required');
            if (id === 'signupPassword' && value.length < 8) return showError(id, 'Min 8 characters');
            break;
        case 'confirmPassword':
            return validatePasswordMatch();
        case 'firstName':
        case 'lastName':
            if (!value) return showError(id, `${id === 'firstName' ? 'First' : 'Last'} name is required`);
            if (value.length < 2) return showError(id, 'Must be at least 2 characters');
            break;
    }
    return true;
}

function showError(id, msg) {
    const input = document.getElementById(id);
    const error = document.getElementById(id + 'Error');
    input.classList.add('error');
    input.classList.remove('success');
    if (error) error.textContent = msg;
    return false;
}

function clearError(id) {
    const input = document.getElementById(id);
    const error = document.getElementById(id + 'Error');
    input.classList.remove('error');
    input.classList.add('success');
    if (error) error.textContent = '';
}

function resetForms() {
    loginForm.reset();
    signupForm.reset();
    document.querySelectorAll('.error-message').forEach(e => e.textContent = '');
    document.querySelectorAll('input').forEach(input => {
        input.classList.remove('error', 'success');
    });
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    if (strengthFill && strengthText) {
        strengthFill.className = 'strength-fill';
        strengthText.textContent = 'Password strength';
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    const fields = ['firstName', 'lastName', 'signupEmail', 'signupPassword', 'confirmPassword'];
    let valid = fields.every(f => validateField(f));
    const agree = document.getElementById('agreeTerms');
    if (!agree.checked) return alert('Please agree to terms');
    if (!valid) return;

    const submitBtn = e.target.querySelector('.submit-btn');
    showLoadingState(submitBtn);
    const data = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value
    };

    try {
        const res = await fetch("https://new-plant-1.onrender.com/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        hideLoadingState(submitBtn);
        if (result.success) {
            showSuccessMessage("Signup successful!");
            switchToLogin();
        } else {
            alert(result.message || "Signup failed.");
        }
    } catch (err) {
        console.error(err);
        alert("Error during signup");
        hideLoadingState(submitBtn);
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!validateField('loginEmail') || !validateField('loginPassword')) return;

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('.submit-btn');
    showLoadingState(submitBtn);

    try {
        const res = await fetch("https://new-plant-1.onrender.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const result = await res.json();
        hideLoadingState(submitBtn);
        if (result.success) {
            showSuccessMessage("Login successful!");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        } else {
            alert(result.message || "Login failed.");
        }
    } catch (err) {
        console.error(err);
        alert("Error during login");
        hideLoadingState(submitBtn);
    }
}

function showLoadingState(btn) {
    btn.classList.add('loading');
    btn.disabled = true;
}

function hideLoadingState(btn) {
    btn.classList.remove('loading');
    btn.disabled = false;
}

function showSuccessMessage(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: #16a34a; color: white;
        padding: 16px 24px; border-radius: 12px;
        box-shadow: 0 10px 25px rgba(22, 163, 74, 0.3);
        z-index: 1000; animation: slideInRight 0.3s ease-out;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}
