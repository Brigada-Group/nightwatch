<?php 

namespace App\Services;

class ExceptionFingerprintService
{
    public function compute(
        int $projectId,
        string $exceptionClass,
        ?string $message,
        ?string $file,
        ?int $line,
    ): string {
        $parts = [
            'p:'.$projectId,
            'c:'.$exceptionClass,
            'f:'.($file ?? ''),
            'l:'.($line ?? ''),
            'm:'.$this->normalizeMessage((string) $message)            
        ];

        return hash('sha256', implode('|', $parts));
    }

    private function normalizeMessage(string $message): string 
    {
        $message = preg_replace(                                              
            '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i',
            '<uuid>',                                                         
            $message,
        );  

        $message = preg_replace('/\b\d{2,}\b/', '<num>', $message);

        $message = preg_replace('/\s+/', ' ', $message);                      

        return trim($message);
    }
}