// Authentication JavaScript for MakanEnak

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkURLParams();
    }

    // Event Binding
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }

        // Password confirmation validation
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', this.validatePasswordMatch.bind(this));
        }
    }

    // Check URL parameters for role selection
    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const role = urlParams.get('role');
        
        if (role && (role === 'donor' || role === 'recipient')) {
            const roleInput = document.getElementById(role + 'Role');
            if (roleInput) {
                roleInput.checked = true;
            }
        }
    }

    // Login Handler
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        this.showLoading('login');
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Get user profile
            const { data: profile, error: profileError } = await supabase
                .from(TABLES.USERS)
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) throw profileError;

            // Redirect based on role
            this.redirectAfterLogin(profile.role);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert(error.message, 'danger');
        } finally {
            this.hideLoading('login');
        }
    }

    // Register Handler
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = this.getRegisterFormData();
        
        if (!this.validateRegisterForm(formData)) {
            return;
        }
        
        this.showLoading('register');
        
        try {
            // Sign up user
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: `${formData.firstName} ${formData.lastName}`,
                        role: formData.role
                    }
                }
            });

            if (error) throw error;

            // Create user profile
            const { error: profileError } = await supabase
                .from(TABLES.USERS)
                .insert([
                    {
                        id: data.user.id,
                        email: formData.email,
                        full_name: `${formData.firstName} ${formData.lastName}`,
                        phone: formData.phone,
                        address: formData.address,
                        role: formData.role,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (profileError) throw profileError;

            this.showAlert('Registrasi berhasil! Silakan cek email untuk verifikasi.', 'success');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            
        } catch (error) {
            console.error('Register error:', error);
            this.showAlert(error.message, 'danger');
        } finally {
            this.hideLoading('register');
        }
    }

    // Get form data
    getRegisterFormData() {
        return {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            role: document.querySelector('input[name="userRole"]:checked')?.value
        };
    }

    // Validate register form
    validateRegisterForm(formData) {
        // Check if role is selected
        if (!formData.role) {
            this.showAlert('Silakan pilih peran Anda', 'warning');
            return false;
        }

        // Check password match
        if (formData.password !== formData.confirmPassword) {
            this.showAlert('Password tidak cocok', 'warning');
            return false;
        }

        // Check password length
        if (formData.password.length < 6) {
            this.showAlert('Password minimal 6 karakter', 'warning');
            return false;
        }

        return true;
    }

    // Password visibility toggle
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#togglePassword i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'bi bi-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'bi bi-eye';
        }
    }

    // Validate password match
    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.setCustomValidity('Password tidak cocok');
            confirmPasswordInput.classList.add('is-invalid');
        } else {
            confirmPasswordInput.setCustomValidity('');
            confirmPasswordInput.classList.remove('is-invalid');
        }
    }

    // Redirect after login
    redirectAfterLogin(role) {
        switch (role) {
            case USER_ROLES.ADMIN:
                window.location.href = '../dashboard/admin-dashboard.html';
                break;
            case USER_ROLES.DONOR:
                window.location.href = '../dashboard/donor-dashboard.html';
                break;
            case USER_ROLES.RECIPIENT:
                window.location.href = '../dashboard/recipient-dashboard.html';
                break;
            default:
                window.location.href = '../../index.html';
        }
    }

    // Loading states
    showLoading(type) {
        const button = document.querySelector(`button[type="submit"]`);
        const text = button.querySelector(`.${type}-text`);
        const spinner = button.querySelector(`.${type}-spinner`);
        
        if (text && spinner) {
            text.classList.add('d-none');
            spinner.classList.remove('d-none');
            button.disabled = true;
        }
    }

    hideLoading(type) {
        const button = document.querySelector(`button[type="submit"]`);
        const text = button.querySelector(`.${type}-text`);
        const spinner = button.querySelector(`.${type}-spinner`);
        
        if (text && spinner) {
            text.classList.remove('d-none');
            spinner.classList.add('d-none');
            button.disabled = false;
        }
    }

    // Show alert
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Password strength indicator
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

// Show password strength
function showPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = checkPasswordStrength(password);
        
        // Remove existing strength indicator
        const existingIndicator = document.querySelector('.password-strength');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        if (password.length > 0) {
            const strengthDiv = document.createElement('div');
            strengthDiv.className = 'password-strength mt-1';
            
            let strengthText = '';
            let strengthClass = '';
            
            switch (strength) {
                case 0:
                case 1:
                    strengthText = 'Lemah';
                    strengthClass = 'text-danger';
                    break;
                case 2:
                case 3:
                    strengthText = 'Sedang';
                    strengthClass = 'text-warning';
                    break;
                case 4:
                case 5:
                    strengthText = 'Kuat';
                    strengthClass = 'text-success';
                    break;
            }
            
            strengthDiv.innerHTML = `<small class="${strengthClass}">Kekuatan password: ${strengthText}</small>`;
            passwordInput.parentNode.appendChild(strengthDiv);
        }
    });
}

// Initialize password strength indicator
document.addEventListener('DOMContentLoaded', () => {
    showPasswordStrength();
});
