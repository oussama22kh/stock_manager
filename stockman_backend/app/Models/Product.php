<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    protected $fillable = ['name', 'barcode', 'description'];

    public function emplacements(): BelongsToMany
    {
        return $this->belongsToMany(Emplacement::class, 'warehouse_products', 'product_id', 'emplacement_id')
            ->withPivot(['assigned_by', 'assigned_at'])
            ->withTimestamps();
    }
}
