<x-mail::message>
# {{ $appName }}

Hi **{{ $assigneeName }}**,

**{{ $assignedByName }}** assigned a new exception to you in the team **{{ $teamName }}**.

<x-mail::panel>
**Project:** {{ $projectName }}
**Environment:** {{ $environment }}
**Severity:** {{ $severity }}
**Captured:** {{ $sentAt }}
</x-mail::panel>

**Exception**

> `{{ $exceptionClass }}`
>
> {{ $exceptionMessage }}

<x-mail::button :url="$exceptionUrl">
Open in {{ $appName }}
</x-mail::button>

If the button doesn't work, paste this URL into your browser:

<x-mail::subcopy>
{{ $exceptionUrl }}
</x-mail::subcopy>

Thanks,<br>
{{ $appName }}
</x-mail::message>
