<?php

namespace App\Services\Ingest\Contracts;

use App\Models\Project;

interface IngestRecorderInterface
{
    public function record(Project $project, array $data): void;
}
