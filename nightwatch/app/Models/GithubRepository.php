<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GithubRepository extends Model
{
    protected $fillable = [
        'github_installation_id',
        'project_id',
        'github_repo_id',
        'full_name',
        'name',
        'default_branch',
        'private',
        'pushed_at',
    ];

    protected function casts(): array
    {
        return [
            'private' => 'boolean',
            'pushed_at' => 'datetime',
        ];
    }

    public function installation(): BelongsTo
    {
        return $this->belongsTo(GithubInstallation::class, 'github_installation_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
