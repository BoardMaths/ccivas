/**
 * Simple Test for Illegal Promotion Detection
 * Run with: npx tsx simple-test.ts
 */

import { runAuditRules } from './src/lib/audit-rules';

console.log('Testing Illegal Promotion Detection...\n');

// Test 1: ILLEGAL PROMOTION
console.log('TEST 1: Worker with ILLEGAL PROMOTION');
console.log('Details: GL 14 after only 8 years (started at GL 08)');
const result1 = runAuditRules({
    dob: '1990-01-15',
    dateOfFirstAppointment: '2018-01-01',
    entryGradeLevel: '08',
    dateOfPresentAppointment: '2020-01-01',
    gradeLevel: '14',
    step: '05',
    salaryScale: 'CORE',
    salaryAmount: '69520',
    highestQualification: 'BSC'
});

console.log('Flagged:', result1.isFlagged);
console.log('Reasons:');
result1.flagReason.forEach(r => console.log('  -', r));
console.log('\n' + '='.repeat(80) + '\n');

// Test 2: LEGAL PROMOTION
console.log('TEST 2: Worker with LEGAL PROMOTION');
console.log('Details: GL 12 after 11 years (started at GL 08)');
const result2 = runAuditRules({
    dob: '1988-03-10',
    dateOfFirstAppointment: '2015-01-01',
    entryGradeLevel: '08',
    gradeLevel: '12',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '53452',
    highestQualification: 'BSC'
});

console.log('Flagged:', result2.isFlagged);
console.log('Reasons:', result2.flagReason.length > 0 ? result2.flagReason : 'None - Clean record');
console.log('\n' + '='.repeat(80) + '\n');

// Summary
console.log('SUMMARY:');
console.log('Test 1 (Should be flagged):', result1.isFlagged ? '✅ PASS' : '❌ FAIL');
console.log('Test 2 (Should NOT be flagged):', !result2.isFlagged ? '✅ PASS' : '❌ FAIL');
