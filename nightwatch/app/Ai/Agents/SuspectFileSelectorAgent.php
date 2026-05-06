<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

/**
 * First pass of the AI fix pipeline.
 *
 * Receives a production exception (or performance issue) plus a flat list
 * of repository file paths, and returns the at-most-`maxFiles` paths most
 * likely to contain the bug. OpenAiFixService then reads only those files
 * for the second pass, keeping the prompt budget bounded.
 *
 * Provider-agnostic: the model is whichever provider is configured in
 * `config/ai.php` ('default' key). Swap that to 'anthropic' / 'gemini' /
 * 'openrouter' / etc. and this class works unchanged.
 */
class SuspectFileSelectorAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    public function __construct(public int $maxFiles = 5) {}

    public function instructions(): Stringable|string
    {
        return 'You are an expert backend software engineer. '
            ."You will be given a production exception (or performance issue) and a list of file paths "
            ."from the corresponding repository. Identify the files most likely to contain the bug or "
            ."the code that needs to change. Prefer files mentioned in the stack trace when present. "
            ."Return at most {$this->maxFiles} files. Use exact paths from the provided list — do not "
            ."invent paths.";
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'files' => $schema->array()
                ->items($schema->string())
                ->required(),
        ];
    }
}
