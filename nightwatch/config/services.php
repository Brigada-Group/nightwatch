<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'paddle' => [
        'api_key' => env('PADDLE_API_KEY'),
        'base_url' => env('PADDLE_BASE_URL', env('PADDLE_TESTING', 'https://sandbox-api.paddle.com')),
        'success_url' => env('PADDLE_SUCCESS_URL', rtrim(env('APP_URL', 'http://localhost'), '/').'/billing/success?tx={transaction_id}'),
        'cancel_url' => env('PADDLE_CANCEL_URL', rtrim(env('APP_URL', 'http://localhost'), '/').'/#pricing'),
    ],

    'github' => [
        'app_id' => env('GITHUB_APP_ID'),
        'app_slug' => env('GITHUB_APP_SLUG'),
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'webhook_secret' => env('GITHUB_WEBHOOK_SECRET'),
        // The private key may be configured two ways: an inline PEM in
        // GITHUB_PRIVATE_KEY (escaped \n sequences), or a path to a .pem
        // file in GITHUB_PRIVATE_KEY_PATH. The path form is preferred for
        // production — multi-line PEMs in .env are a constant footgun.
        'private_key' => env('GITHUB_PRIVATE_KEY'),
        'private_key_path' => env('GITHUB_PRIVATE_KEY_PATH'),
        'api_base' => env('GITHUB_API_BASE', 'https://api.github.com'),
    ],

];
