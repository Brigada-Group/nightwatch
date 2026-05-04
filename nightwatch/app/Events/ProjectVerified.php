<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectVerified implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public array $payload) {}

    /**
     * Broadcast on a per-project channel so the verification modal on the
     * project's page can subscribe and react instantly.
     */
    public function broadcastOn(): array
    {
        return [new Channel('projects.'.$this->payload['project_uuid'])];
    }

    public function broadcastAs(): string
    {
        return 'project.verified';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
