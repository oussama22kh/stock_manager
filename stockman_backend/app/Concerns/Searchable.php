<?php

namespace App\Concerns;

trait Searchable
{
    protected function applyWordPrefixSearch($query, string $search, string $column, ?string $fallbackColumn = null): void
    {
        $terms = array_values(array_filter(explode(' ', trim($search)), fn ($t) => $t !== ''));

        $query->where(function ($q) use ($terms, $search, $column, $fallbackColumn) {
            if (! empty($terms)) {
                $q->where(function ($sq) use ($terms, $column) {
                    foreach ($terms as $term) {
                        $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $term);
                        $sq->where(function ($wq) use ($escaped, $column) {
                            $wq->whereRaw("LOWER({$column}) LIKE LOWER(?)", ["{$escaped}%"])
                                ->orWhereRaw("LOWER({$column}) LIKE LOWER(?)", ["% {$escaped}%"]);
                        });
                    }
                });
            }
            if ($fallbackColumn) {
                $escapedSearch = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $q->orWhereRaw("LOWER({$fallbackColumn}) LIKE LOWER(?)", ["%{$escapedSearch}%"]);
            }
        });
    }
}
