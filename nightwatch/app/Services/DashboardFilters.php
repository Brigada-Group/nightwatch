<?php

namespace App\Services;

use Illuminate\Http\Request;

class DashboardFilters
{
    /**
     * @param  list<string>  $statuses
     * @param  list<string>  $environments
     */
    public function __construct(
        public readonly ?string $search = null,
        public readonly array $statuses = [],
        public readonly array $environments = [],
    ) {}

    public static function fromRequest(Request $request): self
    {
        $search = $request->query('search');
        if (is_string($search)) {
            $search = trim($search);
            if ($search === '') {
                $search = null;
            }
        } else {
            $search = null;
        }

        return new self(
            search: $search,
            statuses: self::stringList($request->query('statuses')),
            environments: self::stringList($request->query('environments')),
        );
    }

    public function isActive(): bool
    {
        return $this->search !== null
            || $this->statuses !== []
            || $this->environments !== [];
    }

    public function cacheSuffix(): string
    {
        if (! $this->isActive()) {
            return '';
        }

        $payload = [
            's' => $this->search,
            'st' => $this->statuses,
            'env' => $this->environments,
        ];

        return ':'.md5((string) json_encode($payload));
    }

    /**
     * @return list<string>
     */
    private static function stringList(mixed $value): array
    {
        if (is_string($value)) {
            $value = array_filter(explode(',', $value), static fn ($v) => $v !== '');
        }

        if (! is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $v) {
            if (is_string($v) && $v !== '') {
                $out[] = $v;
            }
        }

        return array_values(array_unique($out));
    }
}
