<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = ['name', 'location'];

    protected $appends = ['products_count'];

    public function emplacements()
    {
        return $this->hasMany(Emplacement::class);
    }

    public function getProductsCountAttribute(): int
    {
        if ($this->relationLoaded('emplacements')) {
            return $this->emplacements->sum('products_count');
        }

        return $this->emplacements()->withCount('products')->get()->sum('products_count');
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
