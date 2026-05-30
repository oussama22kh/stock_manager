<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => mb_scrub($value, 'UTF-8'),
            set: fn ($value) => mb_scrub($value, 'UTF-8'),
        );
    }

    protected function barcode(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => mb_scrub($value, 'UTF-8'),
            set: fn ($value) => mb_scrub($value, 'UTF-8'),
        );
    }

    protected function description(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value !== null ? mb_scrub($value, 'UTF-8') : null,
            set: fn ($value) => $value !== null ? mb_scrub($value, 'UTF-8') : null,
        );
    }
}
