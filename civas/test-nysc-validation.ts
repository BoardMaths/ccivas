/**
 * Test NYSC Validation Rules
 * Run with: npx tsx test-nysc-validation.ts
 */

import { runAuditRules } from './src/lib/audit-rules';

console.log('🔍 Testing NYSC Validation Rules\n');
console.log('='.repeat(80));

// Test 1: Missing NYSC for BSC holder
console.log('\n📋 TEST 1: BSC Holder WITHOUT NYSC Year');
console.log('-'.repeat(80));
const test1 = runAuditRules({
    dob: '1990-01-15',
    dateOfFirstAppointment: '2015-01-01',
    entryGradeLevel: '08',
    gradeLevel: '10',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '46777',
    highestQualification: 'BSC',
    nyscYear: '' // Missing!
});

console.log('Is Flagged:', test1.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (Missing NYSC)');
console.log('\nFlag Reasons:');
test1.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 1:', test1.flagReason.some(r => r.includes('NYSC Requirement')) ? '✅ PASSED' : '❌ FAILED');

// Test 2: NYSC after appointment (INVALID)
console.log('\n\n📋 TEST 2: NYSC Year AFTER First Appointment');
console.log('-'.repeat(80));
const test2 = runAuditRules({
    dob: '1990-01-15',
    dateOfFirstAppointment: '2015-01-01',
    entryGradeLevel: '08',
    gradeLevel: '10',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '46777',
    highestQualification: 'BSC',
    nyscYear: '2016' // After appointment!
});

console.log('Is Flagged:', test2.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (NYSC after appointment)');
console.log('\nFlag Reasons:');
test2.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 2:', test2.flagReason.some(r => r.includes('NYSC year') && r.includes('after first appointment')) ? '✅ PASSED' : '❌ FAILED');

// Test 3: Valid NYSC (should not flag for NYSC)
console.log('\n\n📋 TEST 3: Valid NYSC Year');
console.log('-'.repeat(80));
const test3 = runAuditRules({
    dob: '1990-01-15',
    dateOfFirstAppointment: '2015-01-01',
    entryGradeLevel: '08',
    gradeLevel: '10',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '46777',
    highestQualification: 'BSC',
    nyscYear: '2012' // Valid - before appointment, reasonable age
});

console.log('Is Flagged:', test3.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '❌ NO (Valid NYSC)');
console.log('\nFlag Reasons:');
if (test3.flagReason.length === 0) {
    console.log('  (None - Clean record)');
} else {
    test3.flagReason.forEach((reason, i) => {
        console.log(`  ${i + 1}. ${reason}`);
    });
}
const hasNyscFlag = test3.flagReason.some(r => r.includes('NYSC'));
console.log('\nTest 3:', !hasNyscFlag ? '✅ PASSED' : '❌ FAILED');

// Test 4: NYSC too young (age validation)
console.log('\n\n📋 TEST 4: NYSC at Unrealistic Age (Too Young)');
console.log('-'.repeat(80));
const test4 = runAuditRules({
    dob: '1990-01-15',
    dateOfFirstAppointment: '2015-01-01',
    entryGradeLevel: '08',
    gradeLevel: '10',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '46777',
    highestQualification: 'BSC',
    nyscYear: '2005' // Age 15 - too young!
});

console.log('Is Flagged:', test4.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (NYSC at age 15 is impossible)');
console.log('\nFlag Reasons:');
test4.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 4:', test4.flagReason.some(r => r.includes('too young')) ? '✅ PASSED' : '❌ FAILED');

// Test 5: SSCE holder (no NYSC requirement)
console.log('\n\n📋 TEST 5: SSCE Holder (No NYSC Requirement)');
console.log('-'.repeat(80));
const test5 = runAuditRules({
    dob: '1990-01-15',
    dateOfFirstAppointment: '2015-01-01',
    entryGradeLevel: '04',
    gradeLevel: '07',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '35697',
    highestQualification: 'SSCE',
    nyscYear: '' // No NYSC - but SSCE doesn't require it
});

console.log('Is Flagged:', test5.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '❌ NO (SSCE holders don\'t require NYSC)');
console.log('\nFlag Reasons:');
if (test5.flagReason.length === 0) {
    console.log('  (None - Clean record)');
} else {
    test5.flagReason.forEach((reason, i) => {
        console.log(`  ${i + 1}. ${reason}`);
    });
}
const hasNyscFlag5 = test5.flagReason.some(r => r.includes('NYSC'));
console.log('\nTest 5:', !hasNyscFlag5 ? '✅ PASSED' : '❌ FAILED');

// Test 6: NYSC in the future
console.log('\n\n📋 TEST 6: NYSC Year in the Future');
console.log('-'.repeat(80));
const test6 = runAuditRules({
    dob: '1990-01-15',
    dateOfFirstAppointment: '2015-01-01',
    entryGradeLevel: '08',
    gradeLevel: '10',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '46777',
    highestQualification: 'BSC',
    nyscYear: '2027' // Future year!
});

console.log('Is Flagged:', test6.isFlagged ? '✅ YES' : '❌ NO');
console.log('Expected:', '✅ YES (NYSC year in future)');
console.log('\nFlag Reasons:');
test6.flagReason.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
});
console.log('\nTest 6:', test6.flagReason.some(r => r.includes('future')) ? '✅ PASSED' : '❌ FAILED');

// Summary
console.log('\n\n' + '='.repeat(80));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(80));

const results = [
    { name: 'Test 1 (Missing NYSC)', passed: test1.flagReason.some(r => r.includes('NYSC Requirement')) },
    { name: 'Test 2 (NYSC after appointment)', passed: test2.flagReason.some(r => r.includes('NYSC year') && r.includes('after first appointment')) },
    { name: 'Test 3 (Valid NYSC)', passed: !test3.flagReason.some(r => r.includes('NYSC')) },
    { name: 'Test 4 (NYSC too young)', passed: test4.flagReason.some(r => r.includes('too young')) },
    { name: 'Test 5 (SSCE - no requirement)', passed: !test5.flagReason.some(r => r.includes('NYSC')) },
    { name: 'Test 6 (NYSC in future)', passed: test6.flagReason.some(r => r.includes('future')) }
];

const passedCount = results.filter(r => r.passed).length;
const totalCount = results.length;

results.forEach((result) => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
});

console.log('\n' + '-'.repeat(80));
console.log(`Total: ${passedCount}/${totalCount} tests passed`);

if (passedCount === totalCount) {
    console.log('\n🎉 ALL TESTS PASSED! NYSC validation is working correctly.');
} else {
    console.log('\n⚠️  SOME TESTS FAILED! Please review the NYSC validation implementation.');
}

console.log('='.repeat(80));
console.log('\n✅ Test completed!\n');
