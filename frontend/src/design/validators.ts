// Form checks shared by the sign-up, team, profile and setup forms, so mistakes show before anything is sent.
// `own` words the message for the person filling in the form ("your") instead of someone they add ("their").
// The email rule is stricter than the browser's own, which accepts addresses without a domain ending such as "a@b".
export const nameProblem = (name: string, own = false) => {
    const value = name.trim();
    if (!value) return own ? 'Enter your name.' : 'Enter their name.';
    if (value.includes('@')) return own ? 'Enter your name here, not an email address.' : 'Enter their name here, not an email address.';
    if (!/\p{L}/u.test(value)) return 'A name needs at least one letter.';
    if (value.length < 2) return own ? 'Enter your full name.' : 'Enter their full name.';
    return '';
};
export const emailProblem = (email: string, own = false) => {
    const value = email.trim();
    if (!value) return own ? 'Enter your email address.' : 'Enter their email address.';
    return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(value) ? '' : 'Enter a full email address, like name@example.com.';
};
export const passwordProblem = (password: string, own = false) => !password ? (own ? 'Choose a password.' : 'Set a password for them.') : password.length < 12 ? `Use at least 12 characters (${password.length} so far).` : password.length > 200 ? 'Use 200 characters or fewer.' : '';
