<?php

namespace App\Models;

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
        return $this->emplacements()->withCount('products')->get()->sum('products_count');
    }
}
