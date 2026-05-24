<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    // ─── Users ───

    public function users(): JsonResponse
    {
        return response()->json(User::all());
    }

    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => ['required', 'string', Rule::in(['admin', 'agent'])],
        ]);

        $validated['password'] = Hash::make($validated['password']);

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
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
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

    // ─── Products ───

    public function products(): JsonResponse
    {
        return response()->json(Product::with('warehouses')->get());
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

    // ─── Emplacements (Warehouses) ───

    public function emplacements(): JsonResponse
    {
        return response()->json(Warehouse::with('products')->get());
    }

    public function storeEmplacement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $emplacement = Warehouse::create($validated);

        return response()->json($emplacement, 201);
    }

    public function updateEmplacement(Request $request, int $id): JsonResponse
    {
        $emplacement = Warehouse::find($id);

        if (! $emplacement) {
            return response()->json(['message' => 'Emplacement not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        $emplacement->update($validated);

        return response()->json($emplacement);
    }

    public function destroyEmplacement(int $id): JsonResponse
    {
        $emplacement = Warehouse::find($id);

        if (! $emplacement) {
            return response()->json(['message' => 'Emplacement not found'], 404);
        }

        $emplacement->delete();

        return response()->json(['message' => 'Emplacement deleted']);
    }

    // ─── CSV Import / Export ───

    public function importProducts(Request $request): JsonResponse
    {
        if (! $request->hasFile('file')) {
            return response()->json(['message' => 'Aucun fichier fourni'], 422);
        }

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle, 0, ';');

        if (! $header || ! in_array('name', $header) || ! in_array('barcode', $header)) {
            fclose($handle);

            return response()->json(['message' => 'CSV invalide. En-têtes requis: name;barcode;description'], 422);
        }

        $nameIdx = array_search('name', $header);
        $barcodeIdx = array_search('barcode', $header);
        $descIdx = array_search('description', $header);

        $created = 0;
        $skipped = 0;
        $errors = [];
        $line = 1;

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            $line++;
            $name = trim($row[$nameIdx] ?? '');
            $barcode = trim($row[$barcodeIdx] ?? '');
            $description = $descIdx !== false ? trim($row[$descIdx] ?? '') : null;

            if (empty($name) || empty($barcode)) {
                $errors[] = "Ligne {$line}: name et barcode sont requis";
                continue;
            }

            if (Product::where('barcode', $barcode)->exists()) {
                $skipped++;
                continue;
            }

            try {
                Product::create([
                    'name' => $name,
                    'barcode' => $barcode,
                    'description' => $description ?: null,
                ]);
                $created++;
            } catch (\Throwable $e) {
                $errors[] = "Ligne {$line}: {$e->getMessage()}";
            }
        }

        fclose($handle);

        return response()->json([
            'message' => "Import terminé: {$created} créé(s), {$skipped} existant(s) ignoré(s)",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    public function exportProducts(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $products = Product::all(['name', 'barcode', 'description']);

        return response()->streamDownload(function () use ($products) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['name', 'barcode', 'description'], ';');

            foreach ($products as $p) {
                fputcsv($output, [$p->name, $p->barcode, $p->description ?? ''], ';');
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
        $header = fgetcsv($handle, 0, ';');

        if (! $header || ! in_array('name', $header)) {
            fclose($handle);

            return response()->json(['message' => 'CSV invalide. En-têtes requis: name;location'], 422);
        }

        $nameIdx = array_search('name', $header);
        $locIdx = array_search('location', $header);

        $created = 0;
        $skipped = 0;
        $errors = [];
        $line = 1;

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            $line++;
            $name = trim($row[$nameIdx] ?? '');
            $location = $locIdx !== false ? trim($row[$locIdx] ?? '') : null;

            if (empty($name)) {
                $errors[] = "Ligne {$line}: name est requis";
                continue;
            }

            if (Warehouse::where('name', $name)->exists()) {
                $skipped++;
                continue;
            }

            try {
                Warehouse::create([
                    'name' => $name,
                    'location' => $location ?: null,
                ]);
                $created++;
            } catch (\Throwable $e) {
                $errors[] = "Ligne {$line}: {$e->getMessage()}";
            }
        }

        fclose($handle);

        return response()->json([
            'message' => "Import terminé: {$created} créé(s), {$skipped} existant(s) ignoré(s)",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    public function exportEmplacements(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $emplacements = Warehouse::all(['name', 'location']);

        return response()->streamDownload(function () use ($emplacements) {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['name', 'location'], ';');

            foreach ($emplacements as $e) {
                fputcsv($output, [$e->name, $e->location ?? ''], ';');
            }

            fclose($output);
        }, 'emplacements_'.now()->format('Y-m-d_His').'.csv', [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }
}
