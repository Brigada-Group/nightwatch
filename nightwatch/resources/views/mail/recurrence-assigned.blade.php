<x-mail::message>
# A previously resolved exception is back

Hi {{ $assigneeName }},

An exception you previously marked as resolved in **{{ $projectName }}** ({{ $teamName }}) has occurred again. The card has been moved back to your **To Be Started** column.

**Exception:** `{{ $exceptionClass }}`

**Message:** {{ $exceptionMessage }}

**Severity:** {{ $severity }}

@if($previouslyFinishedAt)
**Previously resolved:** {{ $previouslyFinishedAt }}
@endif

<x-mail::button :url="$exceptionUrl">
View this occurrence
</x-mail::button>

Thanks,<br>
{{ $appName }}
</x-mail::message>
