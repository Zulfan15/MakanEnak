# MakanEnak - Platform Donasi Makanan

![MakanEnak Logo](https://via.placeholder.com/150x50/28a745/white?text=MakanEnak)

## 📋 Deskripsi Project

**MakanEnak** adalah platform web yang menghubungkan donor makanan (individu, restoran, atau toko) dengan penerima (individu atau komunitas) dalam radius 5 km menggunakan peta interaktif. Platform ini memfasilitasi donasi makanan, memastikan keamanan pangan melalui verifikasi admin, dan mempromosikan dampak sosial melalui transparansi dan keterlibatan komunitas.

## 🎯 Fitur Utama

### 👥 Multi-Role System
- **Donor**: Individu, restoran, atau toko yang ingin mendonasikan makanan
- **Recipient**: Individu atau komunitas yang membutuhkan makanan
- **Admin**: Mengelola dan memverifikasi donasi untuk keamanan pangan

### 🗺️ Peta Interaktif
- Pencarian donasi dalam radius 5 km
- Geolocation untuk deteksi lokasi otomatis
- Marker interaktif untuk setiap donasi
- Navigasi ke lokasi pengambilan

### 🔐 Keamanan & Verifikasi
- Autentikasi pengguna dengan Supabase Auth
- Verifikasi admin untuk keamanan pangan
- Upload foto makanan untuk transparansi
- Sistem rating dan feedback

### 📱 Responsive Design
- Design mobile-first
- Bootstrap 5 untuk styling
- User experience yang optimal di semua device

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Struktur website
- **CSS3** - Styling dengan custom variables
- **JavaScript (ES6+)** - Interaktivitas dan logika
- **Bootstrap 5** - Framework CSS responsif
- **Leaflet.js** - Peta interaktif
- **Bootstrap Icons** - Icon library

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - File storage
  - Row Level Security (RLS)

### Hosting & Deployment
- **GitHub Pages** - Static site hosting
- **GitHub Actions** - CI/CD pipeline (optional)

## 📂 Struktur Project

```
Project1/
├── .github/
│   └── copilot-instructions.md
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── main.js
│       ├── auth.js
│       └── dashboard.js
├── pages/
│   ├── auth/
│   │   ├── login.html
│   │   ├── register.html
│   │   └── forgot-password.html
│   ├── dashboard/
│   │   ├── donor-dashboard.html
│   │   ├── recipient-dashboard.html
│   │   └── admin-dashboard.html
│   └── legal/
│       ├── terms.html
│       └── privacy.html
├── index.html
└── README.md
```

## 🚀 Setup & Installation

### 1. Clone Repository
```bash
git clone https://github.com/username/makanenak.git
cd makanenak
```

### 2. Setup Supabase

1. Buat project di [Supabase](https://supabase.com)
2. Copy project URL dan anon key
3. Update `assets/js/config.js`:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Database Schema

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    phone VARCHAR,
    address TEXT,
    role VARCHAR CHECK (role IN ('donor', 'recipient', 'admin')) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Food donations table
CREATE TABLE food_donations (
    id SERIAL PRIMARY KEY,
    donor_id UUID REFERENCES users(id) NOT NULL,
    food_name VARCHAR NOT NULL,
    description TEXT,
    quantity VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_time_start TIME NOT NULL,
    pickup_time_end TIME NOT NULL,
    contact_info TEXT,
    image_url TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    status VARCHAR CHECK (status IN ('available', 'pending', 'completed', 'expired')) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Donation requests table
CREATE TABLE donation_requests (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER REFERENCES food_donations(id) NOT NULL,
    recipient_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
    message TEXT,
    requested_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view available donations" ON food_donations FOR SELECT USING (status = 'available');
CREATE POLICY "Donors can manage own donations" ON food_donations FOR ALL USING (auth.uid() = donor_id);

CREATE POLICY "Users can view own requests" ON donation_requests FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = (SELECT donor_id FROM food_donations WHERE id = donation_id));
CREATE POLICY "Recipients can create requests" ON donation_requests FOR INSERT WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
```

### 4. Storage Setup

1. Buat bucket `images` di Supabase Storage
2. Set bucket sebagai public
3. Buat policy untuk upload:
```sql
CREATE POLICY "Users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
```

### 5. Deploy ke GitHub Pages

1. Push code ke GitHub repository
2. Ke repository Settings > Pages
3. Pilih source: Deploy from a branch
4. Pilih branch: main
5. Website akan tersedia di: `https://username.github.io/repository-name`

## 📖 Cara Penggunaan

### Untuk Donor
1. Daftar sebagai donor
2. Login ke dashboard
3. Tambah donasi makanan dengan detail lengkap
4. Upload foto makanan
5. Tunggu permintaan dari penerima
6. Approve/reject permintaan
7. Koordinasi pengambilan makanan

### Untuk Penerima
1. Daftar sebagai penerima  
2. Browse donasi tersedia di peta
3. Request donasi yang diinginkan
4. Tunggu approval dari donor
5. Ambil makanan sesuai jadwal

### Untuk Admin
1. Login dengan akun admin
2. Monitor semua donasi
3. Verifikasi keamanan pangan
4. Kelola user dan reports
5. Pantau statistik platform

## 🔧 Konfigurasi

### Environment Variables (config.js)
```javascript
// Update dengan kredensial Supabase Anda
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Konfigurasi peta
const DEFAULT_LAT = -6.2088; // Jakarta
const DEFAULT_LNG = 106.8456;
const SEARCH_RADIUS_KM = 5;
```

### Customization
- Edit `assets/css/style.css` untuk mengubah tema
- Modify `assets/js/config.js` untuk konfigurasi
- Update favicon dan logo di folder `assets/images/`

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan MIT License. Lihat file `LICENSE` untuk detail.

## 👥 Tim Pengembang

- **Developer** - [Your Name](https://github.com/username)
- **UI/UX Designer** - [Designer Name](https://github.com/username)

## 📞 Kontak & Support

- **Email**: info@makanenak.com
- **Website**: [makanenak.github.io](https://makanenak.github.io)
- **Issues**: [GitHub Issues](https://github.com/username/makanenak/issues)

## 🚀 Roadmap

### Phase 1 (Current)
- [x] Basic authentication
- [x] Food donation CRUD
- [x] Interactive map
- [x] Request system

### Phase 2 (Next)
- [ ] Real-time notifications
- [ ] Chat system
- [ ] Mobile app (React Native)
- [ ] Advanced analytics

### Phase 3 (Future)
- [ ] AI-powered food recognition
- [ ] Blockchain for transparency
- [ ] Multi-language support
- [ ] Integration with food banks

## 📊 Statistics

- **Total Donors**: 0
- **Total Recipients**: 0  
- **Food Donated**: 0 kg
- **Communities Served**: 0

---

**Made with ❤️ for the community**

*Mari bersama mengurangi food waste dan membantu sesama melalui MakanEnak!*
#   M a k a n E n a k  
 