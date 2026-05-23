# Full Implementation Plan — Stockman App

---

## 🗂️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Laravel + Sanctum |
| Database | SQLite |
| Barcode | react-qr-barcode-scanner |
| HTTP Client | Axios |
| Routing | react-router-dom |

---

## 📁 Project Structure

```
stockman/
├── backend/          (Laravel)
│   ├── app/
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Produit.php
│   │   │   └── Emplacement.php
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── ProduitController.php
│   │   │   │   └── EmplacementController.php
│   │   │   └── Middleware/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── database.sqlite
│   └── routes/
│       └── api.php
│
└── frontend/         (React)
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Emplacements.jsx
    │   │   ├── Products.jsx
    │   │   └── Confirmation.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── SearchBar.jsx
    │   │   ├── ProductCard.jsx
    │   │   ├── EmplacementCard.jsx
    │   │   └── BarcodeScanner.jsx
    │   ├── services/
    │   │   └── api.js
    │   └── context/
    │       └── AppContext.jsx
    └── .env
```

---

## 🔧 BACKEND — Laravel

### Step 1 — Create Project
```bash
composer create-project laravel/laravel backend
cd backend
```

### Step 2 — Install Sanctum
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### Step 3 — Configure `.env`
```env
APP_NAME=Stockman
APP_URL=http://localhost:8000
DB_CONNECTION=sqlite
```

### Step 4 — Create SQLite file
```bash
touch database/database.sqlite
```

---

### Step 5 — Migrations

**users**
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('username')->unique();
    $table->string('password');
    $table->timestamps();
});
```

**emplacements**
```php
Schema::create('emplacements', function (Blueprint $table) {
    $table->id();
    $table->string('nom');
    $table->timestamps();
});
```

**produits**
```php
Schema::create('produits', function (Blueprint $table) {
    $table->id();
    $table->string('nom_produit');
    $table->string('code_produit')->unique();
    $table->foreignId('emplacement_id')
          ->nullable()
          ->constrained('emplacements')
          ->nullOnDelete();
    $table->timestamps();
});
```

```bash
php artisan migrate
```

---

### Step 6 — Models

**Emplacement.php**
```php
class Emplacement extends Model {
    protected $fillable = ['nom'];
    public function produits() {
        return $this->hasMany(Produit::class);
    }
}
```

**Produit.php**
```php
class Produit extends Model {
    protected $fillable = ['nom_produit', 'code_produit', 'emplacement_id'];
    public function emplacement() {
        return $this->belongsTo(Emplacement::class);
    }
}
```

---

### Step 7 — Seeders
```php
// DatabaseSeeder.php
public function run() {
    User::create([
        'name'     => 'Agent 1',
        'username' => 'agent1',
        'password' => bcrypt('password'),
    ]);

    Emplacement::insert([
        ['nom' => 'Zone A', 'created_at' => now(), 'updated_at' => now()],
        ['nom' => 'Zone B', 'created_at' => now(), 'updated_at' => now()],
        ['nom' => 'Zone C', 'created_at' => now(), 'updated_at' => now()],
    ]);

    Produit::insert([
        ['nom_produit' => 'Produit 1', 'code_produit' => '111111', 'emplacement_id' => 1],
        ['nom_produit' => 'Produit 2', 'code_produit' => '222222', 'emplacement_id' => 2],
        ['nom_produit' => 'Produit 3', 'code_produit' => '333333', 'emplacement_id' => null],
    ]);
}
```
```bash
php artisan db:seed
```

---

### Step 8 — Controllers

**AuthController.php**
```php
public function login(Request $request) {
    $user = User::where('username', $request->username)->first();
    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }
    $token = $user->createToken('auth_token')->plainTextToken;
    return response()->json(['token' => $token, 'user' => $user]);
}

public function logout(Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out']);
}
```

**EmplacementController.php**
```php
public function index() {
    return response()->json(Emplacement::all());
}
```

**ProduitController.php**
```php
// List all + search
public function index(Request $request) {
    $query = Produit::with('emplacement');
    if ($request->search) {
        $query->where('nom_produit', 'like', "%{$request->search}%")
              ->orWhere('code_produit', 'like', "%{$request->search}%");
    }
    return response()->json($query->get());
}

// Get by barcode
public function findByCode($code) {
    $produit = Produit::with('emplacement')
                      ->where('code_produit', $code)
                      ->first();
    if (!$produit) return response()->json(['message' => 'Produit non trouvé'], 404);
    return response()->json($produit);
}

