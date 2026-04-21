<?php

namespace App\Http\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class InertiaPaginator
{
   
    public static function props(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}
