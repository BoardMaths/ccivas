/**
 * Test Script for Illegal Promotion Detection
 * Run this with: npx tsx test-illegal-promotion.ts
 */

import { runAuditRules } from './src/lib/audit-rules';
import { formatNaira } from './src/lib/salary-utils';

console.log('🔍 Testing Illegal Promotion Detection System\n');
console.log('='.repeat(80));

// Test Case 1: ILLEGAL PROMOTION - Degree Holder Over-Promoted
console.log('\n📋 TEST 1: ILLEGAL PROMOTION - Degree Holder Over-Promoted');
console.log('-'.repeat(80));
const test1 = runAuditRules({
    dob: '1990-01-15',
    dateOfFirstAppointment: '2018-01-01',
    entryGradeLevel: '08',
    entryStep: '01',
    dateOfPresentAppointment: '2020-01-01',
    gradeLevel: '14',
    step: '05',
    salaryScale: 'CORE',
    salaryAmount: '69520',
    highestQualification: 'BSC'
});

console.log('Is Flagged:', test1.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (SHOULD BE FLAGGED)');
console.log('\nFlag Reasons:');
test1.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 1:', test1.isFlagged ? '✅ PASSED' : '❌ FAILED');

// Test Case 2: ILLEGAL PROMOTION - SSCE Holder Jumped Too Fast
console.log('\n\n📋 TEST 2: ILLEGAL PROMOTION - SSCE Holder Jumped Too Fast');
console.log('-'.repeat(80));
const test2 = runAuditRules({
    dob: '1995-06-20',
    dateOfFirstAppointment: '2020-01-01',
    entryGradeLevel: '04',
    entryStep: '01',
    dateOfPresentAppointment: '2022-01-01',
    gradeLevel: '10',
    step: '01',
    salaryScale: 'CORE',
    salaryAmount: '46777',
    highestQualification: 'SSCE'
});

console.log('Is Flagged:', test2.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (SHOULD BE FLAGGED)');
console.log('\nFlag Reasons:');
test2.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 2:', test2.isFlagged ? '✅ PASSED' : '❌ FAILED');

// Test Case 3: LEGAL PROMOTION - Normal Progression
console.log('\n\n📋 TEST 3: LEGAL PROMOTION - Normal Progression');
console.log('-'.repeat(80));
const test3 = runAuditRules({
    dob: '1988-03-10',
    dateOfFirstAppointment: '2015-01-01',
    entryGradeLevel: '08',
    entryStep: '01',
    gradeLevel: '12',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '53452',
    highestQualification: 'BSC'
});

console.log('Is Flagged:', test3.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '❌ NO (SHOULD NOT BE FLAGGED)');
console.log('\nFlag Reasons:');
if (test3.flagReason.length === 0) {
    console.log('  (None - Clean record)');
} else {
    test3.flagReason.forEach((reason, i) => {
        console.log(`  ${i + 1}. ${reason}`);
    });
}
console.log('\nTest 3:', !test3.isFlagged ? '✅ PASSED' : '❌ FAILED');

// Test Case 4: EXTREME ILLEGAL PROMOTION - PhD Holder
console.log('\n\n📋 TEST 4: EXTREME ILLEGAL PROMOTION - PhD Holder');
console.log('-'.repeat(80));
const test4 = runAuditRules({
    dob: '1985-12-05',
    dateOfFirstAppointment: '2022-06-01',
    entryGradeLevel: '09',
    entryStep: '01',
    dateOfPresentAppointment: '2023-01-01',
    gradeLevel: '16',
    step: '05',
    salaryScale: 'CORE',
    salaryAmount: '122403',
    highestQualification: 'PHD'
});

console.log('Is Flagged:', test4.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (SHOULD BE FLAGGED)');
console.log('\nFlag Reasons:');
test4.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 4:', test4.isFlagged ? '✅ PASSED' : '❌ FAILED');

// Test Case 5: Entry Age Violation
console.log('\n\n📋 TEST 5: ENTRY AGE VIOLATION - Underage Entry');
console.log('-'.repeat(80));
const test5 = runAuditRules({
    dob: '2005-01-01',
    dateOfFirstAppointment: '2020-01-01', // 15 years old at entry!
    entryGradeLevel: '08',
    gradeLevel: '08',
    step: '01',
    salaryScale: 'CORE',
    highestQualification: 'BSC'
});

console.log('Is Flagged:', test5.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (SHOULD BE FLAGGED - Underage)');
console.log('\nFlag Reasons:');
test5.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 5:', test5.isFlagged ? '✅ PASSED' : '❌ FAILED');

// Test Case 6: Retirement Age Violation
console.log('\n\n📋 TEST 6: RETIREMENT AGE VIOLATION - Overage Personnel');
console.log('-'.repeat(80));
const test6 = runAuditRules({
    dob: '1960-01-01', // 66 years old!
    dateOfFirstAppointment: '1985-01-01',
    entryGradeLevel: '08',
    gradeLevel: '14',
    step: '05',
    salaryScale: 'CORE',
    highestQualification: 'BSC'
});

console.log('Is Flagged:', test6.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (SHOULD BE FLAGGED - Over 60 years)');
console.log('\nFlag Reasons:');
test6.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 6:', test6.isFlagged ? '✅ PASSED' : '❌ FAILED');

// Summary
console.log('\n\n' + '='.repeat(80));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(80));

const results = [
    { name: 'Test 1 (Illegal Promotion - BSC)', passed: test1.isFlagged },
    { name: 'Test 2 (Illegal Promotion - SSCE)', passed: test2.isFlagged },
    { name: 'Test 3 (Legal Promotion)', passed: !test3.isFlagged },
    { name: 'Test 4 (Extreme Illegal - PhD)', passed: test4.isFlagged },
    { name: 'Test 5 (Underage Entry)', passed: test5.isFlagged },
    { name: 'Test 6 (Overage Personnel)', passed: test6.isFlagged }
];

const passedCount = results.filter(r => r.passed).length;
const totalCount = results.length;

results.forEach((result, i) => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
});

console.log('\n' + '-'.repeat(80));
console.log(`Total: ${passedCount}/${totalCount} tests passed`);

if (passedCount === totalCount) {
    console.log('\n🎉 ALL TESTS PASSED! Illegal promotion detection is working correctly.');
} else {
    console.log('\n⚠️  SOME TESTS FAILED! Please review the audit rules implementation.');
}

console.log('='.repeat(80));
console.log('\n✅ Test completed!\n');