// Assign new emplacement
public function assignEmplacement(Request $request, $id) {
    $produit = Produit::findOrFail($id);
    $produit->emplacement_id = $request->emplacement_id;
    $produit->save();
    return response()->json($produit->load('emplacement'));
}
```

---

### Step 9 — Routes `api.php`
```php
// Public
Route::post('/login', [AuthController::class, 'login']);

// Protected
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/emplacements', [EmplacementController::class, 'index']);
    Route::get('/produits', [ProduitController::class, 'index']);
    Route::get('/produits/code/{code}', [ProduitController::class, 'findByCode']);
    Route::patch('/produits/{id}/emplacement', [ProduitController::class, 'assignEmplacement']);
});
```

### Step 10 — CORS `config/cors.php`
```php
'allowed_origins' => ['http://localhost:5173'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

---

## 💻 FRONTEND — React

### Step 1 — Create Project
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### Step 2 — Install Dependencies
```bash
npm install axios react-router-dom react-qr-barcode-scanner
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3 — Axios Config `src/services/api.js`
```js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
```

### Step 4 — App Context `src/context/AppContext.jsx`
```jsx
import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser]                   = useState(null);
    const [token, setToken]                 = useState(localStorage.getItem('token'));
    const [selectedEmplacement, setSelectedEmplacement] = useState(null);
    const [selectedProduit, setSelectedProduit]         = useState(null);

    return (
        <AppContext.Provider value={{
            user, setUser,
            token, setToken,
            selectedEmplacement, setSelectedEmplacement,
            selectedProduit, setSelectedProduit,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
```

---

### Step 5 — Pages

**Login.jsx**
```jsx
- Username + password fields
- POST /api/login → save token to localStorage + context
- Redirect to /emplacements
```

**Emplacements.jsx**
```jsx
- GET /api/emplacements → display as cards
- Agent clicks one → save to context
- Redirect to /produits
```

**Products.jsx**
```jsx
- Three tabs: List | Search | Scan

  [List tab]
  - GET /api/produits → display all products
  - Shows: nom_produit, code_produit, current emplacement

  [Search tab]
  - Search bar input
  - GET /api/produits?search=xxx → live results

  [Scan tab]
  - Open camera via BarcodeScanner component
  - On scan → GET /api/produits/code/{code}
  - Found → redirect to Confirmation

- Clicking any product → redirect to Confirmation
```

**Confirmation.jsx**
```jsx
- Shows:
  - nom_produit
  - code_produit
  - Nouvel emplacement (from context)
- Confirm button → PATCH /api/produits/{id}/emplacement
- Success → show message + back to /produits
- Error → show error message
```

---

### Step 6 — Key Components

**BarcodeScanner.jsx**
```jsx
import { BarcodeScanner } from 'react-qr-barcode-scanner';

export default function Scanner({ onScan }) {
    return (
        <BarcodeScanner
            width={400}
            height={300}
            onUpdate={(err, result) => {
                if (result) onScan(result.getText());
            }}
        />
    );
}
```

**SearchBar.jsx**
```jsx
- Controlled input
- Calls onChange prop on every keystroke
- Debounced 300ms to avoid too many API calls
```

---

### Step 7 — Routing `App.jsx`
```jsx
<Routes>
    <Route path="/"              element={<Login />} />
    <Route path="/emplacements"  element={<PrivateRoute><Emplacements /></PrivateRoute>} />
    <Route path="/produits"      element={<PrivateRoute><Products /></PrivateRoute>} />
    <Route path="/confirmation"  element={<PrivateRoute><Confirmation /></PrivateRoute>} />
</Routes>
```

---

## 🔄 Full App Flow

```
Login
  └── POST /api/login ✅
        └── Emplacements Page
              └── Select Emplacement
                    └── Products Page
                          ├── Browse list     ──┐
                          ├── Search product  ──┤──→ Confirmation Page
                          └── Scan barcode   ──┘         └── PATCH emplacement
                                                           └── ✅ Success
                                                                 └── back to Products
```

---

## 🚀 Development Order

| # | Task |
|---|---|
| 1 | Laravel setup + `.env` + SQLite |
| 2 | Run migrations + seeders |
| 3 | Build Auth API + test with Postman |
| 4 | Build Emplacements API |
| 5 | Build Produits API (list, search, barcode, assign) |
| 6 | React setup + Tailwind + routing |
| 7 | Login page + auth flow |
| 8 | Emplacements page |
| 9 | Products page (list + search + scanner) |
| 10 | Confirmation page + assign call |
| 11 | End-to-end testing |
| 12 | Error handling + loading states |

---

Ready to start coding? Say which part and I'll write the full code:
- **"start backend"** → Laravel setup + all code
- **"start frontend"** → React setup + all code
- **"start login"** → Login page both sides
