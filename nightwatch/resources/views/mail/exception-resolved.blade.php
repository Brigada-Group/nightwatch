<x-mail::message>
# {{ $appName }}

Hi **{{ $recipientName }}**,

**{{ $resolverName }}** has marked an exception you assigned as **fixed** in the team **{{ $teamName }}**.

<x-mail::panel>
**Project:** {{ $projectName }}
**Environment:** {{ $environment }}
**Severity:** {{ $severity }}
**Captured:** {{ $sentAt }}
**Resolved:** {{ $resolvedAt }}
**Resolved by:** {{ $resolverName }}
</x-mail::panel>

**Exception**

> `{{ $exceptionClass }}`
>
> {{ $exceptionMessage }}

<x-mail::button :url="$exceptionUrl">
View in {{ $appName }}
</x-mail::button>

If the button doesn't work, paste this URL into your browser:

<x-mail::subcopy>
{{ $exceptionUrl }}
</x-mail::subcopy>

Thanks,<br>
{{ $appName }}
</x-mail::message>
