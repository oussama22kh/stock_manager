<?php

namespace App\Http\Controllers;

use App\Models\Emplacement;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    // ─── Users ───

    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => ['required', 'string', Rule::in(['admin', 'agent'])],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['name'] = $validated['username'];
        $validated['email'] = $validated['username'].'@stockman.app';

        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'username' => ['sometimes', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|string|min:6',
            'role' => ['sometimes', 'string', Rule::in(['admin', 'agent'])],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json($user);
    }

    public function destroyUser(int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    public function importUsers(Request $request): JsonResponse
    {
        if (! $request->hasFile('file')) {
            return response()->json(['message' => 'Aucun fichier fourni'], 422);
        }

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);

        if (! $header || ! in_array('username', $header) || ! in_array('password', $header) || ! in_array('role', $header)) {
            fclose($handle);

            return response()->json(['message' => 'CSV invalide. En-têtes requis: username,password,role'], 422);
        }

        $usernameIdx = array_search('username', $header);
        $passwordIdx = array_search('password', $header);
        $roleIdx = array_search('role', $header);

        $created = 0;
        $skipped = 0;
        $errors = [];
        $batch = [];
        $line = 1;

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle)) !== false) {
                $line++;
                $username = trim($row[$usernameIdx] ?? '');
                $password = trim($row[$passwordIdx] ?? '');
                $role = trim($row[$roleIdx] ?? '');

                if (empty($username) || empty($password) || empty($role)) {
                    $errors[] = "Ligne {$line}: username, password et role sont requis";

                    continue;
                }

                if (! in_array($role, ['admin', 'agent'])) {
                    $errors[] = "Ligne {$line}: role '{$role}' invalide (admin ou agent)";

                    continue;
                }

                $batch[] = [
                    'username' => $username,
                    'password' => Hash::make($password),
                    'role' => $role,
                    'name' => $username,
                    'email' => $username.'@stockman.app',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (count($batch) >= 500) {
                    $result = $this->flushUserBatch($batch, $skipped);
                    $created += $result['created'];
                    $batch = [];
                }
            }

            if (! empty($batch)) {
                $result = $this->flushUserBatch($batch, $skipped);
                $created += $result['created'];
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);

            return response()->json(['message' => 'Erreur lors de l\'import: '.$e->getMessage()], 500);
        }

        fclose($handle);

        return response()->json([
            'message' => "Import terminé: {$created} créé(s), {$skipped} existant(s) ignoré(s)",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    private function flushUserBatch(array $batch, int &$skipped): array
    {
        $usernames = array_column($batch, 'username');
        $existing = User::whereIn('username', $usernames)->pluck('username')->map(fn ($v) => strtolower($v))->toArray();

        $toInsert = [];
        foreach ($batch as $row) {
            if (in_array(strtolower($row['username']), $existing)) {
                $skipped++;
            } else {
                $toInsert[] = $row;
            }
        }

        if (! empty($toInsert)) {
            User::insert($toInsert);
        }

        return ['created' => count($toInsert)];
    }

    public function exportUsers(): StreamedResponse
    {
        $users = User::all(['username', 'role']);

        return response()->streamDownload(function () use ($users) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['username', 'password', 'role']);

            foreach ($users as $u) {
                fputcsv($output, [$u->username, '', $u->role]);
            }

            fclose($output);
        }, 'users_'.now()->format('Y-m-d_His').'.csv', [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }

    // ─── Products ───

    public function products(Request $request): JsonResponse
    {
        $query = Product::with('emplacements', 'emplacements.warehouse');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'barcode' => 'required|string|max:255|unique:products',
            'description' => 'nullable|string',
        ]);

        $product = Product::create($validated);

        return response()->json($product, 201);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'barcode' => ['sometimes', 'string', 'max:255', Rule::unique('products')->ignore($product->id)],
            'description' => 'nullable|string',
        ]);

        $product->update($validated);

        return response()->json($product);
    }

    public function destroyProduct(int $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    // ─── Emplacements ───

    public function emplacements(Request $request): JsonResponse
    {
        $query = Emplacement::with('warehouse', 'products');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function storeEmplacement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $emplacement = Emplacement::create($validated);

        return response()->json($emplacement, 201);
    }

    public function updateEmplacement(Request $request, int $id): JsonResponse
    {
        $emplacement = Emplacement::find($id);

        if (! $emplacement) {
            return response()->json(['message' => 'Emplacement not found'], 404);
        }

        $validated = $request->validate([
            'warehouse_id' => 'sometimes|integer|exists:warehouses,id',
            'name' => 'sometimes|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $emplacement->update($validated);

        return response()->json($emplacement);
    }

    public function destroyEmplacement(int $id): JsonResponse
    {
        $emplacement = Emplacement::find($id);

        if (! $emplacement) {
            return response()->json(['message' => 'Emplacement not found'], 404);
        }

        $emplacement->delete();

        return response()->json(['message' => 'Emplacement deleted']);
    }

    // ─── Warehouses ───

    public function warehouses(Request $request): JsonResponse
    {
        $query = Warehouse::with('emplacements');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function storeWarehouse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json($warehouse, 201);
    }

    public function updateWarehouse(Request $request, int $id): JsonResponse
    {
        $warehouse = Warehouse::find($id);

        if (! $warehouse) {
            return response()->json(['message' => 'Warehouse not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $warehouse->update($validated);

        return response()->json($warehouse);
    }

    public function destroyWarehouse(int $id): JsonResponse
    {
        $warehouse = Warehouse::find($id);

        if (! $warehouse) {
            return response()->json(['message' => 'Warehouse not found'], 404);
        }

        $warehouse->delete();

        return response()->json(['message' => 'Warehouse deleted']);
    }

    // ─── CSV Import / Export ───

    public function importProducts(Request $request): JsonResponse
    {
        if (! $request->hasFile('file')) {
            return response()->json(['message' => 'Aucun fichier fourni'], 422);
        }

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);

        if (! $header || ! in_array('name', $header) || ! in_array('barcode', $header)) {
            fclose($handle);

            return response()->json(['message' => 'CSV invalide. En-têtes requis: name,barcode,description'], 422);
        }

        $nameIdx = array_search('name', $header);
        $barcodeIdx = array_search('barcode', $header);
        $descIdx = array_search('description', $header);

        $created = 0;
        $skipped = 0;
        $errors = [];
        $batch = [];
        $line = 1;

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle)) !== false) {
                $line++;
                $name = trim($row[$nameIdx] ?? '');
                $barcode = trim($row[$barcodeIdx] ?? '');
                $description = $descIdx !== false ? trim($row[$descIdx] ?? '') : null;

                if (empty($name) || empty($barcode)) {
                    $errors[] = "Ligne {$line}: name et barcode sont requis";

                    continue;
                }

                $batch[] = [
                    'name' => $name,
                    'barcode' => $barcode,
                    'description' => $description,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (count($batch) >= 500) {
                    $result = $this->flushProductBatch($batch, $skipped);
                    $created += $result['created'];
                    $batch = [];
                }
            }

            if (! empty($batch)) {
                $result = $this->flushProductBatch($batch, $skipped);
                $created += $result['created'];
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);

            return response()->json(['message' => 'Erreur lors de l\'import: '.$e->getMessage()], 500);
        }

        fclose($handle);

        return response()->json([
            'message' => "Import terminé: {$created} créé(s), {$skipped} existant(s) ignoré(s)",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    private function flushProductBatch(array $batch, int &$skipped): array
    {
        $barcodes = array_column($batch, 'barcode');
        $existing = Product::whereIn('barcode', $barcodes)->pluck('barcode')->map(fn ($v) => strtolower($v))->toArray();

        $toInsert = [];
        foreach ($batch as $row) {
            if (in_array(strtolower($row['barcode']), $existing)) {
                $skipped++;
            } else {
                $toInsert[] = $row;
            }
        }

        if (! empty($toInsert)) {
            Product::insert($toInsert);
        }

        return ['created' => count($toInsert)];
    }

    public function exportProducts(): StreamedResponse
    {
        $products = Product::all(['name', 'barcode', 'description']);

        return response()->streamDownload(function () use ($products) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['name', 'barcode', 'description']);

            foreach ($products as $p) {
                fputcsv($output, [$p->name, $p->barcode, $p->description ?? '']);
            }

            fclose($output);
        }, 'products_'.now()->format('Y-m-d_His').'.csv', [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }

    public function importEmplacements(Request $request): JsonResponse
    {
        if (! $request->hasFile('file')) {
            return response()->json(['message' => 'Aucun fichier fourni'], 422);
        }

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);

        if (! $header || ! in_array('name', $header) || ! in_array('warehouse_name', $header)) {
            fclose($handle);

            return response()->json(['message' => 'CSV invalide. En-têtes requis: warehouse_name,name,location'], 422);
        }

        $nameIdx = array_search('name', $header);
        $locIdx = array_search('location', $header);
        $whIdx = array_search('warehouse_name', $header);

        $warehouseCache = [];
        $created = 0;
        $skipped = 0;
        $errors = [];
        $line = 1;

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle)) !== false) {
                $line++;
                $name = trim($row[$nameIdx] ?? '');
                $location = $locIdx !== false ? trim($row[$locIdx] ?? '') : null;
                $whName = trim($row[$whIdx] ?? '');

                if (empty($name) || empty($whName)) {
                    $errors[] = "Ligne {$line}: warehouse_name et name sont requis";

                    continue;
                }

                $key = mb_strtolower($whName);
                if (! isset($warehouseCache[$key])) {
                    $wh = Warehouse::where('name', 'like', "%{$whName}%")->first();
                    $warehouseCache[$key] = $wh?->id;
                }

                $warehouseId = $warehouseCache[$key];

                if (! $warehouseId) {
                    $errors[] = "Ligne {$line}: Entrepôt '{$whName}' introuvable";

                    continue;
                }

                $existing = Emplacement::where('warehouse_id', $warehouseId)->where('name', $name)->exists();
                if ($existing) {
                    $skipped++;

                    continue;
                }

                Emplacement::create([
                    'warehouse_id' => $warehouseId,
                    'name' => $name,
                    'location' => $location,
                ]);
                $created++;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);

            return response()->json(['message' => 'Erreur lors de l\'import: '.$e->getMessage()], 500);
        }

        fclose($handle);

        return response()->json([
            'message' => "Import terminé: {$created} créé(s), {$skipped} existant(s) ignoré(s)",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    public function exportEmplacements(): StreamedResponse
    {
        $emplacements = Emplacement::with('warehouse')->get();

        return response()->streamDownload(function () use ($emplacements) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['warehouse_name', 'name', 'location']);

            foreach ($emplacements as $e) {
                fputcsv($output, [$e->warehouse?->name ?? '', $e->name, $e->location ?? '']);
            }

            fclose($output);
        }, 'emplacements_'.now()->format('Y-m-d_His').'.csv', [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }

    // ─── Warehouses CSV Import / Export ───

    public function importWarehouses(Request $request): JsonResponse
    {
        if (! $request->hasFile('file')) {
            return response()->json(['message' => 'Aucun fichier fourni'], 422);
        }

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);

        if (! $header || ! in_array('name', $header)) {
            fclose($handle);

            return response()->json(['message' => 'CSV invalide. En-têtes requis: name,location'], 422);
        }

        $nameIdx = array_search('name', $header);
        $locIdx = array_search('location', $header);

        $created = 0;
        $skipped = 0;
        $errors = [];
        $batch = [];
        $line = 1;

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($handle)) !== false) {
                $line++;
                $name = trim($row[$nameIdx] ?? '');
                $location = $locIdx !== false ? trim($row[$locIdx] ?? '') : null;

                if (empty($name)) {
                    $errors[] = "Ligne {$line}: name est requis";

                    continue;
                }

                $batch[] = [
                    'name' => $name,
                    'location' => $location,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (count($batch) >= 500) {
                    $result = $this->flushWarehouseBatch($batch, $skipped);
                    $created += $result['created'];
                    $batch = [];
                }
            }

            if (! empty($batch)) {
                $result = $this->flushWarehouseBatch($batch, $skipped);
                $created += $result['created'];
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);

            return response()->json(['message' => 'Erreur lors de l\'import: '.$e->getMessage()], 500);
        }

        fclose($handle);

        return response()->json([
            'message' => "Import terminé: {$created} créé(s), {$skipped} existant(s) ignoré(s)",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    private function flushWarehouseBatch(array $batch, int &$skipped): array
    {
        $names = array_column($batch, 'name');
        $existing = Warehouse::whereIn('name', $names)->pluck('name')->map(fn ($v) => strtolower($v))->toArray();

        $toInsert = [];
        foreach ($batch as $row) {
            if (in_array(strtolower($row['name']), $existing)) {
                $skipped++;
            } else {
                $toInsert[] = $row;
            }
        }

        if (! empty($toInsert)) {
            Warehouse::insert($toInsert);
        }

        return ['created' => count($toInsert)];
    }

    public function exportWarehouses(): StreamedResponse
    {
        $warehouses = Warehouse::withCount('emplacements')->get();

        return response()->streamDownload(function () use ($warehouses) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['name', 'location', 'emplacements_count']);

            foreach ($warehouses as $w) {
                fputcsv($output, [$w->name, $w->location ?? '', $w->emplacements_count]);
            }

            fclose($output);
        }, 'warehouses_'.now()->format('Y-m-d_His').'.csv', [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }

    // ─── Bulk Delete ───

    public function destroyUsersBulk(Request $request): JsonResponse
    {
        $request->validate([
            'all_matching' => 'boolean',
            'search' => 'nullable|string',
            'ids' => $request->boolean('all_matching') ? 'nullable' : 'required|array',
            'ids.*' => 'integer',
        ]);

        if ($request->boolean('all_matching')) {
            $query = User::query();
            if ($search = $request->get('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            }
            $count = $query->delete();

            return response()->json(['deleted' => $count]);
        }

        $count = User::whereIn('id', $request->ids)->delete();

        return response()->json(['deleted' => $count]);
    }

    public function destroyProductsBulk(Request $request): JsonResponse
    {
        $request->validate([
            'all_matching' => 'boolean',
            'search' => 'nullable|string',
            'ids' => $request->boolean('all_matching') ? 'nullable' : 'required|array',
            'ids.*' => 'integer',
        ]);

        if ($request->boolean('all_matching')) {
            $query = Product::query();
            if ($search = $request->get('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            }
            $count = $query->delete();

            return response()->json(['deleted' => $count]);
        }

        $count = Product::whereIn('id', $request->ids)->delete();

        return response()->json(['deleted' => $count]);
    }

    public function destroyWarehousesBulk(Request $request): JsonResponse
    {
        $request->validate([
            'all_matching' => 'boolean',
            'search' => 'nullable|string',
            'ids' => $request->boolean('all_matching') ? 'nullable' : 'required|array',
            'ids.*' => 'integer',
        ]);

        if ($request->boolean('all_matching')) {
            $query = Warehouse::query();
            if ($search = $request->get('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            }
            $count = $query->delete();

            return response()->json(['deleted' => $count]);
        }

        $count = Warehouse::whereIn('id', $request->ids)->delete();

        return response()->json(['deleted' => $count]);
    }

    public function destroyEmplacementsBulk(Request $request): JsonResponse
    {
        $request->validate([
            'all_matching' => 'boolean',
            'search' => 'nullable|string',
            'ids' => $request->boolean('all_matching') ? 'nullable' : 'required|array',
            'ids.*' => 'integer',
        ]);

        if ($request->boolean('all_matching')) {
            $query = Emplacement::query();
            if ($search = $request->get('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            }
            $count = $query->delete();

            return response()->json(['deleted' => $count]);
        }

        $count = Emplacement::whereIn('id', $request->ids)->delete();

        return response()->json(['deleted' => $count]);
    }

    public function stats(): JsonResponse
    {
        $totalProducts = Product::count();
        $totalWarehouses = Warehouse::count();
        $totalEmplacements = Emplacement::count();
        $assignedProducts = WarehouseProduct::distinct('product_id')->count('product_id');
        $unassignedProducts = $totalProducts - $assignedProducts;

        $productsPerEmplacement = Emplacement::withCount('products')
            ->with('warehouse')
            ->orderByDesc('products_count')
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'warehouse_name' => $e->warehouse?->name,
                'products_count' => $e->products_count,
            ]);

        $recentAssignments = WarehouseProduct::with(['product:id,name,barcode', 'emplacement:id,name,warehouse_id', 'emplacement.warehouse:id,name'])
            ->latest('assigned_at')
            ->take(10)
            ->get()
            ->map(fn ($wp) => [
                'product_name' => $wp->product?->name,
                'product_barcode' => $wp->product?->barcode,
                'emplacement_name' => $wp->emplacement?->name,
                'warehouse_name' => $wp->emplacement?->warehouse?->name,
                'assigned_at' => $wp->assigned_at,
            ]);

        $recentProducts = Product::latest()->take(5)->get(['id', 'name', 'barcode', 'created_at']);

        $totalUsers = User::count();
        $adminUsers = User::where('role', 'admin')->count();
        $agentUsers = User::where('role', 'agent')->count();

        return response()->json([
            'total_products' => $totalProducts,
            'assigned_products' => $assignedProducts,
            'unassigned_products' => $unassignedProducts,
            'total_warehouses' => $totalWarehouses,
            'total_emplacements' => $totalEmplacements,
            'products_per_emplacement' => $productsPerEmplacement,
            'recent_assignments' => $recentAssignments,
            'recent_products' => $recentProducts,
            'total_users' => $totalUsers,
            'admin_users' => $adminUsers,
            'agent_users' => $agentUsers,
        ]);
    }
}
