<?php

namespace App\Services\Webhooks\Formatters;

class GenericWebhookFormatter
{
    public function format(array $payload): array
    {
        return $payload;
    }
}
