<?php

namespace App\Events;

use App\Events\Concerns\BroadcastsFlattenedPayload;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class HealthCheckReceived implements ShouldBroadcastNow
{
    use BroadcastsFlattenedPayload;
    use SerializesModels;

    public function __construct(public array $data) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('project.' . $this->data['project_id']),
        ];
    }

    public function broadcastAs(): string
    {
        return 'health-check.received';
    }
}
