<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class RecurrenceAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public int $exceptionId,
        public string $exceptionClass,
        public string $projectName,
        public ?string $originalFinishedAt,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        return new DatabaseMessage([
            'type' => 'recurrence_assigned',
            'exception_id' => $this->exceptionId,
            'exception_class' => $this->exceptionClass,
            'project_name' => $this->projectName,
            'original_finished_at' => $this->originalFinishedAt,
            'url' => '/exceptions/'.$this->exceptionId,
        ]);
    }
}
