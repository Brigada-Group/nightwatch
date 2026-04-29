<x-mail::message>
# {{ $appName }}

**{{ $inviterName }}** is inviting you to join the team **{{ $teamName }}**.

You’re invited with the **{{ $roleName }}** role.

@if(count($projectNames) > 0)
When you accept, you’ll automatically be assigned to @if(count($projectNames) === 1) this project:@else these projects:@endif

@foreach($projectNames as $name)
• {{ $name }}
@endforeach

@else
This link does not pre-assign specific projects — you’ll join the team with the role above.
@endif

Click the button below to open the invitation. You can sign in or create an account there. Treat this link like a password until it expires.

<x-mail::button :url="$joinUrl">
Join the team
</x-mail::button>

If the button doesn’t work, paste this URL into your browser:

<x-mail::subcopy>
{{ $joinUrl }}
</x-mail::subcopy>

Thanks,<br>
{{ $appName }}
</x-mail::message>
