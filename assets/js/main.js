// Main JavaScript for MakanEnak

class MakanEnak {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initMap();
        this.bindEvents();
        await this.loadFoodDonations();
    }

    // Authentication Methods
    async checkAuth() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            this.currentUser = user;
            
            if (user) {
                this.updateUIForAuthenticatedUser();
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    updateUIForAuthenticatedUser() {
        // Update navigation for authenticated users
        const authButtons = document.querySelector('.navbar-nav');
        if (authButtons && this.currentUser) {
            authButtons.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle"></i> ${this.currentUser.email}
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="pages/dashboard/dashboard.html">Dashboard</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="makanEnak.logout()">Logout</a></li>
                    </ul>
                </li>
            `;
        }
    }

    async logout() {
        try {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Map Methods
    initMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView([DEFAULT_LAT, DEFAULT_LNG], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Get user location
        this.getUserLocation();
    }

    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // Center map on user location
                    this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
                    
                    // Add user location marker
                    L.marker([this.userLocation.lat, this.userLocation.lng])
                        .addTo(this.map)
                        .bindPopup('Lokasi Anda')
                        .openPopup();
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.showAlert('Tidak dapat mengakses lokasi. Menggunakan lokasi default.', 'warning');
                }
            );
        }
    }

    // Food Donation Methods
    async loadFoodDonations() {
        try {
            const { data: donations, error } = await supabase
                .from(TABLES.FOOD_DONATIONS)
                .select(`
                    *,
                    users (
                        full_name,
                        phone
                    )
                `)
                .eq('status', FOOD_STATUS.AVAILABLE);

            if (error) throw error;

            this.displayFoodDonationsOnMap(donations);
        } catch (error) {
            console.error('Error loading food donations:', error);
        }
    }

    displayFoodDonationsOnMap(donations) {
        if (!this.map || !donations) return;

        donations.forEach(donation => {
            if (donation.latitude && donation.longitude) {
                const marker = L.marker([donation.latitude, donation.longitude])
                    .addTo(this.map);

                const popupContent = `
                    <div class="donation-popup">
                        <h6>${donation.food_name}</h6>
                        <p><strong>Jumlah:</strong> ${donation.quantity}</p>
                        <p><strong>Expired:</strong> ${new Date(donation.expiry_date).toLocaleDateString('id-ID')}</p>
                        <p><strong>Donor:</strong> ${donation.users?.full_name || 'Anonymous'}</p>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-primary" onclick="makanEnak.requestFood(${donation.id})">
                                Request
                            </button>
                            <button class="btn btn-sm btn-info" onclick="makanEnak.showDirections(${donation.latitude}, ${donation.longitude})">
                                Arah
                            </button>
                        </div>
                    </div>
                `;

                marker.bindPopup(popupContent);
            }
        });
    }

    async requestFood(donationId) {
        if (!this.currentUser) {
            this.showAlert('Silakan login terlebih dahulu', 'warning');
            window.location.href = 'pages/auth/login.html';
            return;
        }

        try {
            const { data, error } = await supabase
                .from(TABLES.DONATION_REQUESTS)
                .insert([
                    {
                        donation_id: donationId,
                        recipient_id: this.currentUser.id,
                        status: 'pending',
                        requested_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;

            this.showAlert('Request berhasil dikirim!', 'success');
        } catch (error) {
            console.error('Error requesting food:', error);
            this.showAlert('Gagal mengirim request', 'danger');
        }
    }

    showDirections(lat, lng) {
        if (this.userLocation) {
            const url = `https://www.google.com/maps/dir/${this.userLocation.lat},${this.userLocation.lng}/${lat},${lng}`;
            window.open(url, '_blank');
        } else {
            this.showAlert('Lokasi Anda belum terdeteksi', 'warning');
        }
    }

    // Utility Methods
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of body
        document.body.insertBefore(alertDiv, document.body.firstChild);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI/180);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Event Binding
    bindEvents() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if map element exists (homepage)
    if (document.getElementById('map')) {
        window.makanEnak = new MakanEnak();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MakanEnak;
}
