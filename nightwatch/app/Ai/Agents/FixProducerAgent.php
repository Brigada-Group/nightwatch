<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

/**
 * Second pass of the AI fix pipeline.
 *
 * Receives the exception plus the full contents of the suspect files chosen
 * by SuspectFileSelectorAgent and returns corrected file contents for any
 * files that need to change. May also propose a small new file when that's
 * the cleanest fix (e.g. a dedicated exception handler module).
 *
 * Output is fully structured — the SDK enforces the JSON schema below so
 * the OpenAiFixService never has to parse free-form text.
 */
class FixProducerAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return 'You are an expert backend software engineer fixing a production bug. '
            ."You will receive an exception (or performance issue) and the full contents of the files "
            ."that are most likely involved. Produce corrected file contents for any files that need "
            ."to change. You may also create a small new file when that is the cleanest fix (for "
            ."example, an exception handler module). Each returned file's content must be the full "
            ."new contents of the file, not a diff. If no code changes are needed, return empty arrays "
            ."for files_changed and new_content and explain why in summary.";
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'summary' => $schema->string()->required(),
            'files_changed' => $schema->array()
                ->items($schema->string())
                ->required(),
            'new_content' => $schema->array()
                ->items(
                    $schema->object(fn ($schema) => [
                        'file_name' => $schema->string()->required(),
                        'content' => $schema->string()->required(),
                    ])
                )
                ->required(),
        ];
    }
}
