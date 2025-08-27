#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

console.log('🔧 PROFILE SUBMISSION END-TO-END TEST');
console.log('=====================================');

async function testProfileSubmissionFlow() {
  try {
    // Step 1: Demo login to get token
    console.log('\n1. Getting authentication token...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    if (!token) {
      throw new Error('No token received from login');
    }
    
    console.log('✅ Authentication successful');
    
    // Step 2: Test GET talent profile (should return existing or null)
    console.log('\n2. Testing GET talent profile...');
    const getProfileResponse = await fetch(`${BASE_URL}/api/talent-profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (getProfileResponse.ok) {
      const existingProfile = await getProfileResponse.json();
      console.log('✅ GET talent profile working - Current profile:', existingProfile ? 'exists' : 'none');
    } else {
      console.log('❌ GET talent profile failed:', getProfileResponse.status);
      return false;
    }
    
    // Step 3: Test CREATE talent profile
    console.log('\n3. Testing CREATE talent profile...');
    const createProfileData = {
      currentEiQScore: "92.5",
      skillsProfile: {
        technical_skills: ["JavaScript", "Python", "React"],
        soft_skills: ["Communication", "Problem Solving"],
        languages: ["English", "Spanish"]
      },
      careerInterests: {
        preferred_industries: ["Technology", "Healthcare"],
        desired_roles: ["Software Engineer", "Data Scientist"],
        company_size_preference: "medium",
        location_preference: "remote"
      },
      availability: "immediate",
      isOpenToRecruitment: true
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/talent-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createProfileData)
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ CREATE talent profile working - Result:', createResult.success ? 'success' : 'failed');
    } else {
      console.log('❌ CREATE talent profile failed:', createResponse.status);
      const errorText = await createResponse.text();
      console.log('Error details:', errorText);
      return false;
    }
    
    // Step 4: Test UPDATE talent profile
    console.log('\n4. Testing UPDATE talent profile...');
    const updateProfileData = {
      ...createProfileData,
      currentEiQScore: "95.0",
      availability: "flexible"
    };
    
    const updateResponse = await fetch(`${BASE_URL}/api/talent-profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateProfileData)
    });
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ UPDATE talent profile working - Result:', updateResult.success ? 'success' : 'failed');
    } else {
      console.log('❌ UPDATE talent profile failed:', updateResponse.status);
      const errorText = await updateResponse.text();
      console.log('Error details:', errorText);
      return false;
    }
    
    // Step 5: Test recruitment matches
    console.log('\n5. Testing recruitment matches...');
    const matchesResponse = await fetch(`${BASE_URL}/api/recruitment-matches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (matchesResponse.ok) {
      const matches = await matchesResponse.json();
      console.log('✅ Recruitment matches working - Count:', matches.length);
    } else {
      console.log('❌ Recruitment matches failed:', matchesResponse.status);
      return false;
    }
    
    // Step 6: Test onboarding endpoint
    console.log('\n6. Testing onboarding submission...');
    const onboardingData = {
      educationalLevel: "college",
      gradeLevel: "senior",
      pathwayType: "student",
      personalInfo: { firstName: "Test", lastName: "User", age: 22 },
      educationalBackground: {
        currentLevel: "college",
        fieldOfStudy: "Computer Science",
        programmingExperience: "intermediate",
        mathBackground: "advanced"
      },
      careerGoals: {
        targetRole: "Software Engineer",
        targetCompanies: ["Google", "Microsoft"],
        salaryExpectations: "120000-160000",
        timeline: "6-months"
      },
      learningPreferences: {
        studyStyle: "hands-on",
        timeCommitment: "10-20-hours",
        preferredFormat: "interactive",
        mentorshipLevel: "high"
      },
      assessmentReadiness: {
        confidenceLevel: "high",
        previousAssessments: "yes",
        learningGoals: ["technical-skills", "career-preparation"],
        motivationLevel: "very-high"
      },
      completed: true
    };
    
    const onboardingResponse = await fetch(`${BASE_URL}/api/user/onboarding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(onboardingData)
    });
    
    if (onboardingResponse.ok) {
      const onboardingResult = await onboardingResponse.json();
      console.log('✅ Onboarding submission working - Success:', !!onboardingResult);
    } else {
      console.log('❌ Onboarding submission failed:', onboardingResponse.status);
      const errorText = await onboardingResponse.text();
      console.log('Error details:', errorText);
      return false;
    }
    
    console.log('\n🎉 ALL PROFILE SUBMISSION TESTS PASSED!');
    console.log('=====================================');
    console.log('✅ Authentication working');
    console.log('✅ Talent profile GET working');
    console.log('✅ Talent profile CREATE working');
    console.log('✅ Talent profile UPDATE working');
    console.log('✅ Recruitment matches working');
    console.log('✅ Onboarding submission working');
    console.log('\n🚀 Profile submission functionality is 100% operational!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ PROFILE SUBMISSION TEST FAILED:', error.message);
    return false;
  }
}

// Run the test
testProfileSubmissionFlow().then(success => {
  process.exit(success ? 0 : 1);
});