const axios = require('axios');

async function testSubmission() {
  const baseURL = 'http://localhost:3000/api';
  
  try {
    // First, try to get a lesson to test with
    console.log('📚 Getting available lessons...');
    const lessonsResponse = await axios.get(`${baseURL}/lessons`);
    const lessons = lessonsResponse.data.data;
    
    if (lessons.length === 0) {
      console.log('❌ No lessons available for testing');
      return;
    }
    
    const lesson = lessons[0];
    console.log(`✅ Found lesson: ${lesson.lesson_name} (ID: ${lesson.lesson_id})`);
    
    // Get lesson details with problems
    console.log('📋 Getting lesson details...');
    const lessonResponse = await axios.get(`${baseURL}/lessons/${lesson.lesson_id}`);
    const lessonData = lessonResponse.data.data;
    
    if (!lessonData.problems || lessonData.problems.length === 0) {
      console.log('❌ Lesson has no problems to test with');
      return;
    }
    
    console.log(`✅ Lesson has ${lessonData.problems.length} problems`);
    
    // Create a test user (if needed) or use existing test credentials
    const testUser = {
      email: 'test@example.com',
      password: 'testpass123'
    };
    
    console.log('🔐 Attempting to login...');
    let authToken;
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, testUser);
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
    } catch (loginError) {
      console.log('👤 Login failed, attempting registration...');
      try {
        const registerResponse = await axios.post(`${baseURL}/auth/register`, {
          ...testUser,
          username: 'testuser'
        });
        authToken = registerResponse.data.data.token;
        console.log('✅ Registration successful');
      } catch (registerError) {
        console.log('❌ Registration failed:', registerError.response?.data?.message);
        return;
      }
    }
    
    // Prepare submission data with new format
    const submissionId = require('uuid').v4();
    const answers = lessonData.problems.map(problem => ({
      problem_id: problem.problem_id,
      selected_option_id: problem.problem_options?.[0]?.problem_option_id || null
    }));
    
    const submissionData = {
      submission_id: submissionId,
      lesson_id: lesson.lesson_id,
      answers: answers
    };
    
    console.log('📝 Submitting answers with new schema format...');
    console.log('Submission data:', JSON.stringify(submissionData, null, 2));
    
    const submissionResponse = await axios.post(
      `${baseURL}/lessons/${lesson.lesson_id}/submit`,
      submissionData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Submission successful!');
    console.log('Result:', JSON.stringify(submissionResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testSubmission();
