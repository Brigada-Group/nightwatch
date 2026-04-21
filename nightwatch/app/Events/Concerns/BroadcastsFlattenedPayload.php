<?php

namespace App\Events\Concerns;

trait BroadcastsFlattenedPayload
{
    
    public function broadcastWith(): array
    {
        return $this->data;
    }
}
