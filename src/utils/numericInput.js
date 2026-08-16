export const MAX_INT_DIGITS = 3;
export const MAX_FRAC_DIGITS = 2;

function wholePart(buffer) {
    return buffer.split('.')[0].replace(/^-/, '');
}

function fracPart(buffer) {
    const parts = buffer.split('.');
    return parts.length > 1 ? parts[1] : '';
}

export function canAppendDigit(buffer, digit) {
    if (buffer.includes('.')) {
        return fracPart(buffer).length < MAX_FRAC_DIGITS;
    }
    const whole = wholePart(buffer);
    if (whole === '0') return true;
    return whole.length < MAX_INT_DIGITS;
}

export function applyAppendDigit(buffer, digit) {
    if (!canAppendDigit(buffer, digit)) return buffer;
    if (buffer === '' || buffer === '-') return buffer === '-' ? `-${digit}` : String(digit);
    if (!buffer.includes('.') && wholePart(buffer) === '0') {
        return buffer.startsWith('-') ? `-${digit}` : String(digit);
    }
    return buffer + String(digit);
}

export function canAppendDecimal(buffer) {
    return buffer !== '' && !buffer.includes('.');
}

export function applyAppendDecimal(buffer) {
    if (buffer.includes('.')) return buffer;
    if (buffer === '') return '0.';
    if (buffer === '-') return '-0.';
    return buffer + '.';
}

/** Toggle or start a leading minus (for signed position / velocity fields). */
export function applyToggleSign(buffer) {
    if (buffer === '' || buffer === '-') return '-';
    if (buffer.startsWith('-')) return buffer.slice(1);
    return `-${buffer}`;
}
