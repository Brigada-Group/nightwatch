
export async function copyTextToClipboard(text: string): Promise<boolean> {
    if (copyTextWithExecCommand(text)) {
        return true;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);

            return true;
        } catch {
            /* execCommand already failed */
        }
    }

    return false;
}

function copyTextWithExecCommand(text: string): boolean {
    if (typeof document === 'undefined') {
        return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(
        0,
        textarea.value.length,
    );

    let ok = false;

    try {
        ok = document.execCommand('copy');
    } catch {
        ok = false;
    }

    document.body.removeChild(textarea);

    return ok;
}
