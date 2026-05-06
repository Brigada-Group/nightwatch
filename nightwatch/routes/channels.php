<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('project.{id}', function ($user, $id) {
    return $user !== null;
});

Broadcast::channel('projects', function ($user) {
    return $user !== null;
});

// Per-user channel for AI fix attempt lifecycle events. Only the user who
// requested the fix (= the assignee) is authorized to subscribe to their
// own stream — events on this channel land directly on that developer's
// kanban without anyone else seeing them.
Broadcast::channel('ai-fix.user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
