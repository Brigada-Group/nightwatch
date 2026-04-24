<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    //

    public const ADMIN = 'admin';
    public const PROJECT_MANAGER = 'project_manager';
    public const DEVELOPER = 'developer';
    public const VIEWER = 'viewer';

    protected $fillable = [
        'name',
        'slug',
        'description'
    ];

    public function teamMembers(): HasMany 
    {
        return $this->hasMany(TeamMember::class);
    }
}
