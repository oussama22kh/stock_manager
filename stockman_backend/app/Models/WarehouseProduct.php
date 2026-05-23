<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseProduct extends Model
{
    protected $table = 'warehouse_products';

    protected $fillable = ['warehouse_id', 'product_id', 'assigned_by', 'assigned_at'];

    public $timestamps = true;
}
