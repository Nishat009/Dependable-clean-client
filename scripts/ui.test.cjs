const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function loadModule(file, mocks = {}) {
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(code, { module, exports: module.exports, require: name => mocks[name] || require(name), console });
    return module.exports;
}
const load = (file, mocks) => loadModule(file, mocks).default;
// The real role helpers, so the sidebar is checked against the same rules the app uses.
const types = loadModule('frontend/src/design/types.ts');
const Link = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
test('role navigation and exactly one active sidebar item', () => {
    for (const role of ['super_admin', 'staff', 'customer']) {
        const Shell = load('frontend/src/design/components/DashboardShell.tsx', { 'next/link': Link, 'next/router': { useRouter: () => ({ push() { } }) }, '../Auth': { useAuth: () => ({ user: { name: 'Test User', email: 'test@example.test', role }, signOut() { } }) }, './Icon': () => null, '../types': types });
        const html = renderToStaticMarkup(React.createElement(Shell, { path: '/dashboard' }, 'Content'));
        assert.equal((html.match(/side-link active/g) || []).length, 1);
        assert.ok(html.includes('href="/profile"'));
        if (role === 'staff') {
            assert.ok(html.includes('href="/jobs"'));
            // Staff answer the support tickets the owner assigns to them.
            assert.ok(html.includes('href="/support"'));
            for (const p of ['/manageReviews', '/orderList', '/addAdmin', '/activity'])
                assert.ok(!html.includes(`href="${p}"`));
        }
        if (role === 'customer') {
            assert.ok(html.includes('href="/bookList"'));
            assert.ok(!html.includes('href="/addAdmin"'));
        }
        for (const path of role === 'super_admin' ? ['/editService/example', '/addService', '/orderList', '/manageReviews'] : role === 'customer' ? ['/book/example', '/bookList'] : ['/jobs', '/locations']) {
            const output = renderToStaticMarkup(React.createElement(Shell, { path }, 'Content'));
            assert.equal((output.match(/side-link active/g) || []).length, 1, path);
        }
    }
});
test('every role redirects to /dashboard after login, ignoring from query', () => {
    for (const role of ['super_admin', 'staff', 'customer']) {
        const redirects = [];
        const Login = load('frontend/src/design/screens/LoginPage.tsx', {
            react: { ...React, useEffect: fn => fn() }, 'next/router': { useRouter: () => ({ query: { from: '//evil.example' }, replace: path => redirects.push(path) }) },
            '../Auth': { useAuth: () => ({ user: { name: 'Test', role } }) }, '../hooks/useRemote': { useRemote: () => ({data: {demoEnabled:false}}) },
            '../api': { errorMessage: String }, '../components/Icon': () => null, '../components/Notice': () => null, '../components/PasswordInput': () => null
        });
        renderToStaticMarkup(React.createElement(Login));
        assert.deepEqual(redirects, ['/dashboard']);
    }
});
