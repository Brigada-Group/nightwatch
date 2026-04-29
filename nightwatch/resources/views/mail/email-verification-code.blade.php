<x-mail::message>
# Verify your email

Hi {{ $userName }},

Use this verification code to confirm your email address:

<x-mail::panel>
<strong style="font-size: 1.5rem; letter-spacing: 0.35em;">{{ $code }}</strong>
</x-mail::panel>

This code expires in **{{ $ttlMinutes }} minutes**.

If you did not create an account, you can ignore this message.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
