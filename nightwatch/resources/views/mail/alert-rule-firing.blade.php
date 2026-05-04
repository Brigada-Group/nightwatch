<x-mail::message>
# Alert: {{ $ruleName }}

@if($projectName)
**Project:** {{ $projectName }}
@endif

@if($teamName)
**Team:** {{ $teamName }}
@endif

**Severity:** {{ $severity }}

**Fired at:** {{ $firedAt }}

@if(count($events) > 0)
## Errors that triggered this alert

@foreach($events as $event)
---

**{{ $event['exception_class'] }}**

{{ $event['message'] }}

@if($event['file'])
*Location:* `{{ $event['file'] }}@if($event['line']):{{ $event['line'] }}@endif`
@endif

*Occurred:* {{ $event['occurred_at'] }}@if($event['severity']) · *Severity:* {{ $event['severity'] }}@endif@if($event['occurrences_in_window']) · *Occurrences:* {{ $event['occurrences_in_window'] }}@endif

[View this exception]({{ $event['url'] }})

@endforeach
@else
The rule fired but the underlying events could not be loaded. They may have been pruned by retention.
@endif

<x-mail::button :url="$rulesUrl">
Manage alert rules
</x-mail::button>

Re-firing of this rule is suppressed until the condition resolves.

Thanks,<br>
{{ $appName }}
</x-mail::message>
