/**
 * Quick Test Script for Audit Rules
 * Run this to verify the audit rules are working correctly
 */

import { runAuditRules } from './src/lib/audit-rules';

console.log('🧪 Testing Comprehensive Audit Rules...\n');

// Test Case 1: Illegal Promotion with Missing Ministry
console.log('📋 Test 1: Illegal Promotion + Missing Ministry');
const test1 = runAuditRules({
    dob: '1985-06-15',
    dateOfFirstAppointment: '2010-01-15',
    entryGradeLevel: '08',
    entryStep: '01',
    gradeLevel: '14',
    step: '03',
    dateOfPresentAppointment: '2018-06-01',
    salaryScale: 'CORE',
    salaryAmount: '68596',
    highestQualification: 'BSC',
    nyscYear: '2009',
    ministry: null,
    department: null,
});

console.log('Flagged:', test1.isFlagged);
console.log('Severity:', test1.severity);
console.log('Flags:', test1.flagReason.length);
test1.flagReason.forEach((flag, i) => console.log(`  ${i + 1}. ${flag}`));
console.log('\n---\n');

// Test Case 2: Early Confirmation
console.log('📋 Test 2: Early Confirmation');
const test2 = runAuditRules({
    dob: '1992-03-20',
    dateOfFirstAppointment: '2020-01-15',
    entryGradeLevel: '08',
    entryStep: '01',
    dateOfConfirmation: '2020-12-15',
    confirmationGradeLevel: '10',
    confirmationStep: '05',
    confirmationLetterRef: null,
    gradeLevel: '10',
    step: '07',
    salaryScale: 'CORE',
    salaryAmount: '46777',
    highestQualification: 'BSC',
    nyscYear: '2019',
});

console.log('Flagged:', test2.isFlagged);
console.log('Severity:', test2.severity);
console.log('Flags:', test2.flagReason.length);
test2.flagReason.forEach((flag, i) => console.log(`  ${i + 1}. ${flag}`));
console.log('\n---\n');

// Test Case 3: Step Exceeds Maximum
console.log('📋 Test 3: Step Exceeds Maximum');
const test3 = runAuditRules({
    dob: '1987-05-12',
    dateOfFirstAppointment: '2012-01-15',
    entryGradeLevel: '08',
    entryStep: '01',
    gradeLevel: '10',
    step: '18',
    salaryScale: 'CORE',
    salaryAmount: '46777',
    highestQualification: 'BSC',
    nyscYear: '2011',
});

console.log('Flagged:', test3.isFlagged);
console.log('Severity:', test3.severity);
console.log('Flags:', test3.flagReason.length);
test3.flagReason.forEach((flag, i) => console.log(`  ${i + 1}. ${flag}`));
console.log('\n---\n');

// Test Case 4: Perfect Record (No Flags)
console.log('📋 Test 4: Perfect Record (Should Have NO Flags)');
const test4 = runAuditRules({
    dob: '1990-05-15',
    dateOfFirstAppointment: '2016-01-15',
    entryGradeLevel: '08',
    entryStep: '01',
    dateOfConfirmation: '2018-02-15',
    confirmationGradeLevel: '08',
    confirmationStep: '05',
    confirmationLetterRef: 'MF/CONF/2018/0456',
    gradeLevel: '11',
    step: '03',
    salaryScale: 'CORE',
    salaryAmount: '49087',
    highestQualification: 'BSC',
    nyscYear: '2015',
    ministry: 'Ministry of Finance',
    department: 'Budget and Planning',
});

console.log('Flagged:', test4.isFlagged);
console.log('Severity:', test4.severity);
console.log('Flags:', test4.flagReason.length);
if (test4.flagReason.length > 0) {
    test4.flagReason.forEach((flag, i) => console.log(`  ${i + 1}. ${flag}`));
}
console.log('\n---\n');

// Test Case 5: CRITICAL Financial Impact
console.log('📋 Test 5: CRITICAL Financial Impact');
const test5 = runAuditRules({
    dob: '1983-01-20',
    dateOfFirstAppointment: '2015-01-15',
    entryGradeLevel: '08',
    entryStep: '01',
    dateOfPresentAppointment: '2019-01-01',
    gradeLevel: '16',
    step: '05',
    salaryScale: 'CORE',
    salaryAmount: '122403',
    highestQualification: 'BSC',
    nyscYear: '2014',
    ministry: null,
    department: 'Administration',
});

console.log('Flagged:', test5.isFlagged);
console.log('Severity:', test5.severity);
console.log('Flags:', test5.flagReason.length);
test5.flagReason.forEach((flag, i) => console.log(`  ${i + 1}. ${flag}`));
console.log('\n---\n');

console.log('✅ All tests completed!');
console.log('\n📊 Summary:');
console.log(`Test 1: ${test1.flagReason.length} flags (Severity: ${test1.severity})`);
console.log(`Test 2: ${test2.flagReason.length} flags (Severity: ${test2.severity})`);
console.log(`Test 3: ${test3.flagReason.length} flags (Severity: ${test3.severity})`);
console.log(`Test 4: ${test4.flagReason.length} flags (Severity: ${test4.severity || 'NONE'})`);
console.log(`Test 5: ${test5.flagReason.length} flags (Severity: ${test5.severity})`);
