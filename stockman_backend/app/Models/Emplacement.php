<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Emplacement extends Model
{
    protected $fillable = ['warehouse_id', 'name', 'location'];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'warehouse_products', 'emplacement_id', 'product_id')
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

    protected function location(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value !== null ? mb_scrub($value, 'UTF-8') : null,
            set: fn ($value) => $value !== null ? mb_scrub($value, 'UTF-8') : null,
        );
    }
}
