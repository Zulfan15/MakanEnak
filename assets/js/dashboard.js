// Dashboard JavaScript for MakanEnak

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.dashboardMap = null;
        this.pickupMap = null;
        this.selectedLocation = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.bindEvents();
        this.loadUserData();
        this.initMaps();
    }

    // Authentication Check
    async checkAuth() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                window.location.href = '../auth/login.html';
                return;
            }

            this.currentUser = user;
            
            // Get user profile
            const { data: profile, error } = await supabase
                .from(TABLES.USERS)
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            
            this.currentUser.profile = profile;
            this.updateUserInfo();
            
        } catch (error) {
            console.error('Auth error:', error);
            window.location.href = '../auth/login.html';
        }
    }

    updateUserInfo() {
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement && this.currentUser) {
            userEmailElement.textContent = this.currentUser.profile.full_name || this.currentUser.email;
        }
    }

    // Event Binding
    bindEvents() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                
                // Update active state
                document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Add donation form
        const addDonationForm = document.getElementById('addDonationForm');
        if (addDonationForm) {
            addDonationForm.addEventListener('submit', this.handleAddDonation.bind(this));
        }

        // File upload preview
        const foodImage = document.getElementById('foodImage');
        if (foodImage) {
            foodImage.addEventListener('change', this.previewImage.bind(this));
        }
    }

    // Show/Hide Sections
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    async loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'donations':
                await this.loadDonations();
                break;
            case 'requests':
                await this.loadRequests();
                break;
            case 'map-view':
                this.initDashboardMap();
                break;
            case 'history':
                await this.loadHistory();
                break;
        }
    }

    // Load Dashboard Data
    async loadDashboardData() {
        try {
            // Load statistics
            await this.loadStatistics();
            await this.loadRecentActivity();
            await this.loadNotifications();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadStatistics() {
        try {
            const { data: donations, error } = await supabase
                .from(TABLES.FOOD_DONATIONS)
                .select('*')
                .eq('donor_id', this.currentUser.id);

            if (error) throw error;

            const total = donations.length;
            const active = donations.filter(d => d.status === FOOD_STATUS.AVAILABLE).length;
            const completed = donations.filter(d => d.status === FOOD_STATUS.COMPLETED).length;

            // Get pending requests
            const { data: requests, error: requestError } = await supabase
                .from(TABLES.DONATION_REQUESTS)
                .select('*')
                .in('donation_id', donations.map(d => d.id))
                .eq('status', 'pending');

            if (requestError) throw requestError;

            // Update UI
            document.getElementById('totalDonations').textContent = total;
            document.getElementById('activeDonations').textContent = active;
            document.getElementById('completedDonations').textContent = completed;
            document.getElementById('pendingRequests').textContent = requests.length;

        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    async loadRecentActivity() {
        try {
            const { data: donations, error } = await supabase
                .from(TABLES.FOOD_DONATIONS)
                .select('*')
                .eq('donor_id', this.currentUser.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            const activityContainer = document.getElementById('recentActivity');
            if (!activityContainer) return;

            if (donations.length === 0) {
                activityContainer.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-inbox display-4 text-muted"></i>
                        <p class="text-muted mt-2">Belum ada aktivitas</p>
                    </div>
                `;
                return;
            }

            const activityHTML = donations.map(donation => `
                <div class="activity-item border-bottom py-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${donation.food_name}</h6>
                            <small class="text-muted">${this.formatDate(donation.created_at)}</small>
                        </div>
                        <span class="badge ${this.getStatusBadgeClass(donation.status)}">${this.getStatusText(donation.status)}</span>
                    </div>
                </div>
            `).join('');

            activityContainer.innerHTML = activityHTML;

        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    async loadNotifications() {
        try {
            const { data: notifications, error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .select('*')
                .eq('user_id', this.currentUser.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            const notificationsContainer = document.getElementById('notifications');
            if (!notificationsContainer) return;

            if (notifications.length === 0) {
                notificationsContainer.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-bell-slash display-4 text-muted"></i>
                        <p class="text-muted mt-2">Tidak ada notifikasi</p>
                    </div>
                `;
                return;
            }

            const notificationsHTML = notifications.map(notification => `
                <div class="notification-item border-bottom py-2">
                    <p class="mb-1">${notification.message}</p>
                    <small class="text-muted">${this.formatDate(notification.created_at)}</small>
                </div>
            `).join('');

            notificationsContainer.innerHTML = notificationsHTML;

        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    // Add Donation Handler
    async handleAddDonation(e) {
        e.preventDefault();
        
        const formData = this.getAddDonationFormData();
        
        if (!this.validateDonationForm(formData)) {
            return;
        }

        try {
            // Upload image if provided
            let imageUrl = null;
            const imageFile = document.getElementById('foodImage').files[0];
            
            if (imageFile) {
                imageUrl = await this.uploadImage(imageFile);
            }

            // Get coordinates for address
            const coordinates = await this.geocodeAddress(formData.pickupAddress);

            // Insert donation
            const { data, error } = await supabase
                .from(TABLES.FOOD_DONATIONS)
                .insert([
                    {
                        donor_id: this.currentUser.id,
                        food_name: formData.foodName,
                        description: formData.description,
                        quantity: formData.quantity,
                        category: formData.category,
                        expiry_date: formData.expiryDate,
                        pickup_address: formData.pickupAddress,
                        pickup_time_start: formData.pickupTimeStart,
                        pickup_time_end: formData.pickupTimeEnd,
                        contact_info: formData.contactInfo,
                        image_url: imageUrl,
                        latitude: coordinates.lat,
                        longitude: coordinates.lng,
                        status: FOOD_STATUS.AVAILABLE,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;

            this.showAlert('Donasi berhasil ditambahkan!', 'success');
            this.resetForm();
            this.showSection('donations');

        } catch (error) {
            console.error('Error adding donation:', error);
            this.showAlert('Gagal menambahkan donasi', 'danger');
        }
    }

    getAddDonationFormData() {
        return {
            foodName: document.getElementById('foodName').value,
            description: document.getElementById('description').value,
            quantity: document.getElementById('quantity').value,
            category: document.getElementById('category').value,
            expiryDate: document.getElementById('expiryDate').value,
            pickupAddress: document.getElementById('pickupAddress').value,
            pickupTimeStart: document.getElementById('pickupTimeStart').value,
            pickupTimeEnd: document.getElementById('pickupTimeEnd').value,
            contactInfo: document.getElementById('contactInfo').value
        };
    }

    validateDonationForm(formData) {
        // Basic validation
        if (!formData.foodName || !formData.quantity || !formData.expiryDate) {
            this.showAlert('Mohon lengkapi field yang wajib diisi', 'warning');
            return false;
        }

        // Check expiry date
        const expiryDate = new Date(formData.expiryDate);
        const now = new Date();
        
        if (expiryDate <= now) {
            this.showAlert('Tanggal kadaluarsa harus di masa depan', 'warning');
            return false;
        }

        return true;
    }

    // Image Upload
    async uploadImage(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `food-images/${fileName}`;

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return publicUrl;

        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    // Geocoding
    async geocodeAddress(address) {
        // For demo purposes, return default coordinates
        // In production, use a geocoding service like Nominatim or Google Maps
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
            const data = await response.json();
            
            if (data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }

        // Return default coordinates if geocoding fails
        return {
            lat: DEFAULT_LAT,
            lng: DEFAULT_LNG
        };
    }

    // Maps
    initMaps() {
        // Initialize dashboard map when needed
        setTimeout(() => {
            this.initDashboardMap();
        }, 1000);
    }

    initDashboardMap() {
        const mapElement = document.getElementById('dashboardMap');
        if (!mapElement || this.dashboardMap) return;

        this.dashboardMap = L.map('dashboardMap').setView([DEFAULT_LAT, DEFAULT_LNG], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.dashboardMap);

        // Load user's donations on map
        this.loadDonationsOnMap();
    }

    async loadDonationsOnMap() {
        if (!this.dashboardMap) return;

        try {
            const { data: donations, error } = await supabase
                .from(TABLES.FOOD_DONATIONS)
                .select('*')
                .eq('donor_id', this.currentUser.id)
                .not('latitude', 'is', null);

            if (error) throw error;

            donations.forEach(donation => {
                const marker = L.marker([donation.latitude, donation.longitude])
                    .addTo(this.dashboardMap);

                const popupContent = `
                    <div class="donation-popup">
                        <h6>${donation.food_name}</h6>
                        <p><strong>Status:</strong> ${this.getStatusText(donation.status)}</p>
                        <p><strong>Quantity:</strong> ${donation.quantity}</p>
                    </div>
                `;

                marker.bindPopup(popupContent);
            });

        } catch (error) {
            console.error('Error loading donations on map:', error);
        }
    }

    // Utility Methods
    getStatusBadgeClass(status) {
        switch (status) {
            case FOOD_STATUS.AVAILABLE:
                return 'bg-success';
            case FOOD_STATUS.PENDING:
                return 'bg-warning';
            case FOOD_STATUS.COMPLETED:
                return 'bg-primary';
            case FOOD_STATUS.EXPIRED:
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }

    getStatusText(status) {
        switch (status) {
            case FOOD_STATUS.AVAILABLE:
                return 'Tersedia';
            case FOOD_STATUS.PENDING:
                return 'Pending';
            case FOOD_STATUS.COMPLETED:
                return 'Selesai';
            case FOOD_STATUS.EXPIRED:
                return 'Kadaluarsa';
            default:
                return 'Unknown';
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    resetForm() {
        const form = document.getElementById('addDonationForm');
        if (form) {
            form.reset();
        }
    }

    // Load other data methods (to be implemented)
    async loadDonations() {
        // Implementation for loading donations list
    }

    async loadRequests() {
        // Implementation for loading donation requests
    }

    async loadHistory() {
        // Implementation for loading donation history
    }

    async loadUserData() {
        // Load initial user-specific data
    }
}

// Global functions
function logout() {
    supabase.auth.signOut().then(() => {
        window.location.href = '../../index.html';
    });
}

function showSection(sectionId) {
    if (window.dashboardManager) {
        window.dashboardManager.showSection(sectionId);
    }
}

function resetForm() {
    if (window.dashboardManager) {
        window.dashboardManager.resetForm();
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Reverse geocode to get address
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    
                    if (data.display_name) {
                        document.getElementById('pickupAddress').value = data.display_name;
                    }
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Tidak dapat mengakses lokasi Anda');
            }
        );
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
