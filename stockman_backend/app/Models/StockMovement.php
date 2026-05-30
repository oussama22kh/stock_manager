<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    protected $fillable = ['product_id', 'from_emplacement_id', 'to_emplacement_id', 'moved_by', 'moved_at'];

    protected function casts(): array
    {
        return [
            'moved_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function fromEmplacement(): BelongsTo
    {
        return $this->belongsTo(Emplacement::class, 'from_emplacement_id');
    }

    public function toEmplacement(): BelongsTo
    {
        return $this->belongsTo(Emplacement::class, 'to_emplacement_id');
    }

    public function movedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moved_by');
    }
}
